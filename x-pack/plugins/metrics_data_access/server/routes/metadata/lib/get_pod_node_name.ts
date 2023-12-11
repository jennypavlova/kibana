/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { first, get } from 'lodash';
import type { RequestHandlerContext } from '@kbn/core-http-request-handler-context-server';
import { ElasticsearchClient } from '@kbn/core-elasticsearch-server';
import { findInventoryFields, InventoryItemType } from '../../../../common';
import { TIMESTAMP_FIELD } from '../../../../common/constants';
import type { InventoryModel } from '../../../../common/inventory_models/types';

interface MetricsQueryProps {
  metricIndices: string;
  fields: InventoryModel['fields'];
  timeRange: { from: number; to: number };
  nodeId: string;
}

const getPodNodeNameQueryResponse = (
  client: ElasticsearchClient,
  metricsQueryProps: MetricsQueryProps
) => {
  const { metricIndices, fields, timeRange, nodeId } = metricsQueryProps;
  const params = {
    allow_no_indices: true,
    ignore_unavailable: true,
    terminate_after: 1,
    index: metricIndices,
    body: {
      size: 1,
      _source: ['kubernetes.node.name'],
      sort: [{ [TIMESTAMP_FIELD]: 'desc' }],
      query: {
        bool: {
          filter: [
            { match: { [fields.id]: nodeId } },
            { exists: { field: `kubernetes.node.name` } },
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

  return client.search(params).then((response) => {
    const firstHit = first(response.hits.hits) as
      | { _source: { kubernetes: { node: { name: string } } } }
      | undefined;
    return firstHit;
  });
};

export const getPodNodeName = async (
  requestContext: RequestHandlerContext,
  metricIndices: string,
  nodeId: string,
  nodeType: InventoryItemType,
  timeRange: { from: number; to: number }
): Promise<string | undefined> => {
  const fields = findInventoryFields(nodeType);

  const esClient = (await requestContext.core).elasticsearch.client.asCurrentUser;
  const response = await getPodNodeNameQueryResponse(esClient, {
    fields,
    timeRange,
    nodeId,
    metricIndices,
  });
  if (response) {
    return get(response, '_source.kubernetes.node.name');
  }
};
