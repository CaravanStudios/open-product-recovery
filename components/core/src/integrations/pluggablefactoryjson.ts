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

import {JsonMap} from '../util/jsonvalue';
import {Pluggable} from './pluggable';
import {PluggableFactory} from './pluggablefactory';
import {PluggableFactorySet} from './pluggablefactoryset';

export type ModuleNameType = string;

/**
 * Defines the shape of a JSON config section that loads a PluggableFactory.
 * This JSON can take 3 forms:
 *
 * 1) Map form:
 * {
 *   moduleName: 'SqlStorage',
 *   params: {
 *     type: 'sqlite',
 *     database: ':memory:',
 *   }
 * }
 *
 * 2) Tuple form (in the style of eslint configs):
 * [
 *   'SqlStorage',
 *   params: {
 *     type: 'sqlite',
 *     database: ':memory:',
 *   }
 * ]
 *
 * 3) Just a module name (only allowed if there are no params):
 * 'UniversalListingPolicy'
 */
export type PluggableFactoryJsonStanza<
  ModuleName extends ModuleNameType,
  JsonFormat
> =
  | PluggableFactoryJsonMapStanza<ModuleName, JsonFormat>
  | PluggableFactoryJsonTupleStanza<ModuleName, JsonFormat>
  | PluggableFactoryJsonStringStanza<ModuleName>;

export type PluggableFactoryJsonTupleStanza<ModuleName, JsonFormat> = [
  ModuleName,
  JsonFormat
];

export type PluggableFactoryJsonStringStanza<ModuleName> = ModuleName;

export interface PluggableFactoryJsonMapStanza<ModuleName, JsonFormat> {
  readonly moduleName: ModuleName;
  readonly params: JsonFormat;
}

export function isPluggableFactoryJsonStanza<
  T extends ModuleNameType,
  JsonFormat extends JsonMap | undefined
>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  x: unknown,
  allowed: PluggableFactorySet<PluggableFactory<Pluggable, unknown, unknown>>
): x is PluggableFactoryJsonStanza<T, JsonFormat> {
  if (typeof x === 'string') {
    return allowed[x] !== undefined;
  }
  if (
    Array.isArray(x) &&
    x.length === 2 &&
    typeof x[0] === 'string' &&
    allowed[x[0]] &&
    typeof x[1] === 'object'
  ) {
    return true;
  }
  const testObj = x as PluggableFactoryJsonMapStanza<T, JsonFormat>;
  return (
    typeof testObj.moduleName === 'string' &&
    allowed[testObj.moduleName] &&
    typeof testObj.params === 'object'
  );
}
