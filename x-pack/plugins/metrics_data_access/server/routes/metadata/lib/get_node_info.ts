/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { set } from '@kbn/safer-lodash-set';
import { first, startsWith } from 'lodash';
import type { RequestHandlerContext } from '@kbn/core-http-request-handler-context-server';
import type { ElasticsearchClient } from '@kbn/core-elasticsearch-server';
import type { InfraMetadataInfo } from '../../../../common/http_api/metadata';
import { findInventoryFields } from '../../../../common';
import { InventoryItemType } from '../../../../common';
import { getPodNodeName } from './get_pod_node_name';
import { CLOUD_METRICS_MODULES } from './constants';
import { TIMESTAMP_FIELD } from '../../../../common/constants';
import { InventoryModel } from '../../../../common/inventory_models/types';

interface MetricsQueryProps {
  metricIndices: string;
  fields: InventoryModel['fields'];
  timeRange: { from: number; to: number };
  nodeId: string;
  nodeType: InventoryItemType;
}

const getNodeInfoQueryResponse = (
  client: ElasticsearchClient,
  metricsQueryProps: MetricsQueryProps
) => {
  const { metricIndices, fields, timeRange, nodeId, nodeType } = metricsQueryProps;
  const params = {
    allow_no_indices: true,
    ignore_unavailable: true,
    terminate_after: 1,
    index: metricIndices,
    body: {
      size: 1,
      _source: ['host.*', 'cloud.*', 'agent.*', TIMESTAMP_FIELD],
      sort: [{ [TIMESTAMP_FIELD]: 'desc' }],
      query: {
        bool: {
          filter: [
            { match: { [fields.id]: nodeId } },
            {
              range: {
                [TIMESTAMP_FIELD]: {
                  gte: timeRange.from,
                  lte: timeRange.to,
                  format: 'epoch_millis',
                },
              },
            },
          ],
        },
      },
    },
  };
  if (!CLOUD_METRICS_MODULES.some((m) => startsWith(nodeType, m))) {
    set(
      params,
      'body.query.bool.must_not',
      CLOUD_METRICS_MODULES.map((module) => ({ match: { 'event.module': module } }))
    );
  }

  return client.search(params).then((response) => {
    const firstHit = first(response.hits.hits);
    if (firstHit?._source) {
      return firstHit._source as { _source: InfraMetadataInfo };
    }
    return {};
  });
};

export const getNodeInfo = async (
  requestContext: RequestHandlerContext,
  metricIndices: string,
  nodeId: string,
  nodeType: InventoryItemType,
  timeRange: { from: number; to: number }
): Promise<InfraMetadataInfo> => {
  // If the nodeType is a Kubernetes pod then we need to get the node info
  // from a host record instead of a pod. This is due to the fact that any host
  // can report pod details and we can't rely on the host/cloud information associated
  // with the kubernetes.pod.uid. We need to first lookup the `kubernetes.node.name`
  // then use that to lookup the host's node information.
  if (nodeType === 'pod') {
    const kubernetesNodeName = await getPodNodeName(
      requestContext,
      metricIndices,
      nodeId,
      nodeType,
      timeRange
    );
    if (kubernetesNodeName) {
      return getNodeInfo(requestContext, metricIndices, kubernetesNodeName, 'host', timeRange);
    }
    return {};
  }
  const fields = findInventoryFields(nodeType);

  const esClient = (await requestContext.core).elasticsearch.client.asCurrentUser;
  const response = await getNodeInfoQueryResponse(esClient, {
    fields,
    timeRange,
    nodeId,
    metricIndices,
    nodeType,
  });

  return response;
};
