/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { EuiEmptyPrompt } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import React from 'react';

export function ErrorPrompt() {
  return (
    <EuiEmptyPrompt
      color="warning"
      iconType="warning"
      titleSize="xs"
      title={
        <h2>
          {i18n.translate('xpack.infra.profiling.loadErrorTitle', {
            defaultMessage: 'Unable to load the Profiling data',
          })}
        </h2>
      }
      body={
        <p>
          {i18n.translate('xpack.infra.profiling.loadErrorBody', {
            defaultMessage:
              'There was an error while trying to load profiling data. Try refreshing the page',
          })}
        </p>
      }
    />
  );
}
