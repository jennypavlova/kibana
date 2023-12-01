/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { HttpStart, HttpHandler } from '@kbn/core/public';
import type { Parameters } from '@storybook/react';
import { INFA_ML_GET_METRICS_HOSTS_ANOMALIES_PATH } from '@kbn/infra-plugin/common/http_api/infra_ml';
import {
  alertsSummaryHttpResponse,
  anomaliesHttpResponse,
  metadataHttpResponse,
  processesChartHttpResponse,
  processesHttpResponse,
  snapshotAPItHttpResponse,
  type AlertsSummaryHttpMocks,
  type AnomaliesHttpMocks,
  type MetadataResponseMocks,
  type ProcessesHttpMocks,
  type SnapshotAPIHttpMocks,
} from './fixtures';

export const getHttp = (params: Parameters): HttpStart => {
  const http = {
    basePath: {
      prepend: (_path: string) => {
        return '';
      },
    },
    fetch: (async (path: string) => {
      switch (path) {
        case '/api/infra/metadata':
          return metadataHttpResponse[params.mock as MetadataResponseMocks]();
        case '/api/metrics/process_list':
          return processesHttpResponse[params.mock as ProcessesHttpMocks]();
        case '/api/metrics/process_list/chart':
          return processesChartHttpResponse.default();
        case '/api/metrics/snapshot':
          return snapshotAPItHttpResponse[params.mock as SnapshotAPIHttpMocks]();
        case INFA_ML_GET_METRICS_HOSTS_ANOMALIES_PATH:
          return anomaliesHttpResponse[params.mock as AnomaliesHttpMocks]();
        default:
          return Promise.resolve({});
      }
    }) as HttpHandler,
    post: (async (path: string) => {
      switch (path) {
        case '/internal/rac/alerts/_alert_summary':
          return alertsSummaryHttpResponse[params.mock as AlertsSummaryHttpMocks]();
        default:
          return Promise.resolve({});
      }
    }) as HttpHandler,
  } as unknown as HttpStart;

  return http;
};
