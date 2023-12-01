/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useMemo } from 'react';
import { EmbeddableFlamegraph } from '@kbn/observability-shared-plugin/public';
import { useAssetDetailsRenderPropsContext } from '../../hooks_wip/use_asset_details_render_props';
import { useDatePickerContext } from '../../hooks_wip/use_date_picker';
import { useProfilingFlamegraphData } from '../../hooks_wip/use_profiling_flamegraph_data';
import { useTabSwitcherContext } from '../../hooks_wip/use_tab_switcher';
import { ContentTabIds } from '../../types';
import { ErrorPrompt } from './error_prompt';

export function Flamegraph() {
  const { asset } = useAssetDetailsRenderPropsContext();
  const { activeTabId } = useTabSwitcherContext();
  const { getDateRangeInTimestamp } = useDatePickerContext();
  const { from, to } = getDateRangeInTimestamp();

  const params = useMemo(
    () => ({
      hostname: asset.name,
      from,
      to,
    }),
    [asset.name, from, to]
  );
  const { error, loading, response } = useProfilingFlamegraphData({
    isActive: activeTabId === ContentTabIds.PROFILING,
    params,
  });

  if (error !== null) {
    return <ErrorPrompt />;
  }

  return <EmbeddableFlamegraph data={response ?? undefined} isLoading={loading} height="60vh" />;
}
