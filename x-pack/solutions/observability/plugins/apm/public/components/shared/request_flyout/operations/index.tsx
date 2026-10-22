/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiBadge, EuiBasicTable, EuiButtonIcon, type EuiBasicTableColumn } from '@elastic/eui';
import { DISCOVER_APP_LOCATOR } from '@kbn/deeplinks-analytics';
import { i18n } from '@kbn/i18n';
import type { DependencyOperation } from '@kbn/apm-api-shared';
import React, { useCallback, useState } from 'react';
import { ActionsContextMenu, type ActionGroups } from '../../actions_context_menu';
import {
  asMillisecondDuration,
  asPercent,
  asTransactionRate,
} from '../../../../../common/utils/formatters';
import { useApmIndexSettingsContext } from '../../../../context/apm_index_settings/use_apm_index_settings_context';
import { useApmPluginContext } from '../../../../context/apm_plugin/use_apm_plugin_context';
import { getESQLQuery } from '../../links/discover_links/get_esql_query';
import { ImpactBar } from '../../impact_bar';
import { ExpandableNameCell } from '../expandable_name_cell';
import { useRequestFlyoutChild } from '../request_flyout_child';
import { useRequestFlyoutContext } from '../request_flyout_context';
import { useRequestFlyoutOperations } from './use_request_flyout_operations';

/**
 * "Operations" tab in the edge flyout.
 *
 * Shows the exit-span operations from the source service to the target
 * dependency: the name (opens the operation detail child flyout), span type, call
 * latency, calls, failure rate and impact (time consumed share) — all
 * measured on the source side.
 *
 * Column names are unified with the Transactions tab:
 *   Name · Type · Avg time · Calls · Failed · Time consumed
 */
export function RequestFlyoutOperations() {
  const {
    connection: { sourceServiceName },
    filters: { environment, rangeFrom, rangeTo },
  } = useRequestFlyoutContext();
  const { toggleChild, isChildSelected } = useRequestFlyoutChild();

  const { items, isLoading, resolvedDependencyName } = useRequestFlyoutOperations();

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const currentItems = items.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  // Discover link — built per-row using the pure getESQLQuery function.
  const { indexSettings = [] } = useApmIndexSettingsContext();
  const { share } = useApmPluginContext();
  const discoverLocator = share?.url.locators.get(DISCOVER_APP_LOCATOR);

  const buildDiscoverHref = useCallback(
    (item: DependencyOperation): string | undefined => {
      const esqlQuery = getESQLQuery({
        indexType: 'traces',
        params: {
          serviceName: sourceServiceName,
          spanName: item.spanName,
          environment,
          sortDirection: 'DESC',
        },
        indexSettings,
      });
      if (!esqlQuery || !discoverLocator) return undefined;
      return discoverLocator.getRedirectUrl({
        timeRange: { from: rangeFrom, to: rangeTo },
        query: { esql: esqlQuery },
      });
    },
    [sourceServiceName, environment, rangeFrom, rangeTo, indexSettings, discoverLocator]
  );

  const columns: Array<EuiBasicTableColumn<DependencyOperation>> = [
    {
      field: 'spanName',
      width: '38%',
      name: i18n.translate('xpack.apm.requestFlyout.operations.column.spanName', {
        defaultMessage: 'Name',
      }),
      render: (spanName: string) => {
        if (!resolvedDependencyName) {
          // Service→service edges use span names as-is; no operation detail.
          return spanName;
        }
        const child = {
          kind: 'operation' as const,
          spanName,
          dependencyName: resolvedDependencyName,
        };
        // Opens the operation detail as a child flyout (scoped to the source service)
        // instead of navigating to the dependency operation page.
        return (
          <ExpandableNameCell
            data-test-subj={`requestFlyoutOperationNameLink-${spanName}`}
            name={spanName}
            isExpanded={isChildSelected(child)}
            onClick={() => toggleChild(child)}
          />
        );
      },
    },
    {
      field: 'spanType',
      name: i18n.translate('xpack.apm.requestFlyout.operations.column.spanType', {
        defaultMessage: 'Type',
      }),
      width: '14%',
      render: (spanType: string | undefined) =>
        spanType ? <EuiBadge color="hollow">{spanType}</EuiBadge> : <span>—</span>,
    },
    {
      field: 'latency',
      name: i18n.translate('xpack.apm.requestFlyout.operations.column.avgTime', {
        defaultMessage: 'Avg time',
      }),
      align: 'right' as const,
      render: (value: number | null) => (value == null ? '—' : asMillisecondDuration(value)),
    },
    {
      field: 'throughput',
      name: i18n.translate('xpack.apm.requestFlyout.operations.column.calls', {
        defaultMessage: 'Calls',
      }),
      align: 'right' as const,
      render: (value: number) => asTransactionRate(value),
    },
    {
      field: 'failureRate',
      name: i18n.translate('xpack.apm.requestFlyout.operations.column.failed', {
        defaultMessage: 'Failed',
      }),
      align: 'right' as const,
      render: (value: number | null) => (value == null ? '—' : asPercent(value, 1)),
    },
    {
      field: 'impact',
      name: i18n.translate('xpack.apm.requestFlyout.operations.column.timeConsumed', {
        defaultMessage: 'Time consumed',
      }),
      align: 'right' as const,
      render: (value: number) => <ImpactBar value={value} size="m" />,
    },
    {
      name: i18n.translate('xpack.apm.requestFlyout.operations.column.actions', {
        defaultMessage: 'Actions',
      }),
      align: 'right' as const,
      render: (item: DependencyOperation) => {
        const discoverHref = buildDiscoverHref(item);
        if (!discoverHref) return null;
        const menuActions: ActionGroups = [
          {
            id: 'operationActions',
            actions: [
              {
                id: 'viewInDiscover',
                name: i18n.translate('xpack.apm.requestFlyout.operations.action.viewInDiscover', {
                  defaultMessage: 'View traces in Discover',
                }),
                icon: 'discoverApp',
                href: discoverHref,
              },
            ],
          },
        ];
        return (
          <ActionsContextMenu
            id={`operationActions-${item.spanName}`}
            actions={menuActions}
            dataTestSubjPrefix="requestFlyoutOperationActions"
            button={
              // eslint-disable-next-line @elastic/eui/tooltip-button-icon-wrap
              <EuiButtonIcon
                data-test-subj="requestFlyoutOperationActionsButton"
                aria-label={i18n.translate('xpack.apm.requestFlyout.operations.actions.ariaLabel', {
                  defaultMessage: 'Actions',
                })}
                iconType="boxesVertical"
                color="text"
              />
            }
          />
        );
      },
    },
  ];

  return (
    <section data-test-subj="requestFlyoutSection-operations">
      <EuiBasicTable
        columns={columns}
        items={currentItems}
        loading={isLoading}
        noItemsMessage={
          isLoading
            ? i18n.translate('xpack.apm.requestFlyout.operations.loadingLabel', {
                defaultMessage: 'Loading operations…',
              })
            : i18n.translate('xpack.apm.requestFlyout.operations.noDataLabel', {
                defaultMessage: 'No operations found for this connection.',
              })
        }
        pagination={{
          pageIndex,
          pageSize,
          totalItemCount: items.length,
          pageSizeOptions: [10, 25, 50],
        }}
        onChange={({ page }: { page?: { index: number; size: number } }) => {
          if (page) {
            setPageIndex(page.index);
            setPageSize(page.size);
          }
        }}
        tableCaption={i18n.translate('xpack.apm.requestFlyout.operations.tableCaption', {
          defaultMessage: 'Exit span operations from source to target service',
        })}
        data-test-subj="requestFlyoutOperationsTable"
      />
    </section>
  );
}
