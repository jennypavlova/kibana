/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Meta } from '@storybook/react';
// import { useMachine } from '@xstate/react';
import React from 'react';
import { RenderMachine } from 'storybook-xstate-addon/RenderMachine';
import { createPureLogViewStateMachine } from './state_machine';

export default {
  title: 'infra/LogViewStateMachine',
  parameters: {
    xstate: true,
  },
} as Meta;

export const Preview = () => (
  <RenderMachine machine={createPureLogViewStateMachine({ logViewId: 'default' })} />
);
