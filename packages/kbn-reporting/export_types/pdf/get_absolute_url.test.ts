/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { getAbsoluteUrlFactory } from './get_absolute_url';

const defaultOptions = {
  basePath: 'sbp',
  protocol: 'http:',
  hostname: 'localhost',
  port: 5601,
};

test(`by default it builds urls using information from server.info.protocol and the server.config`, () => {
  const getAbsoluteUrl = getAbsoluteUrlFactory(defaultOptions);
  const absoluteUrl = getAbsoluteUrl();
  expect(absoluteUrl).toBe(`http://localhost:5601/sbp/app/kibana`);
});

test(`uses kibanaServer.protocol if specified`, () => {
  const getAbsoluteUrl = getAbsoluteUrlFactory({
    ...defaultOptions,
    protocol: 'https:',
  });

  const absoluteUrl = getAbsoluteUrl();
  expect(absoluteUrl).toBe(`https://localhost:5601/sbp/app/kibana`);
});

test(`uses kibanaServer.hostname if specified`, () => {
  const getAbsoluteUrl = getAbsoluteUrlFactory({
    ...defaultOptions,
    hostname: 'something-else',
  });

  const absoluteUrl = getAbsoluteUrl();
  expect(absoluteUrl).toBe(`http://something-else:5601/sbp/app/kibana`);
});

test(`uses kibanaServer.port if specified`, () => {
  const getAbsoluteUrl = getAbsoluteUrlFactory({
    ...defaultOptions,
    port: 8008,
  });

  const absoluteUrl = getAbsoluteUrl();
  expect(absoluteUrl).toBe(`http://localhost:8008/sbp/app/kibana`);
});

test(`uses the provided hash`, () => {
  const getAbsoluteUrl = getAbsoluteUrlFactory(defaultOptions);
  const hash = '/hash';
  const absoluteUrl = getAbsoluteUrl({ hash });
  expect(absoluteUrl).toBe(`http://localhost:5601/sbp/app/kibana#${hash}`);
});

test(`uses the provided hash with queryString`, () => {
  const getAbsoluteUrl = getAbsoluteUrlFactory(defaultOptions);
  const hash = '/hash?querystring';
  const absoluteUrl = getAbsoluteUrl({ hash });
  expect(absoluteUrl).toBe(`http://localhost:5601/sbp/app/kibana#${hash}`);
});

test(`uses the provided basePath`, () => {
  const getAbsoluteUrl = getAbsoluteUrlFactory({ ...defaultOptions, basePath: '/s/marketing' });
  const absoluteUrl = getAbsoluteUrl();
  expect(absoluteUrl).toBe(`http://localhost:5601/s/marketing/app/kibana`);
});

test(`uses the path`, () => {
  const getAbsoluteUrl = getAbsoluteUrlFactory(defaultOptions);
  const path = '/app/canvas';
  const absoluteUrl = getAbsoluteUrl({ path });
  expect(absoluteUrl).toBe(`http://localhost:5601/sbp${path}`);
});

test(`uses the search`, () => {
  const getAbsoluteUrl = getAbsoluteUrlFactory(defaultOptions);
  const search = '_t=123456789';
  const absoluteUrl = getAbsoluteUrl({ search });
  expect(absoluteUrl).toBe(`http://localhost:5601/sbp/app/kibana?${search}`);
});
