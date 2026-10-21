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
import { useServiceErrorsFromLogs } from '../../../app/error_group_overview/errors_from_logs/use_service_errors_from_logs';
import { RequestFlyoutApmErrorGroupFlyout } from '../apm_error_group_flyout';
import { ExpandableNameCell } from '../expandable_name_cell';
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

/** The single child flyout of the errors flyout: an APM error group or a log error document. */
type SelectedChild =
  | { kind: 'apm'; groupId: string; name: string }
  | { kind: 'log'; key: string; docId: string; docIndex?: string; traceId: string };

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

  const [selected, setSelected] = useState<SelectedChild | null>(null);
  const toggle = (child: SelectedChild) =>
    setSelected((prev) => (isSameChild(prev, child) ? null : child));
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

  const apmColumns: Array<EuiBasicTableColumn<ApmErrorGroupRow>> = [
    {
      field: 'name',
      width: '40%',
      name: i18n.translate('xpack.apm.requestFlyout.errors.apm.column.name', {
        defaultMessage: 'Error',
      }),
      render: (name: string, group: ApmErrorGroupRow) => {
        const child: SelectedChild = { kind: 'apm', groupId: group.groupId, name };
        return (
          <ExpandableNameCell
            data-test-subj="requestFlyoutApmErrorGroupLink"
            name={name}
            isExpanded={isSameChild(selected, child)}
            onClick={() => toggle(child)}
          />
        );
      },
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
      width: '40%',
      name: i18n.translate('xpack.apm.requestFlyout.errors.logs.column.message', {
        defaultMessage: 'Error',
      }),
      render: (message: string, group: LogErrorGroup) => {
        const child: SelectedChild = {
          kind: 'log',
          key: group.key,
          docId: group.sample.id,
          docIndex: group.sample.index,
          traceId: group.sample.traceId ?? '',
        };
        return (
          <ExpandableNameCell
            data-test-subj="requestFlyoutLogErrorGroupLink"
            name={message || group.type}
            isExpanded={isSameChild(selected, child)}
            onClick={() => toggle(child)}
          />
        );
      },
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
      // Not `fill`: EUI rejects a `fill` child (the APM error group or the doc viewer) under a
      // `fill` parent.
      size="m"
      paddingSize="m"
      // Always a new session: this flyout opens its details as its own child, and EUI
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

      {selected?.kind === 'apm' && (
        <RequestFlyoutApmErrorGroupFlyout
          serviceName={serviceName}
          groupId={selected.groupId}
          groupName={selected.name}
          historyKey={historyKey}
          onClose={() => setSelected(null)}
        />
      )}

      {selected?.kind === 'log' && dataView && (
        <UnifiedDocViewerObservabilityTraceDocFlyout
          type="log"
          docId={selected.docId}
          docIndex={selected.docIndex}
          traceId={selected.traceId}
          dataView={dataView}
          indexes={indexes}
          onCloseFlyout={() => setSelected(null)}
          dataTestSubj="requestFlyoutErrorDocFlyout"
          size="fill"
          historyKey={historyKey}
        />
      )}
    </EuiFlyout>
  );
}

const isSameChild = (a: SelectedChild | null, b: SelectedChild) =>
  !!a &&
  a.kind === b.kind &&
  (a.kind === 'apm' ? a.groupId === (b as typeof a).groupId : a.key === (b as typeof a).key);
