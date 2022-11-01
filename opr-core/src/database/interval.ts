/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A time interval. The interval includes the instant at startTimeUTC, but does
 * NOT include the instant at endTimeUTC.
 */
export interface Interval {
  startTimeUTC: number;
  endTimeUTC: number;
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
