/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { decorateWithGlobalStorybookThemeProviders } from '../__stories__/decorator';
import { LoadingPanel } from './loading_panel';

export default {
  title: 'asset_details/LoadingPanel',
  decorators: [
    (wrappedStory) => <div style={{ width: 600 }}>{wrappedStory()}</div>,
    decorateWithGlobalStorybookThemeProviders,
  ],
} as Meta;

export const LoadingPanelStory: Story = () => <LoadingPanel text="test" width={200} height={200} />;
