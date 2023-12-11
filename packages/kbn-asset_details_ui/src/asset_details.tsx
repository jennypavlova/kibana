/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import type { AssetDetailsProps, ContentTemplateProps, RenderMode } from './types';
import { Flyout } from './template/flyout';
// import { Page } from './template/page';
import { ContextProviders } from './context_providers';
import { TabSwitcherProvider } from './hooks/use_tab_switcher';
// import { DataViewsProvider } from './hooks_wip/use_data_views';

const ContentTemplate = ({
  tabs,
  links,
  renderMode,
}: ContentTemplateProps & { renderMode: RenderMode }) => {
  // return renderMode.mode === 'flyout' ?
  return <Flyout tabs={tabs} links={links} closeFlyout={renderMode.closeFlyout!} />;
  // : (
  //   <Page tabs={tabs} links={links} />
  // );
};

export const AssetDetails = ({
  tabs,
  links,
  renderMode,
  // metricAlias,
  ...props
}: AssetDetailsProps) => {
  return (
    <ContextProviders {...props} renderMode={renderMode}>
      <TabSwitcherProvider defaultActiveTabId={tabs[0]?.id}>
        {/* <DataViewsProvider metricAlias={metricAlias}> */}
          <ContentTemplate tabs={tabs} links={links} renderMode={renderMode} />
        {/* </DataViewsProvider> */}
      </TabSwitcherProvider>
    </ContextProviders>
  );
};

// Allow for lazy loading
// eslint-disable-next-line import/no-default-export
export default AssetDetails;
