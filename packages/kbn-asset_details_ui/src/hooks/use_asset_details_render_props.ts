/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import createContainer from 'constate';
import type { AssetDetailsProps } from '../types';
// import { useAssetDetailsUrlState } from './use_asset_details_url_state';
import { useMetadataStateContext } from './use_metadata_state';

export type UseAssetDetailsRenderProps = Pick<
  AssetDetailsProps,
  'assetId' | 'assetName' | 'assetType' | 'overrides' | 'renderMode'
>;

export function useAssetDetailsRenderProps(props: UseAssetDetailsRenderProps) {
  const { metadata } = useMetadataStateContext();
  const { assetId, assetName, assetType, ...rest } = props;

  // When the asset asset.name is known we can load the page faster
  // Otherwise we need to use metadata response.
  const loading = !assetName && !metadata?.name;
  return {
    ...rest,
    asset: {
      id: assetId,
      name: assetName || metadata?.name || '',
      type: assetType,
    },
    loading,
  };
}

export const AssetDetailsRenderProps = createContainer(useAssetDetailsRenderProps);
export const [AssetDetailsRenderPropsProvider, useAssetDetailsRenderPropsContext] =
  AssetDetailsRenderProps;
