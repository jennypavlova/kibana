/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { EuiLink, EuiText } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
// import {
//   HOST_METRICS_DOC_HREF,
//   HOST_METRICS_DOTTED_LINES_DOC_HREF,
// } from '../../../common/visualizations/constants';

const DocLinks = {
  metrics: {
    href: '#',
    label: i18n.translate('xpack.infra.hostsViewPage.tooltip.whatAreTheseMetricsLink', {
      defaultMessage: 'What are these metrics?',
    }),
  },
  dottedLines: {
    href: '#',
    label: i18n.translate('xpack.infra.hostsViewPage.tooltip.whyAmISeeingDottedLines', {
      defaultMessage: 'Why am I seeing dotted lines?',
    }),
  },
};

interface Props {
  type: keyof typeof DocLinks;
}

export const HostMetricsDocsLink = ({ type }: Props) => {
  return (
    <EuiText size="xs">
      <EuiLink
        data-test-subj="hostsViewMetricsDocumentationLink"
        href={DocLinks[type].href}
        target="_blank"
      >
        {DocLinks[type].label}
      </EuiLink>
    </EuiText>
  );
};
