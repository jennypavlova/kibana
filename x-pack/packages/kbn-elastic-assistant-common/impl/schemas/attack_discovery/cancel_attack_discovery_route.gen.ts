/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Cancel Attack Discovery API endpoint
 *   version: 1
 */

import { z } from '@kbn/zod';

import { NonEmptyString } from '../common_attributes.gen';
import { AttackDiscoveryResponse } from './common_attributes.gen';

export type AttackDiscoveryCancelRequestParams = z.infer<typeof AttackDiscoveryCancelRequestParams>;
export const AttackDiscoveryCancelRequestParams = z.object({
  /**
   * The connector id for which to cancel a pending attack discovery
   */
  connectorId: NonEmptyString,
});
export type AttackDiscoveryCancelRequestParamsInput = z.input<
  typeof AttackDiscoveryCancelRequestParams
>;

export type AttackDiscoveryCancelResponse = z.infer<typeof AttackDiscoveryCancelResponse>;
export const AttackDiscoveryCancelResponse = AttackDiscoveryResponse;
