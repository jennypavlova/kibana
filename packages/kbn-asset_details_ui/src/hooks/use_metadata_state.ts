/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { useEffect, useCallback } from 'react';
import createContainer from 'constate';
import { MetricsDataClient } from '@kbn/metrics-data-access-plugin/public/lib/metrics_client';
import { useMetadata } from './use_metadata';
import { AssetDetailsProps } from '../types';
import { useDatePickerContext } from './use_date_picker';
// import { useAssetDetailsUrlState } from './use_asset_details_url_state';

export type AssetsProps = Pick<AssetDetailsProps, 'assetId' | 'assetType'>;
export interface UseMetadataProviderProps extends AssetsProps {
  metricsClient: MetricsDataClient;
}

export function useMetadataProvider({
  assetId,
  assetType,
  metricsClient,
}: UseMetadataProviderProps) {
  // const [, setUrlState] = useAssetDetailsUrlState();
  const { getDateRangeInTimestamp } = useDatePickerContext();

  const { loading, error, metadata, reload } = useMetadata({
    assetId,
    assetType,
    timeRange: getDateRangeInTimestamp(),
    metricsClient,
  });

  const refresh = useCallback(() => {
    reload();
  }, [reload]);

  // useEffect(() => {
  //   if (metadata?.name) {
  //     setUrlState({ name: metadata.name });
  //   }
  // }, [metadata?.name, setUrlState]);

  return {
    loading,
    error,
    metadata,
    refresh,
  };
}

export const [MetadataStateProvider, useMetadataStateContext] =
  createContainer(useMetadataProvider);
