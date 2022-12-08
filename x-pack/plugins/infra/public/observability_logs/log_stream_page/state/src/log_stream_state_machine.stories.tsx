/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Meta } from '@storybook/react';
import React from 'react';
import { RenderMachine } from 'storybook-xstate-addon/RenderMachine';
import { createPureLogStreamPageStateMachine } from './state_machine';

export default {
  title: 'infra/LogStreamStateMachine',
  parameters: {
    xstate: true,
  },
} as Meta;

export const Preview = () => (
  <RenderMachine
    machine={createPureLogStreamPageStateMachine().withConfig({
      services: {
        logViewNotifications: () => new Promise(() => {}),
      },
    })}
  />
);

export const LoadingLogViewFailed = () => (
  <RenderMachine
    machine={createPureLogStreamPageStateMachine().withConfig({
      services: {
        logViewNotifications: () => new Promise(() => {}),
      },
    })}
    events={['loadingLogViewStarted']}
    delay={2.5e3}
  />
);

export const loadingLogViewSucceeded = () => (
  <RenderMachine
    machine={createPureLogStreamPageStateMachine()}
    options={{ services: { logViewNotifications: () => new Promise(() => {}) } }}
    events={[
      'loadingLogViewStarted',
      { type: 'loadingLogViewSucceeded', status: { index: 'empty' } },
      'receivedAllParameters',
    ]}
    delay={2.5e3}
  />
);
