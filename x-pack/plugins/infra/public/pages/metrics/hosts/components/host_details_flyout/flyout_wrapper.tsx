/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import { AssetDetails } from '@kbn/asset_details_ui/src/asset_details';
import { useSourceContext } from '../../../../../containers/metrics_source';
import { useUnifiedSearchContext } from '../../hooks/use_unified_search';
import type { HostNodeRow } from '../../hooks/use_hosts_table';
import { commonFlyoutTabs } from '../../../../../common/asset_details_config/asset_details_tabs';
import { ContentTabIds } from '../../../../../components/asset_details/types';
import { useKibanaContextForPlugin } from '../../../../../hooks/use_kibana';

export interface Props {
  node: HostNodeRow;
  closeFlyout: () => void;
}

export const FlyoutWrapper = ({ node: { name }, closeFlyout }: Props) => {
  const { source } = useSourceContext();
  const { parsedDateRange } = useUnifiedSearchContext();
  const { services } = useKibanaContextForPlugin();
  const { metricsDataAccess } = services;

  return source ? (
    <AssetDetails
      assetId={name}
      assetName={name}
      assetType="host"
      dateRange={parsedDateRange}
      overrides={{
        metadata: {
          showActionsColumn: false,
        },
      }}
      tabs={[
        {
          id: ContentTabIds.METADATA,
          name: i18n.translate('xpack.infra.nodeDetails.tabs.metadata.title', {
            defaultMessage: 'Metadata',
          }),
        },
      ]}
      renderMode={{
        mode: 'flyout',
        closeFlyout,
      }}
      metricAlias={source.configuration.metricAlias}
      metricsClient={metricsDataAccess.metricsClient}
    />
  ) : null;
};
