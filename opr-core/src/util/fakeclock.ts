/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Clock} from './clock';

/** A fake clock to be used during testing. */
export class FakeClock implements Clock {
  private time: number;

  constructor() {
    this.time = Date.now();
  }

  setTime(now: number) {
    this.time = now;
  }

  now(): number {
    return this.time;
  }
}
