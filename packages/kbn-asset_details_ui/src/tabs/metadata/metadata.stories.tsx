/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { Metadata } from './metadata';
import {
  DecorateWithKibanaContext,
  DecorateWithAssetDetailsStateContext,
  decorateWithGlobalStorybookThemeProviders,
} from '../../__stories__/decorator';

const stories: Meta = {
  title: 'infra/Asset Details View/Components/Metadata',
  decorators: [
    decorateWithGlobalStorybookThemeProviders,
    DecorateWithAssetDetailsStateContext,
    DecorateWithKibanaContext,
  ],
  component: Metadata,
};

const Template: Story = () => {
  return <Metadata />;
};

export const Default = Template.bind({});

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
