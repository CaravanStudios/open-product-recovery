/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Clock} from './clock';

export class DefaultClock implements Clock {
  now(): number {
    return Date.now();
  }
}
