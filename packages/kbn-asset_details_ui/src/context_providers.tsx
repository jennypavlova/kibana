/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { AssetDetailsRenderPropsProvider } from './hooks_wip/use_asset_details_render_props';
import { DatePickerProvider } from './hooks_wip/use_date_picker';
import { LoadingStateProvider } from './hooks_wip/use_loading_state';
import { MetadataStateProvider } from './hooks_wip/use_metadata_state';
import { AssetDetailsProps } from './types';

export const ContextProviders = ({
  children,
  ...props
}: Omit<AssetDetailsProps, 'links' | 'tabs' | 'activeTabId' | 'metricAlias'> & {
  children: React.ReactNode;
}) => {
  const {
    assetId,
    assetName,
    autoRefresh,
    dateRange,
    overrides,
    assetType = 'host',
    renderMode,
  } = props;

  return (
    <DatePickerProvider dateRange={dateRange} autoRefresh={autoRefresh}>
      <LoadingStateProvider>
        <MetadataStateProvider assetId={assetId} assetType={assetType}>
          <AssetDetailsRenderPropsProvider
            assetId={assetId}
            assetName={assetName}
            assetType={assetType}
            overrides={overrides}
            renderMode={renderMode}
          >
            {children}
          </AssetDetailsRenderPropsProvider>
        </MetadataStateProvider>
      </LoadingStateProvider>
    </DatePickerProvider>
  );
};
