/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Clock, DefaultClock} from '../coreapi';

/** An unordered set of organization urls. */
export interface AsyncGetter<T> {
  get(): Promise<T>;
}

export interface CachedAsyncGetterOptions<T> {
  clock?: Clock;
  delegate: AsyncGetter<T>;
  maxAgeMillis?: number;
}

export class CachedAsyncGetter<T> implements AsyncGetter<T> {
  private clock: Clock;
  private cache?: T;
  private delegate: AsyncGetter<T>;
  private lastCacheFetchTimestampUTC?: number;
  private maxAgeMillis: number;

  constructor(options: CachedAsyncGetterOptions<T>) {
    this.clock = options.clock || new DefaultClock();
    this.delegate = options.delegate;
    this.maxAgeMillis = options.maxAgeMillis ?? 60 * 1000 /* one minute */;
  }

  getCacheAgeMillis(): number {
    return this.lastCacheFetchTimestampUTC === undefined
      ? Number.POSITIVE_INFINITY
      : this.clock.now() - this.lastCacheFetchTimestampUTC;
  }

  async get(): Promise<T> {
    if (!this.cache || this.getCacheAgeMillis() > this.maxAgeMillis) {
      this.cache = await this.delegate.get();
    }
    return this.cache;
  }
}

export class StaticAsyncGetter<T> implements AsyncGetter<T> {
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  set(value: T) {
    this.value = value;
  }

  async get(): Promise<T> {
    return this.value;
  }

  static build<T>(value: T): AsyncGetter<T> {
    return new StaticAsyncGetter(value);
  }
}

export function asAsyncGetter<T>(value: T | AsyncGetter<T>): AsyncGetter<T> {
  if ((value as AsyncGetter<T>).get) {
    return value as AsyncGetter<T>;
  }
  return StaticAsyncGetter.build(value as T);
}
