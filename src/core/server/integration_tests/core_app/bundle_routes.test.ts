/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { resolve } from 'path';
import { readFile } from 'fs/promises';
import supertest from 'supertest';
import { loggingSystemMock } from '@kbn/core-logging-server-mocks';
import { executionContextServiceMock } from '@kbn/core-execution-context-server-mocks';
import { contextServiceMock } from '@kbn/core-http-context-server-mocks';
import type { IRouter } from '@kbn/core-http-server';
import { registerRouteForBundle, FileHashCache } from '@kbn/core-apps-server-internal';
import { HttpService } from '@kbn/core-http-server-internal';
import { createInternalHttpService } from '../utilities';

const buildHash = 'buildHash';
const fooPluginFixture = resolve(__dirname, './__fixtures__/plugin/foo');

describe('bundle routes', () => {
  let server: HttpService;
  let contextSetup: ReturnType<typeof contextServiceMock.createSetupContract>;
  let logger: ReturnType<typeof loggingSystemMock.create>;
  let fileHashCache: FileHashCache;

  beforeEach(async () => {
    contextSetup = contextServiceMock.createSetupContract();
    logger = loggingSystemMock.create();
    fileHashCache = new FileHashCache();

    server = createInternalHttpService({ logger });
    await server.preboot({ context: contextServiceMock.createPrebootContract() });
  });

  afterEach(async () => {
    await server.stop();
  });

  const registerFooPluginRoute = (
    router: IRouter,
    { isDist = false }: { isDist?: boolean } = {}
  ) => {
    registerRouteForBundle(router, {
      isDist,
      fileHashCache,
      bundlesPath: fooPluginFixture,
      routePath: `/${buildHash}/bundles/plugin/foo/`,
      publicPath: `/${buildHash}/bundles/plugin/foo/`,
    });
  };

  it('serves images inside from the bundle path', async () => {
    const { server: innerServer, createRouter } = await server.setup({
      context: contextSetup,
      executionContext: executionContextServiceMock.createInternalSetupContract(),
    });

    registerFooPluginRoute(createRouter(''));
    await server.start();

    const response = await supertest(innerServer.listener)
      .get(`/${buildHash}/bundles/plugin/foo/image.png`)
      .expect(200);

    const actualImage = await readFile(resolve(fooPluginFixture, 'image.png'));
    expect(response.get('content-type')).toEqual('image/png');
    expect(response.body).toEqual(actualImage);
  });

  it('serves uncompressed js files', async () => {
    const { server: innerServer, createRouter } = await server.setup({
      context: contextSetup,
      executionContext: executionContextServiceMock.createInternalSetupContract(),
    });

    registerFooPluginRoute(createRouter(''));
    await server.start();

    const response = await supertest(innerServer.listener)
      .get(`/${buildHash}/bundles/plugin/foo/plugin.js`)
      .expect(200);

    const actualFile = await readFile(resolve(fooPluginFixture, 'plugin.js'));
    expect(response.get('content-type')).toEqual('application/javascript; charset=utf-8');
    expect(actualFile.toString('utf8')).toEqual(response.text);
  });

  it('returns 404 for files outside of the bundlePath', async () => {
    const { server: innerServer, createRouter } = await server.setup({
      context: contextSetup,
      executionContext: executionContextServiceMock.createInternalSetupContract(),
    });

    registerFooPluginRoute(createRouter(''));
    await server.start();

    await supertest(innerServer.listener)
      .get(`/${buildHash}/bundles/plugin/foo/../outside_output.js`)
      .expect(404);
  });

  it('returns 404 for non-existing files', async () => {
    const { server: innerServer, createRouter } = await server.setup({
      context: contextSetup,
      executionContext: executionContextServiceMock.createInternalSetupContract(),
    });

    registerFooPluginRoute(createRouter(''));
    await server.start();

    await supertest(innerServer.listener)
      .get(`/${buildHash}/bundles/plugin/foo/missing.js`)
      .expect(404);
  });

  it('returns gzip version if present', async () => {
    const { server: innerServer, createRouter } = await server.setup({
      context: contextSetup,
      executionContext: executionContextServiceMock.createInternalSetupContract(),
    });

    registerFooPluginRoute(createRouter(''));
    await server.start();

    const response = await supertest(innerServer.listener)
      .get(`/${buildHash}/bundles/plugin/foo/gzip_chunk.js`)
      .expect(200);

    expect(response.get('content-encoding')).toEqual('gzip');
    expect(response.get('content-type')).toEqual('application/javascript; charset=utf-8');

    const actualFile = await readFile(resolve(fooPluginFixture, 'gzip_chunk.js'));
    expect(actualFile.toString('utf8')).toEqual(response.text);
  });

  // supertest does not support brotli compression, cannot test
  // this is covered in FTR tests anyway
  it.skip('returns br version if present', () => {});

  describe('in production mode', () => {
    it('uses max-age cache-control', async () => {
      const { server: innerServer, createRouter } = await server.setup({
        context: contextSetup,
        executionContext: executionContextServiceMock.createInternalSetupContract(),
      });

      registerFooPluginRoute(createRouter(''), { isDist: true });
      await server.start();

      const response = await supertest(innerServer.listener)
        .get(`/${buildHash}/bundles/plugin/foo/gzip_chunk.js`)
        .expect(200);

      expect(response.get('cache-control')).toEqual('public, max-age=31536000, immutable');
      expect(response.get('etag')).toBeUndefined();
    });
  });

  describe('in development mode', () => {
    it('uses etag cache-control', async () => {
      const { server: innerServer, createRouter } = await server.setup({
        context: contextSetup,
        executionContext: executionContextServiceMock.createInternalSetupContract(),
      });

      registerFooPluginRoute(createRouter(''), { isDist: false });
      await server.start();

      const response = await supertest(innerServer.listener)
        .get(`/${buildHash}/bundles/plugin/foo/gzip_chunk.js`)
        .expect(200);

      expect(response.get('cache-control')).toEqual('must-revalidate');
      expect(response.get('etag')).toBeDefined();
    });
  });
});
