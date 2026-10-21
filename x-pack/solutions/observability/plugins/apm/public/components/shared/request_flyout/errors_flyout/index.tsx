/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiBadge,
  EuiBasicTable,
  EuiCallOut,
  EuiFlyout,
  EuiFlyoutBody,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiTitle,
  type EuiBasicTableColumn,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { FailedCallBucket } from '@kbn/apm-api-shared';
import { UnifiedDocViewerObservabilityTraceDocFlyout } from '@kbn/unified-doc-viewer-plugin/public';
import React, { useMemo, useState } from 'react';
import { asInteger } from '../../../../../common/utils/formatters';
import { useAdHocApmDataView } from '../../../../hooks/use_adhoc_apm_data_view';
import { isPending, useFetcher } from '../../../../hooks/use_fetcher';
import { useLogsIndexPattern } from '../../../../hooks/use_logs_index_pattern';
import { getApmInternalServices } from '../../../../plugin';
import { useServiceErrorsFromLogs } from '../../../app/error_group_overview/errors_from_logs/use_service_errors_from_logs';
import { useRequestFlyoutContext } from '../request_flyout_context';
import { groupLogErrors, type LogErrorGroup } from './group_log_errors';

interface Props {
  bucket: FailedCallBucket;
  historyKey: symbol;
  onClose: () => void;
}

interface ApmErrorGroupRow {
  groupId: string;
  name: string;
  lastSeen: number;
  occurrences: number;
  traceId?: string;
}

interface SelectedDoc {
  docId: string;
  docIndex?: string;
  traceId: string;
}

/**
 * Flyout opened from the top error of a failed-calls bucket. Mirrors the
 * errors page: APM error groups (grouped by error.grouping_key) plus error logs
 * (grouped client side for now). Built from props-only pieces because the errors
 * page components read route params and throw outside their routes.
 */
export function RequestFlyoutErrorsFlyout({ bucket, historyKey, onClose }: Props) {
  const {
    connection: { sourceServiceName, targetServiceName },
    filters: { environment, start, end, rangeFrom, rangeTo },
  } = useRequestFlyoutContext();

  // Same attribution rule as the failed-calls table: server failures belong to the target.
  const serviceName =
    bucket.type === 'server' && targetServiceName ? targetServiceName : sourceServiceName;

  const [selectedDoc, setSelectedDoc] = useState<SelectedDoc | null>(null);
  const { dataView, apmIndices } = useAdHocApmDataView();
  const { logsIndexPattern } = useLogsIndexPattern();
  const indexes = useMemo(
    () => ({
      logs: logsIndexPattern,
      apm: { traces: apmIndices?.transaction, errors: apmIndices?.error },
    }),
    [logsIndexPattern, apmIndices?.transaction, apmIndices?.error]
  );

  const { data: apmData, status: apmStatus } = useFetcher(
    (callApmApi) =>
      callApmApi('GET /internal/apm/services/{serviceName}/errors/groups/main_statistics', {
        params: {
          path: { serviceName },
          query: { environment, start, end, kuery: '' },
        },
      }),
    [serviceName, environment, start, end]
  );

  // The bucket's own error group is pinned first.
  const apmGroups: ApmErrorGroupRow[] = useMemo(() => {
    const groups = apmData?.errorGroups ?? [];
    return [...groups].sort(
      (a, b) =>
        Number(b.groupId === bucket.topErrorGroupId) - Number(a.groupId === bucket.topErrorGroupId)
    );
  }, [apmData, bucket.topErrorGroupId]);

  const { rows: logRows, isLoading: logsLoading } = useServiceErrorsFromLogs({
    serviceName,
    environment,
    kuery: '',
    rangeFrom,
    rangeTo,
  });
  const logGroups = useMemo(() => groupLogErrors(logRows), [logRows]);

  const { callApmApiForSample } = useSampleLookup({ serviceName, environment, start, end });

  const openApmGroup = async (group: ApmErrorGroupRow) => {
    const doc = await callApmApiForSample(group.groupId);
    if (doc) {
      setSelectedDoc({
        docId: doc.id,
        docIndex: doc.index,
        traceId: group.traceId ?? bucket.sampleTraceId ?? '',
      });
    }
  };

  const apmColumns: Array<EuiBasicTableColumn<ApmErrorGroupRow>> = [
    {
      field: 'name',
      name: i18n.translate('xpack.apm.requestFlyout.errors.apm.column.name', {
        defaultMessage: 'Error',
      }),
      truncateText: true,
      render: (name: string, group: ApmErrorGroupRow) => (
        <EuiLink
          data-test-subj="requestFlyoutApmErrorGroupLink"
          onClick={() => openApmGroup(group)}
        >
          {name}
        </EuiLink>
      ),
    },
    {
      field: 'occurrences',
      name: i18n.translate('xpack.apm.requestFlyout.errors.apm.column.occurrences', {
        defaultMessage: 'Occurrences',
      }),
      align: 'right' as const,
      render: (value: number) => asInteger(value),
    },
    {
      field: 'lastSeen',
      name: i18n.translate('xpack.apm.requestFlyout.errors.apm.column.lastSeen', {
        defaultMessage: 'Last seen',
      }),
      align: 'right' as const,
      render: (value: number) => new Date(value).toLocaleString(),
    },
  ];

  const logColumns: Array<EuiBasicTableColumn<LogErrorGroup>> = [
    {
      field: 'message',
      name: i18n.translate('xpack.apm.requestFlyout.errors.logs.column.message', {
        defaultMessage: 'Error',
      }),
      truncateText: true,
      render: (message: string, group: LogErrorGroup) => (
        <EuiLink
          data-test-subj="requestFlyoutLogErrorGroupLink"
          onClick={() =>
            setSelectedDoc({
              docId: group.sample.id,
              docIndex: group.sample.index,
              traceId: group.sample.traceId ?? '',
            })
          }
        >
          {message || group.type}
        </EuiLink>
      ),
    },
    {
      field: 'type',
      name: i18n.translate('xpack.apm.requestFlyout.errors.logs.column.type', {
        defaultMessage: 'Type',
      }),
      truncateText: true,
      render: (type: string) => (type ? <EuiBadge color="hollow">{type}</EuiBadge> : '—'),
    },
    {
      field: 'count',
      name: i18n.translate('xpack.apm.requestFlyout.errors.logs.column.count', {
        defaultMessage: 'Occurrences',
      }),
      align: 'right' as const,
      render: (value: number) => asInteger(value),
    },
    {
      field: 'lastSeenUs',
      name: i18n.translate('xpack.apm.requestFlyout.errors.logs.column.lastSeen', {
        defaultMessage: 'Last seen',
      }),
      align: 'right' as const,
      render: (value: number) => new Date(value / 1000).toLocaleString(),
    },
  ];

  const title = bucket.topError ?? serviceName;

  return (
    <EuiFlyout
      data-test-subj="requestFlyoutErrorsFlyout"
      onClose={onClose}
      ownFocus={false}
      // Not `fill`: EUI rejects a `fill` child (the doc viewer) under a `fill` parent.
      size="m"
      paddingSize="m"
      // Always a new session: this flyout opens the doc viewer as its own child, and EUI
      // allows only one main + one child per session, so it can't itself be a child.
      session="start"
      historyKey={historyKey}
      flyoutMenuDisplayMode="always"
      flyoutMenuProps={{ title: serviceName }}
      aria-label={serviceName}
    >
      <EuiFlyoutBody>
        <EuiTitle size="s">
          <h2>{title}</h2>
        </EuiTitle>
        <EuiText size="s" color="subdued">
          {i18n.translate('xpack.apm.requestFlyout.errors.subtitle', {
            defaultMessage: 'Errors of {service}',
            values: { service: serviceName },
          })}
        </EuiText>

        <EuiSpacer size="l" />
        <EuiTitle size="xs">
          <h3>
            {i18n.translate('xpack.apm.requestFlyout.errors.apm.title', {
              defaultMessage: 'APM errors',
            })}
          </h3>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiBasicTable
          columns={apmColumns}
          items={apmGroups}
          loading={isPending(apmStatus)}
          rowProps={(group) =>
            group.groupId === bucket.topErrorGroupId
              ? { 'data-test-subj': 'requestFlyoutTopErrorGroupRow' }
              : {}
          }
          tableCaption={i18n.translate('xpack.apm.requestFlyout.errors.apm.caption', {
            defaultMessage: 'APM error groups',
          })}
        />

        <EuiSpacer size="l" />
        <EuiTitle size="xs">
          <h3>
            {i18n.translate('xpack.apm.requestFlyout.errors.logs.title', {
              defaultMessage: 'Errors from logs',
            })}
          </h3>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiCallOut size="s" announceOnMount={false}>
          {i18n.translate('xpack.apm.requestFlyout.errors.logs.groupingNote', {
            defaultMessage:
              'Log errors are grouped by type and message over the most recent 500 log errors.',
          })}
        </EuiCallOut>
        <EuiSpacer size="s" />
        <EuiBasicTable
          columns={logColumns}
          items={logGroups}
          loading={logsLoading}
          tableCaption={i18n.translate('xpack.apm.requestFlyout.errors.logs.caption', {
            defaultMessage: 'Error logs grouped by type and message',
          })}
        />
      </EuiFlyoutBody>

      {selectedDoc && dataView && (
        <UnifiedDocViewerObservabilityTraceDocFlyout
          type="log"
          docId={selectedDoc.docId}
          docIndex={selectedDoc.docIndex}
          traceId={selectedDoc.traceId}
          dataView={dataView}
          indexes={indexes}
          onCloseFlyout={() => setSelectedDoc(null)}
          dataTestSubj="requestFlyoutErrorDocFlyout"
          size="fill"
          historyKey={historyKey}
        />
      )}
    </EuiFlyout>
  );
}

/** Resolves the first sample error id of an APM error group. */
function useSampleLookup({
  serviceName,
  environment,
  start,
  end,
}: {
  serviceName: string;
  environment: string;
  start: string;
  end: string;
}) {
  const { callApmApi } = getApmInternalServices();
  return {
    callApmApiForSample: async (
      groupId: string
    ): Promise<{ id: string; index: string } | undefined> => {
      const res = await callApmApi(
        'GET /internal/apm/services/{serviceName}/errors/{groupId}/samples',
        {
          params: {
            path: { serviceName, groupId },
            query: { environment, start, end, kuery: '' },
          },
          signal: null,
        }
      );
      // `errorSampleIds` holds error.id; the doc viewer fetches by the Elasticsearch _id.
      return res.errorSampleDocs?.[0];
    },
  };
}
