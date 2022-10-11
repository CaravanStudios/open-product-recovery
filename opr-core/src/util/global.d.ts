/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import log from 'loglevel';

declare global {
  // eslint-disable-next-line no-var
  var __loglevel__: log.RootLogger;
}

export {};
