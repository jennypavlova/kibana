/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { MlApi } from '../../../services/ml_api_service';

export const useMlApi: () => jest.Mocked<MlApi> = jest.fn(() => {
  return {
    jobs: {
      getAllJobAndGroupIds: jest.fn(),
    },
    trainedModels: {
      getTrainedModels: jest.fn(),
    },
    dataFrameAnalytics: {
      getDataFrameAnalytics: jest.fn(),
    },
  } as unknown as jest.Mocked<MlApi>;
});
