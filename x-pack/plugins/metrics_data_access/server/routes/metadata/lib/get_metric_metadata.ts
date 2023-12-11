/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { get } from 'lodash';
import type { ElasticsearchClient } from '@kbn/core-elasticsearch-server';
import { RequestHandlerContext } from '@kbn/core-http-request-handler-context-server';
import { findInventoryFields } from '../../../../common';
import { InventoryItemType } from '../../../../common';
import {
  InfraMetadataAggregationBucket,
  InfraMetadataAggregationResponse,
} from '../../../lib/adapters/framework';
import { TIMESTAMP_FIELD } from '../../../../common/constants';
import { InventoryModel } from '../../../../common/inventory_models/types';

export interface InfraMetricsAdapterResponse {
  id: string;
  name?: string;
  buckets: InfraMetadataAggregationBucket[];
}

interface MetricsQueryProps {
  metricIndices: string;
  fields: InventoryModel['fields'];
  timeRange: { from: number; to: number };
  nodeId: string;
}

const getMetadataQueryResponse = (
  client: ElasticsearchClient,
  metricsQueryProps: MetricsQueryProps
) => {
  const { metricIndices, fields, timeRange, nodeId } = metricsQueryProps;
  return client
    .search({
      allow_no_indices: true,
      ignore_unavailable: true,
      index: metricIndices,
      body: {
        query: {
          bool: {
            must_not: [{ match: { 'event.dataset': 'aws.ec2' } }],
            filter: [
              {
                match: { [fields.id]: nodeId },
              },
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
        size: 0,
        aggs: {
          nodeName: {
            terms: {
              field: fields.name,
              size: 1,
            },
          },
          metrics: {
            terms: {
              field: 'event.dataset',
              size: 1000,
            },
          },
        },
      },
    })
    .then(
      (response) => response,
      (err) => {
        throw err;
      }
    );
};

export const getMetricMetadata = async (
  requestContext: RequestHandlerContext,
  metricIndices: string,
  nodeId: string,
  nodeType: InventoryItemType,
  timeRange: { from: number; to: number }
): Promise<InfraMetricsAdapterResponse> => {
  const fields = findInventoryFields(nodeType);
  const esClient = (await requestContext.core).elasticsearch.client.asCurrentUser;
  const response = await getMetadataQueryResponse(esClient, {
    fields,
    timeRange,
    nodeId,
    metricIndices,
  });

  const responseAggregations:
    | {
        metrics?: InfraMetadataAggregationResponse;
        nodeName?: InfraMetadataAggregationResponse;
      }
    | undefined = response.aggregations;

  const buckets =
    responseAggregations && responseAggregations.metrics
      ? responseAggregations.metrics.buckets
      : [];

  return {
    id: nodeId,
    name: get(response, ['aggregations', 'nodeName', 'buckets', 0, 'key'], nodeId),
    buckets,
  };
};
