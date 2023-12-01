/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { useEffect, useMemo } from 'react';
import type { BaseFlameGraph } from '@kbn/profiling-utils';
import { type InfraProfilingFlamegraphRequestParams } from '../../../../common/http_api/profiling_api';
import { useHTTPRequest } from '../../../hooks/use_http_request';
import { useRequestObservable } from './use_request_observable';

interface Props {
  params: InfraProfilingFlamegraphRequestParams;
  isActive: boolean;
}

export function useProfilingFlamegraphData({ params, isActive }: Props) {
  const { request$ } = useRequestObservable<BaseFlameGraph>();
  const fetchOptions = useMemo(() => ({ query: params }), [params]);
  const { loading, error, response, makeRequest } = useHTTPRequest<BaseFlameGraph>(
    `/api/infra/profiling/flamegraph`,
    'GET',
    undefined,
    undefined,
    undefined,
    undefined,
    true,
    fetchOptions
  );

  useEffect(() => {
    if (!isActive) {
      return;
    }

    request$.next(makeRequest);
  }, [isActive, makeRequest, request$]);

  return {
    loading,
    error,
    response,
  };
}
