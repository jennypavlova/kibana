/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import type { Meta, Story } from '@storybook/react/types-6-0';
import {
  DecorateWithKibanaContext,
  DecorateWithAssetDetailsStateContext,
  decorateWithGlobalStorybookThemeProviders,
} from '../../__stories__/decorator';
import { Processes } from './processes';

const stories: Meta = {
  title: 'infra/Asset Details View/Components/Processes',
  decorators: [
    decorateWithGlobalStorybookThemeProviders,
    DecorateWithAssetDetailsStateContext,
    DecorateWithKibanaContext,
  ],
  component: Processes,
};

const Template: Story = () => {
  return <Processes />;
};

export const Default = Template.bind({});
Default.args = {};

export const OnlySummary = Template.bind({});
OnlySummary.parameters = {
  apiResponse: {
    mock: 'onlySummary',
  },
};

export const OnlyProcesses = Template.bind({});
OnlyProcesses.parameters = {
  apiResponse: {
    mock: 'onlyProcesses',
  },
};

export const NoData = Template.bind({});
NoData.parameters = {
  apiResponse: {
    mock: 'noData',
  },
};

export const LoadingState = Template.bind({});
LoadingState.parameters = {
  apiResponse: {
    mock: 'loading',
  },
};

export const ErrorState = Template.bind({});
ErrorState.parameters = {
  apiResponse: {
    mock: 'error',
  },
};

export default stories;
