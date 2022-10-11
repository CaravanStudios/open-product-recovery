/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/** Clock interface for determining the current time. */
export interface Clock {
  now(): number;
}
