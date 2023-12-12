/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { EuiLoadingChart, EuiPanel, EuiText } from '@elastic/eui';
import { css } from '@emotion/react';
import React from 'react';

interface LoadingProps {
  text: string | JSX.Element;
  height: number | string;
  width: number | string;
}

export const LoadingPanel = ({ height, text, width }: LoadingProps) => {
  return (
    <div css={LoadingStaticPanel} style={{ height, width }}>
      <div css={LoadingStaticContentPanel}>
        <EuiPanel>
          <EuiLoadingChart size="m" />
          <EuiText>
            <p>{text}</p>
          </EuiText>
        </EuiPanel>
      </div>
    </div>
  );
};

export const LoadingStaticPanel = css`
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const LoadingStaticContentPanel = css`
  flex: 0 0 auto;
  align-self: center;
  text-align: center;
`;
