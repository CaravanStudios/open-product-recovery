/**
 * Copyright 2023 Google LLC
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

import {JsonMap} from '../coreapi';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ProviderIntegrationJson<T, JsonFormat extends JsonMap = {}>
  extends JsonMap {
  readonly moduleName: string;
  readonly params?: JsonFormat;
}

export function isProviderIntegrationJson<T, JsonFormat extends JsonMap>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  x: any
): x is ProviderIntegrationJson<T, JsonFormat> {
  return (
    typeof x.moduleName === 'string' &&
    (x.config === undefined || typeof x.config === 'object') &&
    (x.exportName === undefined || typeof x.exportName === 'string')
  );
}
