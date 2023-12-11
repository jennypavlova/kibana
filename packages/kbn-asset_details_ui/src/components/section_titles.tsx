/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { type ReactNode } from 'react';

import { EuiFlexItem, EuiTitle, EuiFlexGroup } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { Popover } from '../tabs/common/popover';
import { AlertsTooltipContent } from './alerts_tooltip_content';
import { HostMetricsExplanationContent } from './host_metrics_explanation_content';

const SectionTitle = ({
  title,
  'data-test-subj': dataTestSubject,
}: {
  title: string;
  'data-test-subj'?: string;
}) => {
  return (
    <EuiTitle size="xxs" data-test-subj={dataTestSubject}>
      <span>{title}</span>
    </EuiTitle>
  );
};

const TitleWithTooltip = ({
  title,
  'data-test-subj': dataTestSubject,
  tooltipTestSubj,
  children,
}: {
  title: string;
  children: ReactNode;
  'data-test-subj'?: string;
  tooltipTestSubj?: string;
}) => {
  return (
    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
      <EuiFlexItem grow={false}>
        <SectionTitle title={title} data-test-subj={dataTestSubject} />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <Popover icon="iInCircle" data-test-subj={tooltipTestSubj}>
          {children}
        </Popover>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export const MetricsSectionTitle = () => {
  return (
    <TitleWithTooltip
      title={i18n.translate('xpack.infra.assetDetails.overview.metricsSectionTitle', {
        defaultMessage: 'Metrics',
      })}
      tooltipTestSubj="infraAssetDetailsMetricsPopoverButton"
    >
      <HostMetricsExplanationContent />
    </TitleWithTooltip>
  );
};

export const KubernetesMetricsSectionTitle = () => (
  <SectionTitle
    title={i18n.translate('xpack.infra.assetDetails.overview.kubernetesMetricsSectionTitle', {
      defaultMessage: 'Kubernetes Overview',
    })}
  />
);

export const MetadataSectionTitle = () => (
  <SectionTitle
    title={i18n.translate('xpack.infra.assetDetails.overview.metadataSectionTitle', {
      defaultMessage: 'Metadata',
    })}
    data-test-subj="infraAssetDetailsMetadataTitle"
  />
);

export const AlertsSectionTitle = () => {
  return (
    <TitleWithTooltip
      title={i18n.translate('xpack.infra.assetDetails.overview.alertsSectionTitle', {
        defaultMessage: 'Alerts',
      })}
      data-test-subj="infraAssetDetailsAlertsTitle"
      tooltipTestSubj="infraAssetDetailsAlertsPopoverButton"
    >
      <AlertsTooltipContent />
    </TitleWithTooltip>
  );
};
