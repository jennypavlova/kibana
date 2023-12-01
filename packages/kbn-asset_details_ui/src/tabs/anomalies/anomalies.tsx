/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useMemo, useRef } from 'react';
import { AnomaliesTable } from '../../../../pages/metrics/inventory_view/components/ml/anomaly_detection/anomalies_table/anomalies_table';
import { useAssetDetailsRenderPropsContext } from '../../hooks_wip/use_asset_details_render_props';
import { useDatePickerContext } from '../../hooks_wip/use_date_picker';
import { useIntersectingState } from '../../hooks_wip/use_intersecting_state';
import { useRequestObservable } from '../../hooks_wip/use_request_observable';

export const Anomalies = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { request$ } = useRequestObservable();
  const { getParsedDateRange } = useDatePickerContext();
  const { asset, overrides } = useAssetDetailsRenderPropsContext();
  const { onClose = () => {} } = overrides?.anomalies ?? {};

  const parsedDateRange = useMemo(() => getParsedDateRange(), [getParsedDateRange]);
  const state = useIntersectingState(ref, {
    parsedDateRange,
  });

  return (
    <div ref={ref}>
      <AnomaliesTable
        closeFlyout={onClose}
        hostName={asset.name}
        dateRange={state.parsedDateRange}
        hideDatePicker
        request$={request$}
      />
    </div>
  );
};
