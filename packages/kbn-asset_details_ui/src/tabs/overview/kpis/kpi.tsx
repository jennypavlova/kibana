/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useMemo } from 'react';

import type { DataView } from '@kbn/data-views-plugin/public';
import { TimeRange } from '@kbn/es-query';
import { ChartModel } from '@kbn/lens-embeddable-utils';
import { METRICS_TOOLTIP } from '../../../../../common/visualizations';
import { LensChart, TooltipContent } from '../../../../lens';
import { buildCombinedHostsFilter } from '../../../../../utils/filters/build';
import { useLoadingStateContext } from '../../../hooks_wip/use_loading_state';

export const Kpi = ({
  id,
  height,
  assetName,
  dateRange,
  dataView,
  ...chartProps
}: ChartModel & {
  height: number;
  dataView?: DataView;
  assetName: string;
  dateRange: TimeRange;
}) => {
  const { searchSessionId } = useLoadingStateContext();
  const filters = useMemo(() => {
    return [
      buildCombinedHostsFilter({
        field: 'host.name',
        values: [assetName],
        dataView,
      }),
    ];
  }, [dataView, assetName]);

  const tooltipContent = useMemo(
    () =>
      id in METRICS_TOOLTIP ? (
        <TooltipContent description={METRICS_TOOLTIP[id as keyof typeof METRICS_TOOLTIP]} />
      ) : undefined,
    [id]
  );

  return (
    <LensChart
      {...chartProps}
      id={`infraAssetDetailsKPI${id}`}
      dataView={dataView}
      dateRange={dateRange}
      height={height}
      filters={filters}
      toolTip={tooltipContent}
      searchSessionId={searchSessionId}
      disableTriggers
      hidePanelTitles
    />
  );
};
