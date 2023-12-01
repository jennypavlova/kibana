/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { EuiText } from '@elastic/eui';
import { FormattedDate, FormattedMessage, FormattedTime } from '@kbn/i18n-react';
import { useDatePickerContext } from '../hooks_wip/use_date_picker';

export const ProcessesExplanationMessage = () => {
  const { getDateRangeInTimestamp } = useDatePickerContext();
  const dateFromRange = new Date(getDateRangeInTimestamp().to);

  return (
    <EuiText size="xs" color="subdued">
      <FormattedMessage
        id="xpack.infra.assetDetails.overview.processesSectionTitle"
        defaultMessage="Showing process data collected for the 1 minute preceding {date} @ {time}"
        values={{
          date: <FormattedDate value={dateFromRange} month="short" day="numeric" year="numeric" />,
          time: (
            <FormattedTime
              value={dateFromRange}
              hour12={false}
              hour="2-digit"
              minute="2-digit"
              second="2-digit"
            />
          ),
        }}
      />
    </EuiText>
  );
};
