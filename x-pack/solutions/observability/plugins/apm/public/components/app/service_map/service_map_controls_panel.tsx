/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiComboBox,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormLabel,
  EuiPopover,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  useEuiTheme,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { useReactFlow } from '@xyflow/react';
import { css } from '@emotion/react';
import type { ServiceMapNode, ServiceNodeData } from '../../../../common/service_map';
import { isServiceNodeData } from '../../../../common/service_map';
import { type ServiceMapControlState, type LayoutDirection } from './service_map_control_state';
import { useAdHocApmDataView } from '../../../hooks/use_adhoc_apm_data_view';
import { CENTER_ANIMATION_DURATION_MS, NODE_WIDTH, NODE_HEIGHT } from './constants';
import type { SloStatus } from '../../../../common/service_inventory';
import {
  type ServiceHealthStatus,
  ServiceHealthStatus as HealthStatus,
  getServiceHealthStatusLabel,
} from '../../../../common/service_health_status';

const CENTER_ZOOM = 1.2;

const SLO_STATUS_OPTIONS: { value: SloStatus; label: string }[] = [
  { value: 'healthy', label: 'Healthy' },
  { value: 'degrading', label: 'Degrading' },
  { value: 'violated', label: 'Violated' },
  { value: 'noData', label: 'No data' },
];

const ANOMALY_STATUS_OPTIONS: { value: ServiceHealthStatus; label: string }[] = [
  { value: HealthStatus.healthy, label: getServiceHealthStatusLabel(HealthStatus.healthy) },
  { value: HealthStatus.warning, label: getServiceHealthStatusLabel(HealthStatus.warning) },
  { value: HealthStatus.critical, label: getServiceHealthStatusLabel(HealthStatus.critical) },
  { value: HealthStatus.unknown, label: getServiceHealthStatusLabel(HealthStatus.unknown) },
];

/** Meta and internal field prefixes to exclude from group-by (same as search bar behavior). */
const EXCLUDED_FIELD_PREFIXES = ['_', '@'];

function getGroupByFieldOptionsFromDataView(
  dataView:
    | {
        fields:
          | Array<{ name: string; aggregatable?: boolean }>
          | { getAll(): Array<{ name: string; aggregatable?: boolean }> };
      }
    | undefined
): Array<{ label: string; value: string }> {
  if (!dataView?.fields) return [];
  const raw = dataView.fields;
  const all =
    typeof (raw as { getAll?: () => unknown[] }).getAll === 'function'
      ? (raw as { getAll(): Array<{ name: string; aggregatable?: boolean }> }).getAll()
      : Array.isArray(raw)
      ? raw
      : [];
  const aggregatable = all.filter(
    (f: { name: string; aggregatable?: boolean }) =>
      f.aggregatable !== false && !EXCLUDED_FIELD_PREFIXES.some((p) => f.name.startsWith(p))
  );
  const sorted = [...aggregatable].sort((a, b) => a.name.localeCompare(b.name));
  return sorted.map((f: { name: string }) => ({ label: f.name, value: f.name }));
}

export interface ServiceMapControlsPanelProps {
  nodes: ServiceMapNode[];
  controlState: ServiceMapControlState;
  onControlStateChange: (state: Partial<ServiceMapControlState>) => void;
  /** All service nodes before SLO/anomaly filter; used to show counts per status. */
  allServiceNodesForCounts?: ServiceMapNode[];
}

export interface ServiceMapControlsPanelContentProps {
  nodes: ServiceMapNode[];
  controlState: ServiceMapControlState;
  onControlStateChange: (state: Partial<ServiceMapControlState>) => void;
  onClose: () => void;
  /** All service nodes before SLO/anomaly filter; used to show counts per status. */
  allServiceNodesForCounts?: ServiceMapNode[];
}

function getServiceNodes(nodes: ServiceMapNode[]): ServiceMapNode[] {
  return nodes.filter((n) => n.type === 'service' && isServiceNodeData(n.data));
}

/**
 * When grouping is active, service nodes have parentId and position is relative to the group.
 * This returns the absolute position in flow coordinates so setCenter works correctly.
 */
function getAbsolutePosition(
  node: ServiceMapNode,
  allNodes: ServiceMapNode[]
): { x: number; y: number } {
  let x = node.position.x;
  let y = node.position.y;
  let current: ServiceMapNode | undefined = node;
  while (current?.parentId) {
    const parent = allNodes.find((n) => n.id === current!.parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    current = parent;
  }
  return { x, y };
}

export function ServiceMapControlsPanel({
  nodes,
  controlState,
  onControlStateChange,
  allServiceNodesForCounts,
}: ServiceMapControlsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const button = (
    <EuiButtonIcon
      iconType={isOpen ? 'transitionLeftIn' : 'transitionLeftOut'}
      color="text"
      onClick={() => setIsOpen((prev) => !prev)}
      aria-label={
        isOpen
          ? i18n.translate('xpack.apm.serviceMap.controls.hideSidebarAriaLabel', {
              defaultMessage: 'Hide sidebar',
            })
          : i18n.translate('xpack.apm.serviceMap.controls.showSidebarAriaLabel', {
              defaultMessage: 'Show sidebar',
            })
      }
      data-test-subj="serviceMapControlsMenuButton"
    />
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      anchorPosition="leftDown"
      panelPaddingSize="none"
      data-test-subj="serviceMapControlsPopover"
    >
      <ServiceMapControlsPanelContent
        nodes={nodes}
        controlState={controlState}
        onControlStateChange={onControlStateChange}
        onClose={() => setIsOpen(false)}
        allServiceNodesForCounts={allServiceNodesForCounts}
      />
    </EuiPopover>
  );
}

/** Count services by SLO status (sloStatus ?? 'noData'). */
function getSloStatusCounts(serviceNodes: ServiceMapNode[]): Record<SloStatus, number> {
  const counts: Record<SloStatus, number> = {
    healthy: 0,
    degrading: 0,
    violated: 0,
    noData: 0,
  };
  for (const node of serviceNodes) {
    if (node.type !== 'service' || !isServiceNodeData(node.data)) continue;
    const status = (node.data as ServiceNodeData).sloStatus ?? 'noData';
    if (status in counts) counts[status as SloStatus]++;
  }
  return counts;
}

/** Count services by anomaly/health status (serviceAnomalyStats?.healthStatus ?? 'unknown'). */
function getAnomalyStatusCounts(
  serviceNodes: ServiceMapNode[]
): Record<ServiceHealthStatus, number> {
  const counts: Record<ServiceHealthStatus, number> = {
    healthy: 0,
    warning: 0,
    critical: 0,
    unknown: 0,
  };
  for (const node of serviceNodes) {
    if (node.type !== 'service' || !isServiceNodeData(node.data)) continue;
    const status = (node.data as ServiceNodeData).serviceAnomalyStats?.healthStatus ?? 'unknown';
    if (status in counts) counts[status as ServiceHealthStatus]++;
  }
  return counts;
}

export function ServiceMapControlsPanelContent({
  nodes,
  controlState,
  onControlStateChange,
  onClose,
  allServiceNodesForCounts,
}: ServiceMapControlsPanelContentProps) {
  const { euiTheme } = useEuiTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const { dataView } = useAdHocApmDataView();
  const { setCenter } = useReactFlow();

  const nodesForCounts = allServiceNodesForCounts ?? nodes;
  const serviceNodesForCounts = useMemo(() => getServiceNodes(nodesForCounts), [nodesForCounts]);
  const sloStatusCounts = useMemo(
    () => getSloStatusCounts(serviceNodesForCounts),
    [serviceNodesForCounts]
  );
  const anomalyStatusCounts = useMemo(
    () => getAnomalyStatusCounts(serviceNodesForCounts),
    [serviceNodesForCounts]
  );

  const sloStatusComboBoxOptions = useMemo(
    () =>
      SLO_STATUS_OPTIONS.map((opt) => {
        const count = sloStatusCounts[opt.value];
        return {
          label: opt.label,
          value: opt.value,
          append: (
            <EuiBadge color={count === 0 ? 'subdued' : 'hollow'} title={String(count)}>
              {count}
            </EuiBadge>
          ),
          disabled: count === 0,
        };
      }),
    [sloStatusCounts]
  );

  const anomalyStatusComboBoxOptions = useMemo(
    () =>
      ANOMALY_STATUS_OPTIONS.map((opt) => {
        const count = anomalyStatusCounts[opt.value];
        return {
          label: opt.label,
          value: opt.value,
          append: (
            <EuiBadge color={count === 0 ? 'subdued' : 'hollow'} title={String(count)}>
              {count}
            </EuiBadge>
          ),
          disabled: count === 0,
        };
      }),
    [anomalyStatusCounts]
  );

  const groupByFieldOptions = useMemo(
    () => getGroupByFieldOptionsFromDataView(dataView),
    [dataView]
  );
  const serviceNodes = useMemo(() => getServiceNodes(nodes), [nodes]);
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return serviceNodes;
    const q = searchQuery.toLowerCase();
    return serviceNodes.filter(
      (node) =>
        (node.data.label && node.data.label.toLowerCase().includes(q)) ||
        node.id.toLowerCase().includes(q)
    );
  }, [serviceNodes, searchQuery]);

  const handleGoToService = useCallback(
    (node: ServiceMapNode) => {
      const { x, y } = getAbsolutePosition(node, nodes);
      const centerX = x + NODE_WIDTH / 2;
      const centerY = y + NODE_HEIGHT / 2;
      setCenter(centerX, centerY, {
        zoom: CENTER_ZOOM,
        duration: CENTER_ANIMATION_DURATION_MS,
      });
      onClose();
    },
    [nodes, setCenter, onClose]
  );

  const panelStyle = useMemo(
    () => css`
      min-width: 280px;
      max-width: 320px;
      padding: ${euiTheme.size.m};
    `,
    [euiTheme.size.m]
  );

  return (
    <div css={panelStyle} data-test-subj="serviceMapControlsPopover">
      {/* Search / Find in page + Go to service */}
      <EuiFormLabel>
        {i18n.translate('xpack.apm.serviceMap.controls.findInPage', {
          defaultMessage: 'Find in page',
        })}
      </EuiFormLabel>
      <EuiSpacer size="xs" />
      <EuiFieldSearch
        placeholder={i18n.translate('xpack.apm.serviceMap.controls.searchPlaceholder', {
          defaultMessage: 'Search services...',
        })}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        fullWidth
        incremental
        data-test-subj="serviceMapControlsSearch"
      />
      {searchQuery.trim() && searchResults.length > 0 && (
        <>
          <EuiSpacer size="xs" />
          <ul
            className="eui-yScrollWithShadows"
            style={{
              maxHeight: 200,
              margin: 0,
              paddingLeft: euiTheme.size.m,
              listStyle: 'none',
            }}
            data-test-subj="serviceMapControlsSearchResults"
          >
            {searchResults.slice(0, 20).map((node) => (
              <li key={node.id}>
                <EuiButtonEmpty
                  size="xs"
                  flush="left"
                  onClick={() => handleGoToService(node)}
                  data-test-subj={`serviceMapGoToService-${node.id}`}
                >
                  {node.data.label ?? node.id}
                </EuiButtonEmpty>
              </li>
            ))}
          </ul>
        </>
      )}
      {searchQuery.trim() && searchResults.length === 0 && (
        <EuiText size="xs" color="subdued">
          {i18n.translate('xpack.apm.serviceMap.controls.noServicesFound', {
            defaultMessage: 'No services found',
          })}
        </EuiText>
      )}

      <EuiSpacer size="m" />

      {/* Show only services with active alerts */}
      <EuiSwitch
        label={i18n.translate('xpack.apm.serviceMap.controls.showOnlyActiveAlerts', {
          defaultMessage: 'Show only active alerts',
        })}
        checked={controlState.showOnlyActiveAlerts}
        onChange={(e) => onControlStateChange({ showOnlyActiveAlerts: e.target.checked })}
        data-test-subj="serviceMapShowOnlyActiveAlerts"
      />

      <EuiSpacer size="m" />

      {/* SLO status filter – multiselect; empty = all statuses, show only services matching selected */}
      <EuiFormLabel>
        {i18n.translate('xpack.apm.serviceMap.controls.sloStatusFilter', {
          defaultMessage: 'SLO status',
        })}
      </EuiFormLabel>
      <EuiSpacer size="xs" />
      <EuiComboBox
        placeholder={i18n.translate('xpack.apm.serviceMap.controls.sloStatusPlaceholder', {
          defaultMessage: 'All statuses',
        })}
        options={sloStatusComboBoxOptions}
        selectedOptions={controlState.sloStatusFilter.map((value) => {
          const opt = sloStatusComboBoxOptions.find((o) => o.value === value);
          return { label: opt?.label ?? value, value };
        })}
        onChange={(selected) => {
          onControlStateChange({
            sloStatusFilter: selected.map((s) => (s.value ?? s.label) as SloStatus),
          });
        }}
        fullWidth
        isClearable={true}
        data-test-subj="serviceMapSloStatusFilter"
        aria-label={i18n.translate('xpack.apm.serviceMap.controls.sloStatusAriaLabel', {
          defaultMessage: 'Filter by SLO status',
        })}
      />

      <EuiSpacer size="m" />

      {/* Anomaly status filter – multiselect; empty = all statuses, show only services matching selected */}
      <EuiFormLabel>
        {i18n.translate('xpack.apm.serviceMap.controls.anomalyStatusFilter', {
          defaultMessage: 'Anomaly status',
        })}
      </EuiFormLabel>
      <EuiSpacer size="xs" />
      <EuiComboBox
        placeholder={i18n.translate('xpack.apm.serviceMap.controls.anomalyStatusPlaceholder', {
          defaultMessage: 'All statuses',
        })}
        options={anomalyStatusComboBoxOptions}
        selectedOptions={controlState.anomalyStatusFilter.map((value) => {
          const opt = anomalyStatusComboBoxOptions.find((o) => o.value === value);
          return { label: opt?.label ?? value, value };
        })}
        onChange={(selected) => {
          onControlStateChange({
            anomalyStatusFilter: selected.map((s) => (s.value ?? s.label) as ServiceHealthStatus),
          });
        }}
        fullWidth
        isClearable={true}
        data-test-subj="serviceMapAnomalyStatusFilter"
        aria-label={i18n.translate('xpack.apm.serviceMap.controls.anomalyStatusAriaLabel', {
          defaultMessage: 'Filter by anomaly status',
        })}
      />

      <EuiSpacer size="m" />

      {/* Group by – searchable APM field list from docs */}
      <EuiFormLabel>
        {i18n.translate('xpack.apm.serviceMap.controls.groupByLabel', {
          defaultMessage: 'Group by',
        })}
      </EuiFormLabel>
      <EuiSpacer size="xs" />
      <EuiComboBox
        singleSelection={{ asPlainText: true }}
        placeholder={i18n.translate('xpack.apm.serviceMap.controls.groupByPlaceholder', {
          defaultMessage: 'Search or select APM field…',
        })}
        options={groupByFieldOptions}
        selectedOptions={
          controlState.groupBy ? [{ label: controlState.groupBy, value: controlState.groupBy }] : []
        }
        onChange={(selected) => {
          const next = selected.length === 0 ? null : selected[0].value ?? selected[0].label;
          onControlStateChange({ groupBy: next });
        }}
        fullWidth
        isClearable={true}
        data-test-subj="serviceMapGroupByComboBox"
        aria-label={i18n.translate('xpack.apm.serviceMap.controls.groupByAriaLabel', {
          defaultMessage: 'Group by APM field',
        })}
      />

      <EuiSpacer size="m" />

      {/* Presentation: Horizontal / Vertical */}
      <EuiText size="xs" color="subdued">
        <strong>
          {i18n.translate('xpack.apm.serviceMap.controls.presentationSection', {
            defaultMessage: 'Presentation',
          })}
        </strong>
      </EuiText>
      <EuiSpacer size="s" />
      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            size="s"
            iconType="arrowRight"
            onClick={() =>
              onControlStateChange({ layoutDirection: 'horizontal' as LayoutDirection })
            }
            isSelected={controlState.layoutDirection === 'horizontal'}
            data-test-subj="serviceMapLayoutHorizontal"
          >
            {i18n.translate('xpack.apm.serviceMap.controls.layoutHorizontal', {
              defaultMessage: 'Horizontal',
            })}
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            size="s"
            iconType="arrowDown"
            onClick={() => onControlStateChange({ layoutDirection: 'vertical' as LayoutDirection })}
            isSelected={controlState.layoutDirection === 'vertical'}
            data-test-subj="serviceMapLayoutVertical"
          >
            {i18n.translate('xpack.apm.serviceMap.controls.layoutVertical', {
              defaultMessage: 'Vertical',
            })}
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
}
