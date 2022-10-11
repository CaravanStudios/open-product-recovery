/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ChainScope} from '../auth/chainscope';

export const WILDCARD_ORG_ID = '*';

export interface Interval {
  startTimeUTC: number;
  endTimeUTC: number;
}

export interface Listing extends Interval {
  readonly orgUrl: string;
  readonly scopes?: Array<ChainScope>;
}

export interface TrimIntervalOptions {
  startAt?: number;
  endAt?: number;
}

export function trim(
  interval: Interval,
  options: TrimIntervalOptions
): Interval | undefined {
  const newInterval = {
    startTimeUTC: options.startAt ?? interval.startTimeUTC,
    endTimeUTC: options.endAt ?? interval.endTimeUTC,
  } as Interval;
  return newInterval.startTimeUTC < newInterval.endTimeUTC
    ? newInterval
    : undefined;
}

export function intersect(
  basis: Interval,
  other: Interval
): Interval | undefined {
  return trim(basis, {
    startAt: Math.max(basis.startTimeUTC, other.startTimeUTC),
    endAt: Math.min(basis.endTimeUTC, other.endTimeUTC),
  });
}

/** Sub */
export function subtract(basis: Interval, other: Interval): Array<Interval> {
  const result = [];
  const left = trim(basis, {
    startAt: Math.min(basis.startTimeUTC, other.startTimeUTC),
    endAt: Math.min(basis.endTimeUTC, other.startTimeUTC),
  });
  if (left) {
    result.push(left);
  }
  const right = trim(basis, {
    startAt: Math.max(basis.startTimeUTC, other.endTimeUTC),
    endAt: Math.max(basis.endTimeUTC, other.endTimeUTC),
  });
  if (right) {
    result.push(right);
  }
  return result;
}

export function updateInterval(dest: Interval, src: Interval): void {
  dest.startTimeUTC = src.startTimeUTC;
  dest.endTimeUTC = src.endTimeUTC;
}
