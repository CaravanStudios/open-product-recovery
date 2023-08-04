/**
 * Copyright 2023 The Open Product Recovery Authors
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

import {JsonValue} from '../util/jsonvalue';

/**
 * An API used by OPR integrations to store or fetch key/value pairs.
 */
export interface KeyValueApi {
  /**
   * Stores a key-value pair. If a value already exists at the given key, it
   * will be replaced and the old value returned.
   */
  storeValue(key: string, value: JsonValue): Promise<JsonValue | undefined>;

  /**
   * Deletes all values stored with the given key prefix. Returns the number of
   * keys deleted if supported by the storage driver.
   */
  clearAllValues(keyPrefix: string): Promise<number | undefined>;

  /**
   * Returns all values for the given host where the key starts with the given
   * prefix.
   */
  getValues(keyPrefix: string): AsyncIterable<JsonValue>;
}
