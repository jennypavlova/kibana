/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiBadge,
  EuiBasicTable,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
  type EuiBasicTableColumn,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { DependencySpan } from '@kbn/apm-api-shared';
import React, { useMemo, useState } from 'react';
import {
  asMillisecondDuration,
  asPercent,
  asTransactionRate,
} from '../../../../../common/utils/formatters';
import { isPending, useFetcher, FETCH_STATUS } from '../../../../hooks/use_fetcher';
import { ChartPointerEventContextProvider } from '../../../../context/chart_pointer_event/chart_pointer_event_context';
import { TraceWaterfallFlyout } from '../../../app/transaction_details/waterfall_with_summary/trace_waterfall_flyout';
import { TransactionTab } from '../../../app/transaction_details/waterfall_with_summary/transaction_tabs';
import { useApmRouter } from '../../../../hooks/use_apm_router';
import { ChartType, getTimeSeriesColor } from '../../charts/helper/get_timeseries_color';
import { getTimeZone } from '../../charts/helper/timezone';
import { TimeseriesChart } from '../../charts/timeseries_chart';
import { getMaxY, getResponseTimeTickFormatter } from '../../charts/transaction_charts/helper';
import { getDurationFormatter } from '../../../../../common/utils/formatters';
import { useRequestFlyoutContext } from '../request_flyout_context';
import type { RequestFlyoutChildSession } from '../request_flyout_content';

const CHART_HEIGHT = 160;

interface Props {
  spanName: string;
  dependencyName: string;
  session: RequestFlyoutChildSession;
  historyKey: symbol;
  onClose: () => void;
}

/**
 * Child flyout with the dependency operation detail, scoped to the source
 * service. Route-free replacement for the /dependencies/operation page: the
 * page components read route params and throw outside their routes, so this
 * calls the same APIs directly and renders plain charts.
 */
export function RequestFlyoutOperationDetailFlyout({
  spanName,
  dependencyName,
  session,
  historyKey,
  onClose,
}: Props) {
  const {
    deps: { core },
    connection: { sourceServiceName },
    filters: { environment, start, end, rangeFrom, rangeTo },
  } = useRequestFlyoutContext();

  const kuery = `service.name : "${sourceServiceName}"`;
  const timeZone = getTimeZone(core.uiSettings);
  const { link } = useApmRouter();
  // Full-page escape hatch, pre-scoped to the source service.
  const operationPageHref = link('/dependencies/operation', {
    query: {
      dependencyName,
      spanName,
      environment,
      rangeFrom,
      rangeTo,
      kuery,
      comparisonEnabled: false,
      detailTab: TransactionTab.timeline,
      showCriticalPath: false,
    },
  });
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  const { data: latency, status: latencyStatus } = useFetcher(
    (callApmApi) =>
      callApmApi('GET /internal/apm/dependencies/charts/latency', {
        params: {
          query: { dependencyName, spanName, environment, start, end, kuery, offset: undefined },
        },
      }),
    [dependencyName, spanName, environment, start, end, kuery]
  );
  const { data: throughput, status: throughputStatus } = useFetcher(
    (callApmApi) =>
      callApmApi('GET /internal/apm/dependencies/charts/throughput', {
        params: {
          query: { dependencyName, spanName, environment, start, end, kuery, offset: undefined },
        },
      }),
    [dependencyName, spanName, environment, start, end, kuery]
  );
  const { data: errorRate, status: errorRateStatus } = useFetcher(
    (callApmApi) =>
      callApmApi('GET /internal/apm/dependencies/charts/error_rate', {
        params: {
          query: { dependencyName, spanName, environment, start, end, kuery, offset: undefined },
        },
      }),
    [dependencyName, spanName, environment, start, end, kuery]
  );
  const { data: spansData, status: spansStatus } = useFetcher(
    (callApmApi) =>
      callApmApi('GET /internal/apm/dependencies/operations/spans', {
        params: { query: { dependencyName, spanName, environment, start, end, kuery } },
      }),
    [dependencyName, spanName, environment, start, end, kuery]
  );

  const series = (
    data: Array<{ x: number; y: number | null }> | undefined,
    chartType: ChartType,
    title: string
  ) =>
    data
      ? [
          {
            data,
            type: 'linemark' as const,
            color: getTimeSeriesColor(chartType).currentPeriodColor,
            title,
          },
        ]
      : [];

  const latencySeries = useMemo(
    () =>
      series(
        latency?.currentTimeseries,
        ChartType.LATENCY_AVG,
        i18n.translate('xpack.apm.requestFlyout.operationDetail.latency', {
          defaultMessage: 'Latency',
        })
      ),
    [latency]
  );
  const throughputSeries = useMemo(
    () =>
      series(
        throughput?.currentTimeseries,
        ChartType.THROUGHPUT,
        i18n.translate('xpack.apm.requestFlyout.operationDetail.throughput', {
          defaultMessage: 'Throughput',
        })
      ),
    [throughput]
  );
  const errorRateSeries = useMemo(
    () =>
      series(
        errorRate?.currentTimeseries,
        ChartType.FAILED_TRANSACTION_RATE,
        i18n.translate('xpack.apm.requestFlyout.operationDetail.failedRate', {
          defaultMessage: 'Failed',
        })
      ),
    [errorRate]
  );
  const latencyFormatter = getDurationFormatter(getMaxY(latencySeries));

  const columns: Array<EuiBasicTableColumn<DependencySpan>> = [
    {
      field: '@timestamp',
      name: i18n.translate('xpack.apm.requestFlyout.operationDetail.samples.timestamp', {
        defaultMessage: 'Timestamp',
      }),
      render: (ts: number) => new Date(ts).toLocaleString(),
    },
    {
      field: 'duration',
      name: i18n.translate('xpack.apm.requestFlyout.operationDetail.samples.duration', {
        defaultMessage: 'Duration',
      }),
      align: 'right' as const,
      render: (duration: number) => asMillisecondDuration(duration),
    },
    {
      field: 'outcome',
      name: i18n.translate('xpack.apm.requestFlyout.operationDetail.samples.outcome', {
        defaultMessage: 'Outcome',
      }),
      render: (outcome: string) => (
        <EuiBadge color={outcome === 'failure' ? 'danger' : 'success'}>{outcome}</EuiBadge>
      ),
    },
    {
      field: 'transactionName',
      name: i18n.translate('xpack.apm.requestFlyout.operationDetail.samples.transaction', {
        defaultMessage: 'Transaction',
      }),
      truncateText: true,
      render: (name: string | undefined, span: DependencySpan) => (
        <EuiLink
          data-test-subj="requestFlyoutOperationSampleLink"
          onClick={() => setSelectedTraceId(span.traceId)}
        >
          {name ?? span.traceId}
        </EuiLink>
      ),
    },
  ];

  return (
    <>
      <EuiFlyout
        data-test-subj="requestFlyoutOperationDetail"
        onClose={onClose}
        ownFocus={false}
        size="fill"
        paddingSize="m"
        session={session}
        historyKey={historyKey}
        flyoutMenuDisplayMode="always"
        flyoutMenuProps={{ title: spanName }}
        aria-label={spanName}
      >
        <EuiFlyoutBody>
          <EuiTitle size="s">
            <h2>{spanName}</h2>
          </EuiTitle>
          <EuiText size="s" color="subdued">
            {i18n.translate('xpack.apm.requestFlyout.operationDetail.subtitle', {
              defaultMessage: '{dependency} · calls from {service}',
              values: { dependency: dependencyName, service: sourceServiceName },
            })}
          </EuiText>
          <EuiSpacer size="m" />
          <ChartPointerEventContextProvider>
            <EuiFlexGroup gutterSize="m" responsive={false} wrap>
              <EuiFlexItem css={{ minWidth: 220 }}>
                <ChartPanel
                  title={i18n.translate('xpack.apm.requestFlyout.operationDetail.latency', {
                    defaultMessage: 'Latency',
                  })}
                >
                  <TimeseriesChart
                    settings={{ showLegend: false }}
                    id="requestFlyoutOperationLatency"
                    height={CHART_HEIGHT}
                    fetchStatus={latencyStatus}
                    timeseries={latencySeries}
                    yLabelFormat={getResponseTimeTickFormatter(latencyFormatter)}
                    comparisonEnabled={false}
                    timeZone={timeZone}
                    showAnnotations={false}
                  />
                </ChartPanel>
              </EuiFlexItem>
              <EuiFlexItem css={{ minWidth: 220 }}>
                <ChartPanel
                  title={i18n.translate('xpack.apm.requestFlyout.operationDetail.throughput', {
                    defaultMessage: 'Throughput',
                  })}
                >
                  <TimeseriesChart
                    settings={{ showLegend: false }}
                    id="requestFlyoutOperationThroughput"
                    height={CHART_HEIGHT}
                    fetchStatus={throughputStatus}
                    timeseries={throughputSeries}
                    yLabelFormat={(y) => asTransactionRate(y ?? 0)}
                    comparisonEnabled={false}
                    timeZone={timeZone}
                    showAnnotations={false}
                  />
                </ChartPanel>
              </EuiFlexItem>
              <EuiFlexItem css={{ minWidth: 220 }}>
                <ChartPanel
                  title={i18n.translate('xpack.apm.requestFlyout.operationDetail.failedRate', {
                    defaultMessage: 'Failed',
                  })}
                >
                  <TimeseriesChart
                    settings={{ showLegend: false }}
                    id="requestFlyoutOperationErrorRate"
                    height={CHART_HEIGHT}
                    fetchStatus={errorRateStatus}
                    timeseries={errorRateSeries}
                    yLabelFormat={(y) => asPercent(y || 0, 1)}
                    comparisonEnabled={false}
                    timeZone={timeZone}
                    showAnnotations={false}
                  />
                </ChartPanel>
              </EuiFlexItem>
            </EuiFlexGroup>
          </ChartPointerEventContextProvider>

          <EuiSpacer size="l" />
          <EuiTitle size="xs">
            <h3>
              {i18n.translate('xpack.apm.requestFlyout.operationDetail.samplesTitle', {
                defaultMessage: 'Trace samples',
              })}
            </h3>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiBasicTable
            columns={columns}
            items={spansData?.spans ?? []}
            loading={isPending(spansStatus) && spansStatus !== FETCH_STATUS.NOT_INITIATED}
            tableCaption={i18n.translate('xpack.apm.requestFlyout.operationDetail.samplesCaption', {
              defaultMessage: 'Trace samples of the operation',
            })}
            data-test-subj="requestFlyoutOperationSamples"
          />
        </EuiFlyoutBody>
        <EuiFlyoutFooter>
          <EuiLink href={operationPageHref} data-test-subj="requestFlyoutOperationOpenPage">
            {i18n.translate('xpack.apm.requestFlyout.operationDetail.openPage', {
              defaultMessage: 'Open operation page',
            })}
          </EuiLink>
        </EuiFlyoutFooter>
      </EuiFlyout>

      {selectedTraceId && (
        <TraceWaterfallFlyout
          traceId={selectedTraceId}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          start={start}
          end={end}
          isOpen
          onClose={() => setSelectedTraceId(null)}
          historyKey={historyKey}
          deps={{ core }}
        />
      )}
    </>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <EuiPanel hasBorder hasShadow={false} paddingSize="s">
      <EuiTitle size="xxs">
        <h4>{title}</h4>
      </EuiTitle>
      {children}
    </EuiPanel>
  );
}
