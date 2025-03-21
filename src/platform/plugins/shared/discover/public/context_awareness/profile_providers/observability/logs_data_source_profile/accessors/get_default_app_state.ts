/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { LOG_LEVEL_FIELD } from '@kbn/discover-utils';
import type { DataSourceProfileProvider } from '../../../../profiles';
import type { DefaultAppStateColumn } from '../../../../types';

export const createGetDefaultAppState = ({
  defaultColumns,
}: {
  defaultColumns?: DefaultAppStateColumn[];
} = {}): DataSourceProfileProvider['profile']['getDefaultAppState'] => {
  return (prev) => (params) => {
    const appState = { ...prev(params) };

    appState.breakdownField = LOG_LEVEL_FIELD;

    if (defaultColumns) {
      appState.columns = [];

      if (params.dataView.isTimeBased()) {
        appState.columns.push({ name: params.dataView.timeFieldName, width: 212 });
      }

      appState.columns.push(...defaultColumns);
    }

    return appState;
  };
};
