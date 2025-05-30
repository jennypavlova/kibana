/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { estypes } from '@elastic/elasticsearch';

import { IKibanaSearchRequest, IKibanaSearchResponse } from './kibana_search_types';

export type ISearchRequestParams = {
  trackTotalHits?: boolean;
} & estypes.SearchRequest;

export interface IEsSearchRequest<T extends ISearchRequestParams = ISearchRequestParams>
  extends IKibanaSearchRequest<T> {
  indexType?: string;
}

export type IEsSearchResponse<Source = any> = IKibanaSearchResponse<estypes.SearchResponse<Source>>;
