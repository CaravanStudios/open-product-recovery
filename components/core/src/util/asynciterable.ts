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

/** Collects the contents of an async iterable into an array. */
export async function asyncIterableToArray<T>(
  it: AsyncIterable<T>
): Promise<Array<T>> {
  const result = [];
  for await (const x of it) {
    result.push(x);
  }
  return result;
}

/** Returns whether there are any items in the given iterable. */
export async function hasContents(
  it: AsyncIterable<unknown>
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const x of it) {
    return true;
  }
  return false;
}

/** Returns the first item in the given iterable. */
export async function asyncIterableFirst<T>(
  it: AsyncIterable<T>
): Promise<T | undefined> {
  for await (const x of it) {
    return x;
  }
  return undefined;
}

/** Transforms two async iterables into a single async iterable. */
export async function* appendAsyncIterables<T>(
  ...its: AsyncIterable<T>[]
): AsyncIterable<T> {
  for (const it of its) {
    for await (const x of it) {
      yield x;
    }
  }
}

/** Transforms a normal iterable into an async iterable. */
export async function* iterableToAsync<T>(it: Iterable<T>): AsyncIterable<T> {
  for (const x of it) {
    yield x;
  }
}
