/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { z, lazySchema } from '@kbn/zod/v4';
import { environmentSchema } from '@kbn/apm-types';
import { defineRoute } from '../types';
import { kuerySchema, rangeSchema } from '../../default_api_types';

export interface ErrorGroupSampleIdsResponse {
  errorSampleIds: string[];
  /**
   * The Elasticsearch `_id` and `_index` of the same samples, in the same order. `errorSampleIds`
   * holds `error.id`, which can differ from `_id`, so use these to fetch the document itself.
   */
  errorSampleDocs?: Array<{ id: string; index: string }>;
  occurrencesCount: number;
}

export const errorGroupSamplesRoute = defineRoute<ErrorGroupSampleIdsResponse>()({
  endpoint: 'GET /internal/apm/services/{serviceName}/errors/{groupId}/samples',
  params: lazySchema(() =>
    z.object({
      path: z.object({ serviceName: z.string(), groupId: z.string() }),
      query: environmentSchema.merge(kuerySchema).merge(rangeSchema),
    })
  ),
});
