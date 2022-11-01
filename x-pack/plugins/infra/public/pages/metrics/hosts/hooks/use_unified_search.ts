/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { useKibana } from '@kbn/kibana-react-plugin/public';
import createContainer from 'constate';
import { useCallback, useEffect, useReducer } from 'react';
import { buildEsQuery, Filter, Query, TimeRange } from '@kbn/es-query';
import DateMath from '@kbn/datemath';
import deepEqual from 'fast-deep-equal';
import * as rt from 'io-ts';
import { pipe } from 'fp-ts/lib/pipeable';
import { fold } from 'fp-ts/lib/Either';
import { constant, identity } from 'fp-ts/lib/function';
import type { SavedQuery } from '@kbn/data-plugin/public';
import { enumeration } from '@kbn/securitysolution-io-ts-types';
import { FilterStateStore } from '@kbn/es-query';
import { debounce } from 'lodash';
import type { InfraClientStartDeps } from '../../../../types';
import { useMetricsDataViewContext } from './use_data_view';
import {
  useKibanaTimefilterTime,
  useSyncKibanaTimeFilterTime,
} from '../../../../hooks/use_kibana_timefilter_time';
import { useUrlState } from '../../../../utils/use_url_state';

const DEFAULT_FROM_MINUTES_VALUE = 15;

const INITIAL_DATE = new Date();
const INITIAL_DATE_RANGE = { from: 'now-15m', to: 'now' };

// with this approach, all state will be in one variable in the url
const INITIAL_HOSTS_STATE: HostsState = {
  query: {
    language: 'kuery',
    query: '',
  },
  filters: [],
  // for unified search
  dateRange: { ...INITIAL_DATE_RANGE },
  // for useSnapshot
  dateRangeTimestamp: {
    from: new Date(INITIAL_DATE.getMinutes() - DEFAULT_FROM_MINUTES_VALUE).getTime(),
    to: INITIAL_DATE.getTime(),
  },
};

type Action =
  | {
      type: 'setQuery';
      payload: rt.TypeOf<typeof SetQueryType>;
    }
  | { type: 'setFilter'; payload: rt.TypeOf<typeof HostsFiltersRT> };

const reducer = (state: HostsState, action: Action): HostsState => {
  switch (action.type) {
    case 'setFilter':
      return { ...state, filters: action.payload };
    case 'setQuery':
      const { filters, ...payload } = action.payload;
      const newFilters = !filters ? state.filters : filters;
      return {
        ...state,
        ...payload,
        filters: [...newFilters],
      };
    default:
      throw new Error();
  }
};

export const useUnifiedSearch = () => {
  const [urlState, setUrlState] = useUrlState<HostsState>({
    defaultState: INITIAL_HOSTS_STATE,
    decodeUrlState,
    encodeUrlState,
    urlStateKey: '_a', // TBD
  });

  const [state, dispatch] = useReducer(reducer, urlState);

  const [getTime] = useKibanaTimefilterTime(INITIAL_DATE_RANGE);

  const { metricsDataView } = useMetricsDataViewContext();
  const { services } = useKibana<InfraClientStartDeps>();
  const {
    data: { query: queryManager },
  } = services;

  useSyncKibanaTimeFilterTime(INITIAL_DATE_RANGE, {
    from: state.dateRange.from,
    to: state.dateRange.to,
  });

  const { queryString, filterManager } = queryManager;

  const getRangeInTimestamp = useCallback(({ from, to }: TimeRange) => {
    const fromTS = DateMath.parse(from)?.valueOf() ?? 0;
    const toTS = DateMath.parse(to)?.valueOf() ?? 0;

    return {
      from: fromTS,
      to: toTS,
    };
  }, []);

  useEffect(() => {
    if (!deepEqual(state, urlState)) {
      setUrlState(state);
    }
  }, [setUrlState, state, urlState]);

  const queryToString = (query?: Query) =>
    (typeof query?.query !== 'string' ? JSON.stringify(query?.query) : query?.query) ?? '';

  const onSubmit = useCallback(
    (query?: Query, dateRange?: TimeRange, filters?: Filter[]) => {
      if (query || dateRange || filters) {
        const newDateRange = dateRange ?? getTime();

        if (filters) {
          // We need to pass the filter to `setFilter` so that the proper object can be created
          filterManager.setFilters(filters);
        }

        // Having only one setter, decreases the possiblity of rerendering too many times.
        // I especially had more problems with dateRangeTimestamp, because it needs to be converted - and this conversion caused more rerenders
        // Another advantage of managing the Unified Search state in this hooks is that we don't need an extra useEffect to
        // get the state from the url into Unified Search state through queryString and filterManager
        dispatch({
          type: 'setQuery',
          payload: {
            query,
            filters: filters ? filterManager.getFilters() : undefined, // if here is undefined, reducer will handle what value the state needs to have
            dateRange: newDateRange,
            dateRangeTimestamp: getRangeInTimestamp(newDateRange),
          },
        });
      }
    },
    [filterManager, getRangeInTimestamp, getTime]
  );

  // This won't prevent onSubmit from being fired when `clear filters` is clicked,
  // that happens because both onQuerySubmit and onFiltersUpdated are internally triggered on same event by SearchBar.
  // This justs delays potential duplicate onSubmit calls
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceOnSubmit = useCallback(debounce(onSubmit, 100), [onSubmit]);

  const saveQuery = useCallback(
    (newSavedQuery: SavedQuery) => {
      const savedQueryFilters = newSavedQuery.attributes.filters ?? [];
      const globalFilters = filterManager.getGlobalFilters();

      const query = newSavedQuery.attributes.query;

      dispatch({
        type: 'setQuery',
        payload: {
          query,
          filters: [...savedQueryFilters, ...globalFilters],
        },
      });
    },
    [filterManager]
  );

  const clearSavedQUery = useCallback(() => {
    dispatch({
      type: 'setFilter',
      payload: filterManager.getGlobalFilters(),
    });
  }, [filterManager]);

  const buildQuery = useCallback(() => {
    if (!metricsDataView) {
      return null;
    }
    return buildEsQuery(metricsDataView, state.query, state.filters);
  }, [metricsDataView, state.filters, state.query]);

  return {
    dateRangeTimestamp: state.dateRangeTimestamp,
    buildQuery,
    onSubmit: debounceOnSubmit,
    saveQuery,
    clearSavedQUery,
    // we'll use the hooks state instad of unified searchs's
    unifiedSearchQuery: state.query,
    unifiedSearchDateRange: getTime(),
    unifiedSearchFilters: state.filters,
  };
};

export const HostsFilterRT = rt.intersection([
  rt.partial({
    $state: rt.type({
      store: enumeration('FilterStateStore', FilterStateStore),
    }),
  }),
  rt.type({
    meta: rt.partial({
      alias: rt.union([rt.null, rt.string]),
      disabled: rt.boolean,
      negate: rt.boolean,
      controlledBy: rt.string,
      group: rt.string,
      index: rt.string,
      isMultiIndex: rt.boolean,
      type: rt.string,
      key: rt.string,
      params: rt.any,
      value: rt.any,
    }),
  }),
  rt.partial({
    query: rt.record(rt.string, rt.any),
  }),
]);

const HostsFiltersRT = rt.array(HostsFilterRT);

export const HostsQueryStateRT = rt.type({
  language: rt.string,
  query: rt.any,
});

export const StringDateRangeRT = rt.type({
  from: rt.string,
  to: rt.string,
});

export const DateRangeRT = rt.type({
  from: rt.number,
  to: rt.number,
});

export const HostsStateRT = rt.type({
  filters: HostsFiltersRT,
  query: HostsQueryStateRT,
  dateRange: StringDateRangeRT,
  dateRangeTimestamp: DateRangeRT,
});

export type HostsState = rt.TypeOf<typeof HostsStateRT>;

const SetQueryType = rt.partial({
  query: HostsQueryStateRT,
  dateRange: StringDateRangeRT,
  filters: HostsFiltersRT,
  dateRangeTimestamp: DateRangeRT,
});

const encodeUrlState = HostsStateRT.encode;
const decodeUrlState = (value: unknown) => {
  return pipe(HostsStateRT.decode(value), fold(constant(undefined), identity));
};

export const UnifiedSearch = createContainer(useUnifiedSearch);
export const [UnifiedSearchProvider, useUnifiedSearchContext] = UnifiedSearch;
