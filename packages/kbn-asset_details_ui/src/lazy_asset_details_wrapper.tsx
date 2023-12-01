/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { EuiLoadingSpinner } from '@elastic/eui';
import type { AssetDetailsProps } from './types';

const AssetDetails = React.lazy(() => import('./asset_details'));

export const LazyAssetDetailsWrapper = (props: AssetDetailsProps) => (
  <React.Suspense fallback={<EuiLoadingSpinner />}>
    <AssetDetails {...props} />
  </React.Suspense>
);
