/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { BehaviorSubject } from 'rxjs';

import { type MetricsServiceSetup, ServiceStatus, ServiceStatusLevels } from '@kbn/core/server';
import {
  loggingSystemMock,
  metricsServiceMock,
  executionContextServiceMock,
} from '@kbn/core/server/mocks';
import {
  createHttpService,
  HttpIntegrationServiceSetupContractMock,
} from '@kbn/core-http-server-mocks';
import { registerStatsRoute } from '../stats';
import supertest from 'supertest';
import { CollectorSet } from '../../collector';

type HttpService = ReturnType<typeof createHttpService>;
type HttpSetup = HttpIntegrationServiceSetupContractMock;

describe('/api/stats', () => {
  let server: HttpService;
  let httpSetup: HttpSetup;
  let overallStatus$: BehaviorSubject<ServiceStatus>;
  let metrics: MetricsServiceSetup;

  beforeEach(async () => {
    server = createHttpService();
    await server.preboot();
    httpSetup = await server.setup();
    overallStatus$ = new BehaviorSubject<ServiceStatus>({
      level: ServiceStatusLevels.available,
      summary: 'everything is working',
    });
    metrics = metricsServiceMock.createSetupContract();

    const router = httpSetup.createRouter('');
    registerStatsRoute({
      router,
      collectorSet: new CollectorSet({
        logger: loggingSystemMock.create().asLoggerFactory().get(),
        executionContext: executionContextServiceMock.createSetupContract(),
      }),
      config: {
        allowAnonymous: true,
        kibanaIndex: '.kibana-test',
        kibanaVersion: '8.8.8-SNAPSHOT',
        server: {
          name: 'mykibana',
          hostname: 'mykibana.com',
          port: 1234,
        },
        uuid: 'xxx-xxxxx',
      },
      metrics,
      overallStatus$,
    });

    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('successfully returns data', async () => {
    const response = await supertest(httpSetup.server.listener).get('/api/stats').expect(200);
    expect(response.body).toMatchObject({
      kibana: {
        uuid: 'xxx-xxxxx',
        name: 'mykibana',
        index: '.kibana-test',
        host: 'mykibana.com',
        locale: 'en',
        transport_address: `mykibana.com:1234`,
        version: '8.8.8',
        snapshot: true,
        status: 'green',
      },
      last_updated: expect.any(String),
      collection_interval_ms: expect.any(Number),
    });
  });
});
