/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiBadge, EuiBasicTable, EuiText, type EuiBasicTableColumn } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import React, { useMemo } from 'react';
import {
  asMillisecondDuration,
  asPercent,
  asTransactionRate,
} from '../../../../../common/utils/formatters';
import { isPending, useFetcher } from '../../../../hooks/use_fetcher';
import { ImpactBar } from '../../impact_bar';
import { ExpandableNameCell } from '../expandable_name_cell';
import { useRequestFlyoutChild } from '../request_flyout_child';
import { useRequestFlyoutContext } from '../request_flyout_context';
import { getTopResources, type ResourceRow } from './get_top_resources';

const TOP_N = 10;

/**
 * Resource list of a grouped edge (service → N resources of the same type).
 * One row per resource with the source service's calls to it; the row opens a
 * child flyout scoped to that resource. Operations and errors are only shown
 * in that child so this table stays small however many resources are grouped.
 */
export function RequestFlyoutResources() {
  const {
    connection: { sourceServiceName, groupedResources = [] },
    filters: { environment, start, end },
  } = useRequestFlyoutContext();
  const { toggleChild, isChildSelected } = useRequestFlyoutChild();

  // Reuses the service "dependencies" route and narrows it to this group on the
  // client. A server-side top-N scoped to the group is a follow-up.
  const { data, status } = useFetcher(
    (callApmApi) =>
      callApmApi('GET /internal/apm/services/{serviceName}/dependencies', {
        params: {
          path: { serviceName: sourceServiceName },
          query: { environment, start, end, numBuckets: 8 },
        },
      }),
    [sourceServiceName, environment, start, end]
  );

  const rows = useMemo(
    () => getTopResources({ dependencies: data?.serviceDependencies ?? [], groupedResources }),
    [data, groupedResources]
  );
  const topRows = rows.slice(0, TOP_N);

  const columns: Array<EuiBasicTableColumn<ResourceRow>> = [
    {
      field: 'resource',
      name: i18n.translate('xpack.apm.requestFlyout.resources.column.resource', {
        defaultMessage: 'Resource',
      }),
      truncateText: true,
      render: (resource: string) => {
        const child = { kind: 'resource' as const, resource };
        return (
          <ExpandableNameCell
            data-test-subj={`requestFlyoutResourceLink-${resource}`}
            name={resource}
            isExpanded={isChildSelected(child)}
            onClick={() => toggleChild(child)}
          />
        );
      },
    },
    {
      field: 'spanSubtype',
      name: i18n.translate('xpack.apm.requestFlyout.resources.column.type', {
        defaultMessage: 'Type',
      }),
      width: '100px',
      render: (subtype: string | undefined) =>
        subtype ? <EuiBadge color="hollow">{subtype}</EuiBadge> : '—',
    },
    {
      field: 'latency',
      name: i18n.translate('xpack.apm.requestFlyout.resources.column.avgTime', {
        defaultMessage: 'Avg time',
      }),
      align: 'right' as const,
      render: (value: number | null) => (value == null ? '—' : asMillisecondDuration(value)),
    },
    {
      field: 'throughput',
      name: i18n.translate('xpack.apm.requestFlyout.resources.column.calls', {
        defaultMessage: 'Calls',
      }),
      align: 'right' as const,
      render: (value: number | null) => (value == null ? '—' : asTransactionRate(value)),
    },
    {
      field: 'failureRate',
      name: i18n.translate('xpack.apm.requestFlyout.resources.column.failed', {
        defaultMessage: 'Failed',
      }),
      align: 'right' as const,
      render: (value: number | null) => (value == null ? '—' : asPercent(value, 1)),
    },
    {
      field: 'impact',
      name: i18n.translate('xpack.apm.requestFlyout.resources.column.timeConsumed', {
        defaultMessage: 'Time consumed',
      }),
      align: 'right' as const,
      render: (value: number) => <ImpactBar value={value} size="m" />,
    },
  ];

  return (
    <section data-test-subj="requestFlyoutSection-resources">
      <EuiBasicTable
        columns={columns}
        items={topRows}
        loading={isPending(status)}
        noItemsMessage={
          isPending(status)
            ? i18n.translate('xpack.apm.requestFlyout.resources.loadingLabel', {
                defaultMessage: 'Loading resources…',
              })
            : i18n.translate('xpack.apm.requestFlyout.resources.noDataLabel', {
                defaultMessage: 'No calls to these resources in the selected time range.',
              })
        }
        tableCaption={i18n.translate('xpack.apm.requestFlyout.resources.tableCaption', {
          defaultMessage: 'Resources called by the source service',
        })}
        data-test-subj="requestFlyoutResourcesTable"
      />
      {groupedResources.length > TOP_N && (
        <EuiText size="xs" color="subdued" data-test-subj="requestFlyoutResourcesTopN">
          {i18n.translate('xpack.apm.requestFlyout.resources.topN', {
            defaultMessage: 'Top {shown} of {total} resources, by time consumed',
            values: { shown: Math.min(TOP_N, rows.length), total: groupedResources.length },
          })}
        </EuiText>
      )}
    </section>
  );
}
