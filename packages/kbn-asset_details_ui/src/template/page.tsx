/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { EuiFlexGroup, EuiPageTemplate } from '@elastic/eui';
import { css } from '@emotion/react';
import { i18n } from '@kbn/i18n';
import React, { useEffect, useMemo } from 'react';
import { useKibanaContextForPlugin } from '../../../hooks/use_kibana';
import { useKibanaHeader } from '../../../hooks/use_kibana_header';
import { InfraLoadingPanel } from '../../loading'; // TODO Move loading component?
import { ASSET_DETAILS_PAGE_COMPONENT_NAME } from '../constants';
import { Content } from '../content/content';
import { useAssetDetailsRenderPropsContext } from '../hooks_wip/use_asset_details_render_props';
import { useMetadataStateContext } from '../hooks_wip/use_metadata_state';
import { usePageHeader } from '../hooks_wip/use_page_header';
import { useTabSwitcherContext } from '../hooks_wip/use_tab_switcher';
import { ContentTemplateProps } from '../types';
import { getIntegrationsAvailable } from '../utils';

export const Page = ({ tabs = [], links = [] }: ContentTemplateProps) => {
  const { loading } = useAssetDetailsRenderPropsContext();
  const { metadata, loading: metadataLoading } = useMetadataStateContext();
  const { rightSideItems, tabEntries, breadcrumbs } = usePageHeader(tabs, links);
  const { asset } = useAssetDetailsRenderPropsContext();
  const { actionMenuHeight } = useKibanaHeader();
  const trackOnlyOnce = React.useRef(false);

  const { activeTabId } = useTabSwitcherContext();
  const {
    services: { telemetry },
  } = useKibanaContextForPlugin();

  useEffect(() => {
    if (trackOnlyOnce.current) {
      return;
    }
    if (!metadataLoading && metadata) {
      const integrations = getIntegrationsAvailable(metadata);
      const telemetryParams = {
        componentName: ASSET_DETAILS_PAGE_COMPONENT_NAME,
        assetType: asset.type,
        tabId: activeTabId,
      };

      telemetry.reportAssetDetailsPageViewed(
        integrations.length > 0
          ? {
              ...telemetryParams,
              integrations,
            }
          : telemetryParams
      );
      trackOnlyOnce.current = true;
    }
  }, [activeTabId, asset.type, metadata, metadataLoading, telemetry]);

  const heightWithOffset = useMemo(
    () => `calc(100vh - var(--euiFixedHeadersOffset, 0) - ${actionMenuHeight}px)`,
    [actionMenuHeight]
  );

  return loading ? (
    <EuiFlexGroup
      direction="column"
      css={css`
        height: ${heightWithOffset};
      `}
    >
      <InfraLoadingPanel
        height="100%"
        width="auto"
        text={i18n.translate('xpack.infra.waffle.loadingDataText', {
          defaultMessage: 'Loading data',
        })}
      />
    </EuiFlexGroup>
  ) : (
    <EuiPageTemplate
      panelled
      contentBorder={false}
      offset={0}
      restrictWidth={false}
      style={{
        minBlockSize: heightWithOffset,
      }}
      data-component-name={ASSET_DETAILS_PAGE_COMPONENT_NAME}
      data-asset-type={asset.type}
    >
      <EuiPageTemplate.Section paddingSize="none">
        <EuiPageTemplate.Header
          pageTitle={asset.name}
          tabs={tabEntries}
          rightSideItems={rightSideItems}
          breadcrumbs={breadcrumbs}
        />
        <EuiPageTemplate.Section grow>
          <Content />
        </EuiPageTemplate.Section>
      </EuiPageTemplate.Section>
    </EuiPageTemplate>
  );
};
