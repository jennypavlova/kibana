/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiErrorBoundary } from '@elastic/eui';
import React from 'react';
import { useKibana } from '@kbn/kibana-react-plugin/public';
import { i18n } from '@kbn/i18n';
import { SourceConfigurationSettings } from './settings/source_configuration_settings';
import { DocumentTitle } from '../../components/document_title';

export const MetricsSettingsPage = () => {
  const uiCapabilities = useKibana().services.application?.capabilities;
  return (
    <EuiErrorBoundary>
      <DocumentTitle
        title={(previousTitle: string) =>
          i18n.translate('xpack.infra.infrastructureSettingsPage.documentTitle', {
            defaultMessage: '{previousTitle} | Settings',
            values: {
              previousTitle,
            },
          })
        }
      />
      <SourceConfigurationSettings
        shouldAllowEdit={uiCapabilities?.infrastructure?.configureSource as boolean}
      />
    </EuiErrorBoundary>
  );
};
