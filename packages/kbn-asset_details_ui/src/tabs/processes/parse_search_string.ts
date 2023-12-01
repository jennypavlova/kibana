/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

export const parseSearchString = (query: string) => {
  if (query.trim() === '') {
    return [
      {
        match_all: {},
      },
    ];
  }
  const elements = query
    .split(' ')
    .map((s) => s.trim())
    .filter(Boolean);
  const stateFilter = elements.filter((s) => s.startsWith('state='));
  const cmdlineFilters = elements.filter((s) => !s.startsWith('state='));
  return [
    ...cmdlineFilters.map((clause) => ({
      query_string: {
        fields: ['system.process.cmdline'],
        query: `*${escapeReservedCharacters(clause)}*`,
        minimum_should_match: 1,
      },
    })),
    ...stateFilter.map((state) => ({
      match: {
        'system.process.state': state.replace('state=', ''),
      },
    })),
  ];
};

const escapeReservedCharacters = (clause: string) =>
  clause.replace(/([+\-=!\(\)\{\}\[\]^"~*?:\\/!]|&&|\|\|)/g, '\\$1');
