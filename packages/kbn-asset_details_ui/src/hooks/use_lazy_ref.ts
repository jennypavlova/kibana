/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { useRef, MutableRefObject } from 'react';

export const useLazyRef = <Type>(initializer: () => Type) => {
  const ref = useRef<Type | null>(null);
  if (ref.current === null) {
    ref.current = initializer();
  }
  return ref as MutableRefObject<Type>;
};
