/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { renderHook } from '@testing-library/react';
import type { ServiceMapEdge } from '../../../../common/service_map';
import {
  SERVICE_NAME,
  SPAN_DESTINATION_SERVICE_RESOURCE,
  SPAN_TYPE,
} from '../../../../common/es_fields/apm';
import { useServiceMapEdgeFlyoutProps } from './use_service_map_edge_flyout_props';

// Minimal EdgeMarker shape required by ServiceMapEdge
const EDGE_MARKER = {
  type: 'arrow' as const,
  width: 8,
  height: 8,
  color: '#888',
};

/**
 * Build a minimal ServiceMapEdge. The hook only reads `data` and `target`,
 * so every other required ReactFlow field is filled with a safe default.
 */
function makeEdge(
  dataOverrides: Partial<NonNullable<ServiceMapEdge['data']>> = {},
  edgeOverrides: Partial<Pick<ServiceMapEdge, 'source' | 'target'>> = {}
): ServiceMapEdge {
  return {
    id: 'source-node>>target-node',
    source: edgeOverrides.source ?? 'source-node',
    target: edgeOverrides.target ?? 'target-node',
    type: 'default' as const,
    style: { stroke: '#888', strokeWidth: 2 },
    markerEnd: EDGE_MARKER,
    data: {
      isBidirectional: false,
      ...dataOverrides,
    },
  };
}

/** A ServiceConnectionNode that acts as an instrumented service source. */
const SOURCE_SERVICE_NODE = {
  id: 'opbeans-java',
  [SERVICE_NAME]: 'opbeans-java',
  'agent.name': 'java',
  'service.environment': 'production',
};

/** An ExternalConnectionNode that acts as a database dependency. */
const TARGET_DEPENDENCY_NODE = {
  id: 'redis',
  [SPAN_DESTINATION_SERVICE_RESOURCE]: 'redis',
  [SPAN_TYPE]: 'db',
  'span.subtype': 'redis',
};

/** A ServiceConnectionNode that acts as an instrumented service target. */
const TARGET_SERVICE_NODE = {
  id: 'opbeans-node',
  [SERVICE_NAME]: 'opbeans-node',
  'agent.name': 'nodejs',
  'service.environment': 'production',
};

describe('useServiceMapEdgeFlyoutProps', () => {
  it('returns null when no edge is selected', () => {
    const { result } = renderHook(() =>
      useServiceMapEdgeFlyoutProps({ selectedEdgeForFlyout: null })
    );

    expect(result.current).toBeNull();
  });

  it('returns null when sourceData has no SERVICE_NAME (e.g. a dependency as source)', () => {
    // A messaging consumer edge has a dependency node as source (queue→service).
    // Because sourceData has no SERVICE_NAME, sourceServiceName is undefined and
    // the hook short-circuits to null before returning any connection object.
    const edge = makeEdge({
      sourceData: TARGET_DEPENDENCY_NODE, // ExternalConnectionNode — no SERVICE_NAME
      targetData: TARGET_SERVICE_NODE,
    });
    const { result } = renderHook(() =>
      useServiceMapEdgeFlyoutProps({ selectedEdgeForFlyout: edge })
    );

    expect(result.current).toBeNull();
  });

  it('maps a service→dependency edge: targetServiceName is undefined, dependencies carries resource values', () => {
    const edge = makeEdge({
      sourceData: SOURCE_SERVICE_NODE,
      targetData: TARGET_DEPENDENCY_NODE,
      resources: ['redis'],
    });
    const { result } = renderHook(() =>
      useServiceMapEdgeFlyoutProps({ selectedEdgeForFlyout: edge })
    );

    expect(result.current).not.toBeNull();
    expect(result.current).toMatchObject({
      sourceServiceName: 'opbeans-java',
      // targetData has no SERVICE_NAME → targetServiceName is undefined
      targetServiceName: undefined,
      // SPAN_DESTINATION_SERVICE_RESOURCE from targetData is used as dependencyName
      dependencyName: 'redis',
      // resources array is passed through as dependencies
      dependencies: ['redis'],
      isGrouped: false,
      isMessagingConsumer: false,
    });
  });

  it('maps a service→service edge: targetServiceName equals the target service name', () => {
    const edge = makeEdge({
      sourceData: SOURCE_SERVICE_NODE,
      targetData: TARGET_SERVICE_NODE, // ServiceConnectionNode — has SERVICE_NAME
      resources: ['internal-resource'],
    });
    const { result } = renderHook(() =>
      useServiceMapEdgeFlyoutProps({ selectedEdgeForFlyout: edge })
    );

    expect(result.current).not.toBeNull();
    expect(result.current).toMatchObject({
      sourceServiceName: 'opbeans-java',
      targetServiceName: 'opbeans-node',
      // TARGET_SERVICE_NODE has no SPAN_DESTINATION_SERVICE_RESOURCE → dependencyName is undefined
      dependencyName: undefined,
      dependencies: ['internal-resource'],
      isGrouped: false,
      isMessagingConsumer: false,
    });
  });

  describe('grouped edge (service → "N resources" node)', () => {
    // Real shape built by group_resource_nodes: no sourceData/targetData, the source is the
    // service node id and the resources are listed in groupedConnections.
    const groupedEdge = (
      groupedConnections?: NonNullable<ServiceMapEdge['data']>['groupedConnections']
    ) =>
      makeEdge(
        { isGrouped: true, groupedConnections },
        { source: 'opbeans-java', target: 'resourceGroup{opbeans-java}' }
      );

    it('lists the grouped resources and uses the edge source as the service', () => {
      const edge = groupedEdge([
        { id: '>redis-1', label: 'redis-1', spanType: 'db', spanSubtype: 'redis' },
        { id: '>redis-2', label: 'redis-2', spanType: 'db', spanSubtype: 'redis' },
      ]);
      const { result } = renderHook(() =>
        useServiceMapEdgeFlyoutProps({ selectedEdgeForFlyout: edge })
      );

      expect(result.current).toMatchObject({
        sourceServiceName: 'opbeans-java',
        isGrouped: true,
        dependencies: ['redis-1', 'redis-2'],
        groupedResources: [
          { resource: 'redis-1', spanType: 'db', spanSubtype: 'redis' },
          { resource: 'redis-2', spanType: 'db', spanSubtype: 'redis' },
        ],
      });
      expect(result.current?.targetLabel).toBe('2 redis resources');
    });

    it('prefers span.destination.service.resource over the label', () => {
      const edge = groupedEdge([
        { id: '>a', label: 'A', [SPAN_DESTINATION_SERVICE_RESOURCE]: 'resource-a' },
      ]);
      const { result } = renderHook(() =>
        useServiceMapEdgeFlyoutProps({ selectedEdgeForFlyout: edge })
      );

      expect(result.current?.dependencies).toEqual(['resource-a']);
    });

    it('returns null for a grouped edge without resources (outgoing grouped edge)', () => {
      const edge = groupedEdge(undefined);
      const { result } = renderHook(() =>
        useServiceMapEdgeFlyoutProps({ selectedEdgeForFlyout: edge })
      );

      expect(result.current).toBeNull();
    });
  });

  it('reports isMessagingConsumer true when sourceData is a messaging exit span that also carries a service name', () => {
    // isMessagingExitSpan checks for SPAN_DESTINATION_SERVICE_RESOURCE and SPAN_TYPE==='messaging'.
    // To also pass the sourceServiceName guard (SOURCE_SERVICE_NODE check), the sourceData must
    // also contain SERVICE_NAME. This hybrid shape tests the hook's isMessagingConsumer branch.
    const messagingServiceSource = {
      ...SOURCE_SERVICE_NODE,
      [SPAN_DESTINATION_SERVICE_RESOURCE]: 'kafka',
      [SPAN_TYPE]: 'messaging',
      'span.subtype': 'kafka',
    } as unknown as typeof SOURCE_SERVICE_NODE & typeof TARGET_DEPENDENCY_NODE;

    const edge = makeEdge({
      sourceData: messagingServiceSource,
      targetData: TARGET_SERVICE_NODE,
    });
    const { result } = renderHook(() =>
      useServiceMapEdgeFlyoutProps({ selectedEdgeForFlyout: edge })
    );

    expect(result.current).not.toBeNull();
    expect(result.current?.isMessagingConsumer).toBe(true);
    expect(result.current?.sourceServiceName).toBe('opbeans-java');
  });
});
