/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { FormattedMessage } from '@kbn/i18n-react';
import { EuiButtonEmpty } from '@elastic/eui';

export interface LinkToAlertsRuleProps {
  onClick?: () => void;
}

export const LinkToAlertsRule = ({ onClick }: LinkToAlertsRuleProps) => {
  return (
    <EuiButtonEmpty
      data-test-subj="infraAssetDetailsCreateAlertsRuleButton"
      onClick={onClick}
      size="xs"
      iconSide="left"
      flush="both"
      iconType="bell"
    >
      <FormattedMessage
        id="xpack.infra.infra.assetDetails.alerts.createAlertLink"
        defaultMessage="Create rule"
      />
    </EuiButtonEmpty>
  );
};
