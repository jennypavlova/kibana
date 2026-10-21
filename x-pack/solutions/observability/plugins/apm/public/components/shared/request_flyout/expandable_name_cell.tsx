/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiLink, EuiToolTip } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import React from 'react';

interface ExpandableNameCellProps {
  name: string;
  isExpanded: boolean;
  onClick: () => void;
  'data-test-subj'?: string;
}

/**
 * Name cell that opens/closes a child flyout. Mirrors the transactions table of
 * the service flyout: an expand/collapse icon button next to the name link.
 */
export function ExpandableNameCell({
  name,
  isExpanded,
  onClick,
  'data-test-subj': dataTestSubj,
}: ExpandableNameCellProps) {
  const label = isExpanded
    ? i18n.translate('xpack.apm.requestFlyout.expandableName.close', {
        defaultMessage: 'Close details',
      })
    : i18n.translate('xpack.apm.requestFlyout.expandableName.open', {
        defaultMessage: 'Open details',
      });

  return (
    <EuiFlexGroup
      alignItems="center"
      gutterSize="xs"
      responsive={false}
      // Keeps the name readable: table columns would otherwise shrink it to a stub.
      css={{ minWidth: 180 }}
    >
      <EuiFlexItem grow={false}>
        <EuiToolTip content={label} disableScreenReaderOutput>
          <EuiButtonIcon
            data-test-subj={dataTestSubj ? `${dataTestSubj}-expand` : undefined}
            aria-label={label}
            iconType={isExpanded ? 'minimize' : 'maximize'}
            color={isExpanded ? 'primary' : 'text'}
            size="xs"
            onClick={onClick}
          />
        </EuiToolTip>
      </EuiFlexItem>
      <EuiFlexItem css={{ minWidth: 0 }}>
        <EuiLink data-test-subj={dataTestSubj} onClick={onClick} css={{ textAlign: 'left' }}>
          <span className="eui-textTruncate">{name}</span>
        </EuiLink>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
