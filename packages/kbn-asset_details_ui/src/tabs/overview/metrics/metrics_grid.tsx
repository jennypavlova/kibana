/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { EuiFlexItem, EuiFlexGrid } from '@elastic/eui';
import type { TimeRange } from '@kbn/es-query';
import type { ChartModel } from '@kbn/lens-embeddable-utils';
import { Chart } from './chart';

interface Props {
  assetName: string;
  dateRange: TimeRange;
  filterFieldName: string;
  charts: ChartModel[];
  ['data-test-subj']: string;
}

export const MetricsGrid = ({ assetName, dateRange, filterFieldName, charts, ...props }: Props) => {
  return (
    <EuiFlexGrid columns={2} gutterSize="s" data-test-subj={`${props['data-test-subj']}Grid`}>
      {charts.map((chartProp, index) => (
        <EuiFlexItem key={index} grow={false}>
          <Chart
            {...chartProp}
            assetName={assetName}
            dateRange={dateRange}
            filterFieldName={filterFieldName}
            data-test-subj={props['data-test-subj']}
          />
        </EuiFlexItem>
      ))}
    </EuiFlexGrid>
  );
};
