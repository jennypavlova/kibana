/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

module.exports = {
  preset: '@kbn/test/jest_integration',
  rootDir: '../../../../..',
  roots: ['<rootDir>/x-pack/solutions/security/plugins/security_solution'],
  globals: {
    Uint8Array: Uint8Array,
  },
};
