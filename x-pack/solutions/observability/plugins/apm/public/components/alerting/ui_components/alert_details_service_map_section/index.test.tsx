/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { EuiProvider } from '@elastic/eui';
import { ALERT_END, ALERT_RULE_TYPE_ID, ALERT_START, ApmRuleType } from '@kbn/rule-data-utils';
import { TIME_UNITS } from '@kbn/triggers-actions-ui-plugin/public';
import { getPaddedAlertTimeRange } from '@kbn/observability-get-padded-alert-time-range-util';
import {
  ANOMALY_TIMESTAMP,
  SERVICE_ENVIRONMENT,
  SERVICE_NAME,
  TRANSACTION_NAME,
  TRANSACTION_TYPE,
} from '../../../../../common/es_fields/apm';
import { LatencyAggregationType } from '../../../../../common/latency_aggregation_types';
import { SERVICE_FLYOUT_SOURCES } from '../../../shared/service_flyout/constants';
import type { ServiceFlyoutOptions } from '../../../shared/service_flyout/types';
import type { AlertDetailsAppSectionProps } from '../alert_details_app_section/types';
import { AlertDetailsServiceMapSection } from '.';

const mockUseApmEmbeddableDeps = jest.fn();

jest.mock('../../context/apm_embeddable_deps_context', () => ({
  useApmEmbeddableDeps: () => mockUseApmEmbeddableDeps(),
}));

jest.mock('../../../../embeddable/embeddable_context', () => ({
  ApmEmbeddableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockServiceMapEmbeddable = jest.fn((_props: unknown) => (
  <div data-test-subj="mockServiceMapEmbeddable" />
));

jest.mock('../../../../embeddable/service_map/service_map_embeddable', () => ({
  ServiceMapEmbeddable: (props: unknown) => mockServiceMapEmbeddable(props as never),
}));

jest.mock('../../../../embeddable/service_map/get_service_map_url', () => ({
  getServiceMapUrl: jest.fn(() => '/app/apm/service-map'),
}));

function makeAlert(
  fields: Partial<AlertDetailsAppSectionProps['alert']['fields']> = {}
): AlertDetailsAppSectionProps['alert'] {
  return {
    fields: {
      [ALERT_START]: '2024-01-15T13:00:00.000Z',
      [ALERT_END]: '2024-01-15T13:05:00.000Z',
      [SERVICE_NAME]: 'opbeans-node',
      [SERVICE_ENVIRONMENT]: 'production',
      [TRANSACTION_TYPE]: 'request',
      [TRANSACTION_NAME]: 'GET /api/users',
      ...fields,
    },
  } as unknown as AlertDetailsAppSectionProps['alert'];
}

function makeProps(
  alert: AlertDetailsAppSectionProps['alert'] = makeAlert(),
  ruleParams: Partial<AlertDetailsAppSectionProps['rule']['params']> = {}
): AlertDetailsAppSectionProps {
  return {
    alert,
    rule: {
      params: {
        environment: 'production',
        aggregationType: 'avg',
        windowSize: 1,
        windowUnit: TIME_UNITS.MINUTE,
        ...ruleParams,
      },
    } as AlertDetailsAppSectionProps['rule'],
    timeZone: 'UTC',
    setSources: () => {},
  };
}

function renderComponent(
  alert: AlertDetailsAppSectionProps['alert'] = makeAlert(),
  ruleParams: Partial<AlertDetailsAppSectionProps['rule']['params']> = {}
) {
  mockUseApmEmbeddableDeps.mockReturnValue({
    coreStart: {
      http: { basePath: { prepend: (path: string) => path } },
    },
  });

  return render(
    <EuiProvider>
      <AlertDetailsServiceMapSection {...makeProps(alert, ruleParams)} />
    </EuiProvider>
  );
}

function getEmbeddableFlyoutOptions() {
  expect(mockServiceMapEmbeddable).toHaveBeenCalled();
  const [props] = mockServiceMapEmbeddable.mock.calls.at(-1) as unknown as [
    { flyoutOptions: ServiceFlyoutOptions }
  ];
  return props.flyoutOptions;
}

describe('AlertDetailsServiceMapSection flyoutOptions', () => {
  const alertStart = '2024-01-15T13:00:00.000Z';
  const alertEnd = '2024-01-15T13:05:00.000Z';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inherits the rule latency aggregation type and the alert transaction type', () => {
    renderComponent(makeAlert(), { aggregationType: '95th' });

    expect(getEmbeddableFlyoutOptions()).toEqual(
      expect.objectContaining({
        latencyAggregationType: LatencyAggregationType.p95,
        initialTransactionType: 'request',
        source: SERVICE_FLYOUT_SOURCES.alertDetails,
      })
    );
  });

  it('defaults to average latency when the rule has no aggregation type', () => {
    renderComponent(makeAlert(), { aggregationType: undefined });

    expect(getEmbeddableFlyoutOptions().latencyAggregationType).toBe(LatencyAggregationType.avg);
  });

  it('pads the range from the alert start for non-anomaly alerts', () => {
    renderComponent();

    const expected = getPaddedAlertTimeRange(alertStart, alertEnd);
    expect(getEmbeddableFlyoutOptions()).toEqual(
      expect.objectContaining({ rangeFrom: expected.from, rangeTo: expected.to })
    );
  });

  it('anchors the padded range on the anomaly timestamp for anomaly alerts', () => {
    const anomalyTimestamp = '2024-01-15T12:30:00.000Z';
    renderComponent(
      makeAlert({
        [ALERT_RULE_TYPE_ID]: ApmRuleType.Anomaly,
        [ANOMALY_TIMESTAMP]: anomalyTimestamp,
      })
    );

    const expected = getPaddedAlertTimeRange(anomalyTimestamp, alertEnd);
    expect(getEmbeddableFlyoutOptions()).toEqual(
      expect.objectContaining({ rangeFrom: expected.from, rangeTo: expected.to })
    );
  });

  it('ignores the anomaly timestamp for non-anomaly alerts', () => {
    renderComponent(makeAlert({ [ANOMALY_TIMESTAMP]: '2024-01-15T12:30:00.000Z' }));

    const expected = getPaddedAlertTimeRange(alertStart, alertEnd);
    expect(getEmbeddableFlyoutOptions().rangeFrom).toBe(expected.from);
  });
});
