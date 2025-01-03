/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { ReactElement } from 'react';
import { useLocation } from 'react-router-dom';
import { useApmRouter } from '../../../../hooks/use_apm_router';
import { useDateRangeRedirect } from '../../../../hooks/use_date_range_redirect';
import { isRouteWithTimeRange } from '../../../shared/is_route_with_time_range';

// This is a top-level component that blocks rendering of the routes
// if there is no valid date range, and redirects to one if needed.
// If we don't do this, routes down the tree will fail because they
// expect the rangeFrom/rangeTo parameters to be set in the URL.
//
// This should be considered a temporary workaround until we have a
// more comprehensive solution for redirects that require context.

export function RedirectWithDefaultDateRange({ children }: { children: ReactElement }) {
  const { isDateRangeSet, redirect } = useDateRangeRedirect();

  const apmRouter = useApmRouter();
  const location = useLocation();

  const matchesRoute = isRouteWithTimeRange({ apmRouter, location });

  if (!isDateRangeSet && matchesRoute) {
    redirect();
    return null;
  }

  return children;
}
