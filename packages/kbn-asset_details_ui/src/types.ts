/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { TimeRange } from '@kbn/es-query';
import { Search } from 'history';
import type { InventoryItemType } from '@kbn/metrics-data-access-plugin/common';
import type { InfraWaffleMapOptions } from '@kbn/infra-plugin/public/lib/lib';

export type { AssetDetailsUrlState } from './hooks_wip/use_asset_details_url_state';

export interface Asset {
  id: string;
  name?: string;
}

export enum ContentTabIds {
  OVERVIEW = 'overview',
  METADATA = 'metadata',
  PROCESSES = 'processes',
  PROFILING = 'profiling',
  ANOMALIES = 'anomalies',
  OSQUERY = 'osquery',
  LOGS = 'logs',
  LINK_TO_APM = 'linkToApm',
}

export type TabIds = `${ContentTabIds}`;

export interface OverridableTabState {
  metadata?: {
    showActionsColumn?: boolean;
  };
  anomalies?: {
    onClose?: () => void;
  };
  alertRule?: {
    options?: Partial<Pick<InfraWaffleMapOptions, 'groupBy' | 'metric'>>;
  };
}

export interface TabState extends OverridableTabState {
  activeTabId?: TabIds;
  dateRange?: TimeRange;
}
export interface FlyoutProps {
  closeFlyout: () => void;
  mode: 'flyout';
}

export interface FullPageProps {
  mode: 'page';
}

export type RenderMode = FlyoutProps | FullPageProps;

export interface Tab {
  id: ContentTabIds;
  name: string;
}

export type LinkOptions = 'alertRule' | 'nodeDetails' | 'apmServices';

export interface AssetDetailsProps {
  assetId: string;
  assetName?: string;
  assetType: InventoryItemType;
  autoRefresh?: {
    isPaused?: boolean;
    interval?: number;
  };
  dateRange?: TimeRange;
  tabs: Tab[];
  overrides?: OverridableTabState;
  renderMode: RenderMode;
  links?: LinkOptions[];
  // This is temporary. Once we start using the asset details in other plugins,
  // It will have to retrieve the metricAlias internally rather than receive it via props
  metricAlias: string;
}

export type TabsStateChangeFn = (state: TabState) => void;

export type ContentTemplateProps = Pick<AssetDetailsProps, 'tabs' | 'links'>;

export interface RouteState {
  originAppId: string;
  originPathname: string;
  originSearch?: Search;
}

export type DataViewOrigin = 'logs' | 'metrics';

export enum INTEGRATION_NAME {
  kubernetes = 'kubernetes',
}
