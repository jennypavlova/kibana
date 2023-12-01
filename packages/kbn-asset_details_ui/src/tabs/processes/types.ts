/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { MetricsExplorerSeries } from '@kbn/infra-plugin/common/http_api';

import { STATE_NAMES } from './states';

export interface Process {
  command: string;
  cpu: number | null;
  memory: number | null;
  startTime: number;
  state: keyof typeof STATE_NAMES;
  pid: number;
  user: string;
  timeseries: {
    [x: string]: MetricsExplorerSeries;
  };
  apmTrace?: string; // Placeholder
}
