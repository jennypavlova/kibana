/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  PluginSetupContract as ActionsPluginSetup,
  PluginStartContract as ActionsPluginStart,
} from '@kbn/actions-plugin/server';
import type { AlertingServerSetup, AlertingServerStart } from '@kbn/alerting-plugin/server';
import type {
  DataViewsServerPluginSetup,
  DataViewsServerPluginStart,
} from '@kbn/data-views-plugin/server';
import type { FeaturesPluginStart, FeaturesPluginSetup } from '@kbn/features-plugin/server';
import type { LicensingPluginSetup, LicensingPluginStart } from '@kbn/licensing-plugin/server';
import type {
  ObservabilityAIAssistantServerSetup,
  ObservabilityAIAssistantServerStart,
} from '@kbn/observability-ai-assistant-plugin/server';
import type {
  RuleRegistryPluginSetupContract,
  RuleRegistryPluginStartContract,
} from '@kbn/rule-registry-plugin/server';
import type { ServerlessPluginSetup, ServerlessPluginStart } from '@kbn/serverless/server';
import type {
  TaskManagerSetupContract,
  TaskManagerStartContract,
} from '@kbn/task-manager-plugin/server';
import type { CloudSetup, CloudStart } from '@kbn/cloud-plugin/server';
import type { SecurityPluginSetup, SecurityPluginStart } from '@kbn/security-plugin/server';
import type { ObservabilityPluginSetup } from '@kbn/observability-plugin/server';
import type { InferenceServerStart, InferenceServerSetup } from '@kbn/inference-plugin/server';
import type { LogsDataAccessPluginStart } from '@kbn/logs-data-access-plugin/server';
import type { LlmTasksPluginStart } from '@kbn/llm-tasks-plugin/server';
import type { SpacesPluginStart, SpacesPluginSetup } from '@kbn/spaces-plugin/server';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ObservabilityAIAssistantAppServerStart {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ObservabilityAIAssistantAppServerSetup {}

export interface ObservabilityAIAssistantAppPluginStartDependencies {
  observabilityAIAssistant: ObservabilityAIAssistantServerStart;
  ruleRegistry: RuleRegistryPluginStartContract;
  alerting: AlertingServerStart;
  licensing: LicensingPluginStart;
  actions: ActionsPluginStart;
  security: SecurityPluginStart;
  features: FeaturesPluginStart;
  taskManager: TaskManagerStartContract;
  dataViews: DataViewsServerPluginStart;
  cloud?: CloudStart;
  serverless?: ServerlessPluginStart;
  inference: InferenceServerStart;
  logsDataAccess: LogsDataAccessPluginStart;
  spaces: SpacesPluginStart;
  llmTasks: LlmTasksPluginStart;
}

export interface ObservabilityAIAssistantAppPluginSetupDependencies {
  observabilityAIAssistant: ObservabilityAIAssistantServerSetup;
  ruleRegistry: RuleRegistryPluginSetupContract;
  alerting: AlertingServerSetup;
  licensing: LicensingPluginSetup;
  actions: ActionsPluginSetup;
  security: SecurityPluginSetup;
  features: FeaturesPluginSetup;
  taskManager: TaskManagerSetupContract;
  dataViews: DataViewsServerPluginSetup;
  observability: ObservabilityPluginSetup;
  cloud?: CloudSetup;
  serverless?: ServerlessPluginSetup;
  inference: InferenceServerSetup;
  spaces: SpacesPluginSetup;
}
