/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ReactNode } from 'react';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { euiLightVars } from '@kbn/ui-theme';
import { EuiFlexItem, EuiFlexGroup } from '@elastic/eui';

import { AndOrBadge } from '..';

const sampleText =
  'Doggo ipsum i am bekom fat snoot wow such tempt waggy wags floofs, ruff heckin good boys and girls mlem.  Ruff heckin good boys and girls mlem stop it fren borkf borking doggo very hand that feed shibe, you are doing me the shock big ol heck smol borking doggo with a long snoot for pats heckin good boys. You are doing me the shock smol borking doggo with a long snoot for pats wow very biscit, length boy. Doggo ipsum i am bekom fat snoot wow such tempt waggy wags floofs, ruff heckin good boys and girls mlem.  Ruff heckin good boys and girls mlem stop it fren borkf borking doggo very hand that feed shibe, you are doing me the shock big ol heck smol borking doggo with a long snoot for pats heckin good boys.';

const withTheme = (storyFn: () => ReactNode) => (
  <ThemeProvider theme={() => ({ eui: euiLightVars, darkMode: true })}>{storyFn()}</ThemeProvider>
);

export default {
  title: 'Components/AndOrBadge',
  decorators: [withTheme],
};

export const And = {
  render: () => <AndOrBadge type="and" />,
  name: 'and',
};

export const Or = {
  render: () => <AndOrBadge type="or" />,
  name: 'or',
};

export const Antennas = {
  render: () => (
    <EuiFlexGroup>
      <EuiFlexItem grow={false}>
        <AndOrBadge type="and" includeAntennas />
      </EuiFlexItem>
      <EuiFlexItem>
        <p>{sampleText}</p>
      </EuiFlexItem>
    </EuiFlexGroup>
  ),

  name: 'antennas',
};
