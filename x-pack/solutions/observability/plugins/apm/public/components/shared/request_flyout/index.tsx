/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useGeneratedHtmlId } from '@elastic/eui';
import React, { useMemo } from 'react';
import type { CoreStart } from '@kbn/core/public';
import type { LensPublicStart } from '@kbn/lens-plugin/public';
import type { SharePublicStart } from '@kbn/share-plugin/public/plugin';
import type { DataViewsPublicPluginStart } from '@kbn/data-views-plugin/public';
import type { Environment } from '../../../../common/environment_rt';
import { TimeRangeMetadataContextProvider } from '../../../context/time_range_metadata/time_range_metadata_context';
import { useTimeRange } from '../../../hooks/use_time_range';
import { ResponsiveFlyout } from '../responsive_flyout';
import { RequestFlyoutHeader } from './header';
import { RequestFlyoutNoMetricsMessage } from './no_metrics_message';
import { RequestFlyoutContent } from './request_flyout_content';
import { RequestFlyoutContextProvider } from './request_flyout_context';
import type { RequestFlyoutConnection } from './types';

interface RequestFlyoutProps {
  deps: {
    core: CoreStart;
    share?: SharePublicStart;
    lens?: LensPublicStart;
    dataViews?: DataViewsPublicPluginStart;
  };
  connection: RequestFlyoutConnection;
  environment: Environment;
  rangeFrom: string;
  rangeTo: string;
  onClose: () => void;
}

export function RequestFlyout({
  deps,
  connection,
  environment,
  rangeFrom,
  rangeTo,
  onClose,
}: RequestFlyoutProps) {
  const titleId = useGeneratedHtmlId({ prefix: 'requestFlyoutTitle' });

  const { start, end } = useTimeRange({ rangeFrom, rangeTo });

  const title = `${connection.sourceLabel} → ${connection.targetLabel}`;

  const contextValue = useMemo(
    () => ({
      deps,
      connection,
      filters: {
        environment,
        start,
        end,
        rangeFrom,
        rangeTo,
      },
    }),
    [deps, connection, environment, start, end, rangeFrom, rangeTo]
  );

  // Stable history key so the main flyout and its child flyouts form one EUI flyout session.
  const historyKey = useMemo(() => Symbol('apmRequestFlyout'), []);

  return (
    <RequestFlyoutContextProvider value={contextValue}>
      <TimeRangeMetadataContextProvider
        uiSettings={deps.core.uiSettings}
        start={start}
        end={end}
        kuery=""
        useSpanName={false}
      >
        <ResponsiveFlyout
          data-test-subj="requestFlyout"
          flyoutMenuDisplayMode="always"
          onClose={onClose}
          ownFocus={false}
          size="m"
          session="start"
          historyKey={historyKey}
          flyoutMenuProps={{ title }}
          aria-labelledby={titleId}
        >
          <RequestFlyoutHeader title={title} titleId={titleId} />

          {connection.isMessagingConsumer ? (
            <RequestFlyoutNoMetricsMessage />
          ) : (
            <RequestFlyoutContent childSession="inherit" historyKey={historyKey} />
          )}
        </ResponsiveFlyout>
      </TimeRangeMetadataContextProvider>
    </RequestFlyoutContextProvider>
  );
}
