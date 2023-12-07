/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { InfraMetadataFeature } from '@kbn/infra-plugin/common/http_api/metadata_api'; // TODO move those types to metrics details
import { InventoryMetric } from '@kbn/metrics-data-access-plugin/common';
import { metrics } from '@kbn/metrics-data-access-plugin/common';
import { TIMESTAMP_FIELD } from '../constants';

export const getFilteredMetrics = (
  requiredMetrics: InventoryMetric[],
  metadata: Array<InfraMetadataFeature | null | undefined>
) => {
  const metricMetadata = metadata
    .filter((data) => data && data.source === 'metrics')
    .map((data) => data && data.name);
  return requiredMetrics.filter((metric) => {
    const metricModelCreator = metrics.tsvb[metric];

    // We just need to get a dummy version of the model so we can filter
    // using the `requires` attribute.
    const metricModel = metricModelCreator(TIMESTAMP_FIELD, 'test', '>=1m');
    return metricMetadata.some((m) => m && metricModel.requires.includes(m));
  });
};
