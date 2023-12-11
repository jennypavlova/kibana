/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { useEffect, useState, useMemo } from 'react';
import type { InventoryItemType, InventoryMetric } from '@kbn/metrics-data-access-plugin/common';
import { useTrackedPromise } from '@kbn/use-tracked-promise/use_tracked_promise';
import {
  type InfraMetadata,
} from '@kbn/metrics-data-access-plugin/common/http_api';
// import { createPlainError, throwErrors } from '@kbn/infra-plugin/common/runtime_types';
import { MetricsDataClient } from '@kbn/metrics-data-access-plugin/public/lib/metrics_client';
import { getFilteredMetrics } from '../lib/get_filtered_metrics';

interface UseMetadataProps {
  assetId: string;
  assetType: InventoryItemType;
  requiredMetrics?: InventoryMetric[];
  timeRange: {
    from: number;
    to: number;
  };
  metricsClient: MetricsDataClient;
}

interface MetadataRequestBody {
  nodeId: string;
  nodeType: InventoryItemType;
  indexPattern: string;
  timeRange: {
    from: number;
    to: number;
  };
}

export const useMetricIndices = ({ metricsClient }: { metricsClient: MetricsDataClient }) => {
  const [metricIndices, setMetricIndices] = useState<
    { metricIndices: string; metricIndicesExist: boolean } | undefined
  >(undefined);

  const [metricIndicesRequest, getMetricIndices] = useTrackedPromise(
    {
      cancelPreviousOn: 'resolution',
      createPromise: () => {
        return metricsClient.metricsIndices();
      },
      onResolve: (response) => {
        if (response) {
          setMetricIndices(response);
        }
      },
    },
    [metricsClient]
  );

  useEffect(() => {
    getMetricIndices();
  }, [getMetricIndices, metricsClient]);

  const hasFailedLoading = metricIndicesRequest.state === 'rejected';
  const isUninitialized = metricIndicesRequest.state === 'uninitialized';
  const isLoading = metricIndicesRequest.state === 'pending';

  return {
    isLoading,
    isUninitialized,
    errorMessage: hasFailedLoading ? `${metricIndicesRequest.value}` : undefined,
    metricIndicesExist: metricIndices?.metricIndicesExist,
    metricIndices: metricIndices?.metricIndices,
  };
};

export function useMetadata({
  assetId,
  assetType,
  timeRange,
  requiredMetrics = [],
  metricsClient,
}: UseMetadataProps) {
  const [metadata, setMetadata] = useState<InfraMetadata | undefined>();
  const {
    metricIndices,
    isLoading: metricIndicesLoading,
    errorMessage: metricIndicesError,
  } = useMetricIndices({ metricsClient });

  const [fetchMetadataRequest, fetchMetadata] = useTrackedPromise(
    {
      createPromise: async (): Promise<InfraMetadata> => {
        if (!metricIndices) {
          return Promise.resolve({ id: '', name: '', features: [] });
        }
        const requestBody: MetadataRequestBody = {
          nodeId: assetId,
          nodeType: assetType,
          timeRange,
          indexPattern: metricIndices, // change to be index pattern (like metrics explorer) and update the api
        };
        return metricsClient.metadata(requestBody);
      },
      onResolve: (response: InfraMetadata) => {
        setMetadata(response);
      },
      cancelPreviousOn: 'creation',
    },
    [metricIndices]
  );

  const isLoading =
    metricIndicesLoading ||
    fetchMetadataRequest.state === 'pending' ||
    fetchMetadataRequest.state === 'uninitialized';

  const errors = useMemo<Error[]>(
    () => [
      ...(metricIndicesError ? [wrapAsError(metricIndicesError)] : []),
      ...(fetchMetadataRequest.state === 'rejected'
        ? [wrapAsError(fetchMetadataRequest.value)]
        : []),
    ],
    [fetchMetadataRequest, metricIndicesError]
  );

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return {
    name: (metadata && metadata.name) || '',
    filteredRequiredMetrics:
      metadata && requiredMetrics.length > 0
        ? getFilteredMetrics(requiredMetrics, metadata.features)
        : [],
    error: errors.length > 0 ? errors : null,
    loading: isLoading,
    metadata,
    cloudId: metadata?.info?.cloud?.instance?.id || '',
    reload: fetchMetadata,
  };
}

const wrapAsError = (value: any): Error => (value instanceof Error ? value : new Error(`${value}`));
