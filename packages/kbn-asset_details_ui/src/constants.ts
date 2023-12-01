/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { INTEGRATION_NAME } from './types';

export const ASSET_DETAILS_FLYOUT_COMPONENT_NAME = 'infraAssetDetailsFlyout';
export const ASSET_DETAILS_PAGE_COMPONENT_NAME = 'infraAssetDetailsPage';

export const APM_HOST_FILTER_FIELD = 'host.hostname';

export const ASSET_DETAILS_URL_STATE_KEY = 'assetDetails';

export const INTEGRATIONS = {
  [INTEGRATION_NAME.kubernetes]: ['kubernetes.node'],
};

export const ALERTS_DOC_HREF =
  'https://www.elastic.co/guide/en/observability/current/create-alerts.html';
