/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { useEffect, useState } from 'react';
import { fold } from 'fp-ts/lib/Either';
import { identity } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import type { InventoryItemType, InventoryMetric } from '@kbn/metrics-data-access-plugin/common';
import { useTrackedPromise } from '@kbn/use-tracked-promise/use_tracked_promise';
import { InfraMetadataRT, type InfraMetadata } from '@kbn/infra-plugin/common/http_api';
import { createPlainError, throwErrors } from '@kbn/infra-plugin/common/runtime_types';
import { MetricsDataClient } from '@kbn/metrics-data-access-plugin/public/lib/metrics_client';
import { getFilteredMetrics } from '../lib/get_filtered_metrics';

interface UseMetadataProps {
  assetId: string;
  assetType: InventoryItemType;
  requiredMetrics?: InventoryMetric[];
  sourceId: string;
  timeRange: {
    from: number;
    to: number;
  };
  metricsClient: MetricsDataClient;
}

interface MetadataRequestBody {
  nodeId: string;
  nodeType: InventoryItemType;
  sourceId: string;
  timeRange: {
    from: number;
    to: number;
  };
}

export function useMetadata({
  assetId,
  assetType,
  sourceId,
  timeRange,
  requiredMetrics = [],
  metricsClient,
}: UseMetadataProps) {
  const decodeResponse = (response: any) => {
    return pipe(InfraMetadataRT.decode(response), fold(throwErrors(createPlainError), identity));
  };

  const [metadata, setMetadata] = useState<InfraMetadata | undefined>();

  const [fetchMetadataRequest, fetchMetadata] = useTrackedPromise(
    {
      createPromise: async (): Promise<InfraMetadata> => {
        const requestBody: MetadataRequestBody = {
          nodeId: assetId,
          nodeType: assetType,
          sourceId,
          timeRange,
        };

        return metricsClient.metadata(requestBody);
      },
      onResolve: (response: InfraMetadata) => {
        setMetadata(decodeResponse(response));
      },
      cancelPreviousOn: 'creation',
    },
    []
  );

  const isLoading =
    fetchMetadataRequest.state === 'pending' || fetchMetadataRequest.state === 'uninitialized';

  const error =
    fetchMetadataRequest.state === 'rejected'
      ? fetchMetadataRequest.value instanceof Error
        ? fetchMetadataRequest.value
        : { error: { message: `${fetchMetadataRequest.value}` } }
      : null;

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return {
    name: (metadata && metadata.name) || '',
    filteredRequiredMetrics:
      metadata && requiredMetrics.length > 0
        ? getFilteredMetrics(requiredMetrics, metadata.features)
        : [],
    error,
    loading: isLoading,
    metadata,
    cloudId: metadata?.info?.cloud?.instance?.id || '',
    reload: fetchMetadata,
  };
}
