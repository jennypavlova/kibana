/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { TypeOf } from '@kbn/config-schema';

import { isAgentRequestDiagnosticsSupported } from '../../../common/services';

import * as AgentService from '../../services/agents';
import type {
  FleetRequestHandler,
  PostBulkRequestDiagnosticsActionRequestSchema,
  PostRequestDiagnosticsActionRequestSchema,
} from '../../types';
import { getAgentById } from '../../services/agents';

export const requestDiagnosticsHandler: FleetRequestHandler<
  TypeOf<typeof PostRequestDiagnosticsActionRequestSchema.params>,
  undefined,
  TypeOf<typeof PostRequestDiagnosticsActionRequestSchema.body>
> = async (context, request, response) => {
  const coreContext = await context.core;
  const esClient = coreContext.elasticsearch.client.asInternalUser;
  const soClient = coreContext.savedObjects.client;
  const agent = await getAgentById(esClient, soClient, request.params.agentId);

  if (!isAgentRequestDiagnosticsSupported(agent)) {
    return response.customError({
      statusCode: 400,
      body: {
        message: `Agent ${request.params.agentId} does not support request diagnostics action.`,
      },
    });
  }

  const result = await AgentService.requestDiagnostics(
    esClient,
    soClient,
    request.params.agentId,
    request.body?.additional_metrics
  );

  return response.ok({ body: { actionId: result.actionId } });
};

export const bulkRequestDiagnosticsHandler: FleetRequestHandler<
  undefined,
  undefined,
  TypeOf<typeof PostBulkRequestDiagnosticsActionRequestSchema.body>
> = async (context, request, response) => {
  const coreContext = await context.core;
  const esClient = coreContext.elasticsearch.client.asInternalUser;
  const soClient = coreContext.savedObjects.client;
  const agentOptions = Array.isArray(request.body.agents)
    ? { agentIds: request.body.agents }
    : { kuery: request.body.agents };
  const result = await AgentService.bulkRequestDiagnostics(esClient, soClient, {
    ...agentOptions,
    batchSize: request.body.batchSize,
    additionalMetrics: request.body.additional_metrics,
  });

  return response.ok({ body: { actionId: result.actionId } });
};
