/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import React, { useState } from 'react';
import { ENVIRONMENT_ALL_VALUE } from '../../../../common/environment_filter_values';
import type { LatencyAggregationType } from '../../../../common/latency_aggregation_types';
import { LatencyAggregationType as LatencyAggregationTypeEnum } from '../../../../common/latency_aggregation_types';
import { TransactionDetailFlyout } from '../transaction_detail_flyout';
import { RequestFlyoutErrorsFlyout } from './errors_flyout';
import { RequestFlyoutFailedCalls } from './failed_calls';
import { RequestFlyoutFooter } from './footer';
import { RequestFlyoutLatencyDistribution } from './latency_distribution';
import { RequestFlyoutOperationDetailFlyout } from './operation_detail_flyout';
import { RequestFlyoutOperations } from './operations';
import { RequestFlyoutRedMetrics } from './red_metrics';
import { RequestFlyoutResourceFlyout } from './resource_flyout';
import { RequestFlyoutResources } from './resources';
import { RequestFlyoutChildProvider } from './request_flyout_child';
import { useRequestFlyoutContext } from './request_flyout_context';
import { RequestFlyoutAffectedEndpoints } from './transactions';

type TabId = 'operations' | 'affectedEndpoints';

export type RequestFlyoutChildSession = 'inherit' | 'start';

interface RequestFlyoutContentProps {
  /**
   * EUI session mode for the child flyouts opened from this content. The main
   * flyout's children use `inherit`; children of a child (e.g. the resource
   * flyout) must use `start` with the same history key, because EUI allows
   * only one main + one child flyout per session.
   */
  childSession: RequestFlyoutChildSession;
  historyKey: symbol;
}

/**
 * Body + footer shared by the edge flyout and the per-resource child flyout.
 * Owns the single child-flyout slot of its level.
 */
export function RequestFlyoutContent({ childSession, historyKey }: RequestFlyoutContentProps) {
  const { deps, connection, filters } = useRequestFlyoutContext();
  const { environment, rangeFrom, rangeTo, start, end } = filters;

  const [latencyAggregationType, setLatencyAggregationType] = useState<LatencyAggregationType>(
    LatencyAggregationTypeEnum.avg
  );
  const [activeTab, setActiveTab] = useState<TabId>('operations');

  const envLabel =
    environment === ENVIRONMENT_ALL_VALUE
      ? i18n.translate('xpack.apm.requestFlyout.environmentAny', { defaultMessage: 'Any' })
      : environment;

  const isGroupedEdge = !!connection.groupedResources?.length;

  return (
    <RequestFlyoutChildProvider
      render={(child, close) => {
        switch (child.kind) {
          case 'transaction':
            return (
              <TransactionDetailFlyout
                deps={deps}
                filters={{
                  serviceName: connection.sourceServiceName,
                  transactionName: child.name,
                  transactionType: child.transactionType,
                  environment,
                  rangeFrom,
                  rangeTo,
                  start,
                  end,
                }}
                onClose={close}
                historyKey={historyKey}
              />
            );
          case 'operation':
            return (
              <RequestFlyoutOperationDetailFlyout
                spanName={child.spanName}
                dependencyName={child.dependencyName}
                session={childSession}
                historyKey={historyKey}
                onClose={close}
              />
            );
          case 'error':
            return (
              <RequestFlyoutErrorsFlyout
                bucket={child.bucket}
                session={childSession}
                historyKey={historyKey}
                onClose={close}
              />
            );
          case 'resource':
            return (
              <RequestFlyoutResourceFlyout
                resource={child.resource}
                historyKey={historyKey}
                onClose={close}
              />
            );
        }
      }}
    >
      <EuiFlyoutBody>
        {/* Read-only time/env inherited from the map */}
        <EuiText size="s" color="subdued">
          {i18n.translate('xpack.apm.requestFlyout.inheritedFilters', {
            defaultMessage:
              '{rangeFrom} – {rangeTo} · Environment: {environment} · inherited from the map',
            values: { rangeFrom, rangeTo, environment: envLabel },
          })}
        </EuiText>

        <EuiSpacer size="m" />

        <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiTitle size="xs">
              <h3>
                {i18n.translate('xpack.apm.requestFlyout.keyMetricsSectionTitle', {
                  defaultMessage: 'Key metrics',
                })}
              </h3>
            </EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <RequestFlyoutRedMetrics
          latencyAggregationType={latencyAggregationType}
          setLatencyAggregationType={setLatencyAggregationType}
        />
        <EuiSpacer size="m" />
        <RequestFlyoutLatencyDistribution />

        <EuiSpacer size="m" />

        {isGroupedEdge ? (
          // Grouped edge: only the resource list. Operations and errors live in
          // the per-resource child flyout so the tables stay small.
          <RequestFlyoutResources />
        ) : (
          <>
            {/* service→dependency: Operations only.
                service→service: Operations + source transactions. */}
            <EuiTabs size="s">
              <EuiTab
                isSelected={activeTab === 'operations'}
                onClick={() => setActiveTab('operations')}
                data-test-subj="requestFlyoutTabOperations"
              >
                {i18n.translate('xpack.apm.requestFlyout.tabs.operations', {
                  defaultMessage: 'Operations',
                })}
              </EuiTab>
              {connection.targetServiceName && (
                <EuiTab
                  isSelected={activeTab === 'affectedEndpoints'}
                  onClick={() => setActiveTab('affectedEndpoints')}
                  data-test-subj="requestFlyoutTabAffectedEndpoints"
                >
                  {i18n.translate('xpack.apm.requestFlyout.tabs.affectedEndpoints', {
                    defaultMessage: 'Transactions',
                  })}
                </EuiTab>
              )}
            </EuiTabs>

            <EuiText size="xs" color="subdued" style={{ marginTop: 4 }}>
              {activeTab === 'operations'
                ? i18n.translate('xpack.apm.requestFlyout.tabs.operations.caption', {
                    defaultMessage: 'What {source} calls on {target}',
                    values: {
                      source: connection.sourceLabel,
                      target: connection.targetLabel,
                    },
                  })
                : i18n.translate('xpack.apm.requestFlyout.tabs.affectedEndpoints.caption', {
                    defaultMessage: '{source} transactions that call {target}',
                    values: {
                      source: connection.sourceLabel,
                      target: connection.targetLabel,
                    },
                  })}
            </EuiText>
            <EuiSpacer size="s" />

            {activeTab === 'operations' && <RequestFlyoutOperations />}
            {activeTab === 'affectedEndpoints' && connection.targetServiceName && (
              <RequestFlyoutAffectedEndpoints />
            )}

            <EuiSpacer size="l" />

            <RequestFlyoutFailedCalls />
          </>
        )}
      </EuiFlyoutBody>
      <RequestFlyoutFooter />
    </RequestFlyoutChildProvider>
  );
}
