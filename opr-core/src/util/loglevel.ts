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

import log, {Logger} from 'loglevel';
import util, {InspectOptions} from 'util';

// If we let every package import loglevel independently, node will resolve the
// default logger to a different object in every package that imports it. We
// import and rexport a single instance of the logger here, so that every
// package will actually get the same instance of the object as long as it is
// imported through us.
export default log;

class CustomLogged {
  private value: unknown;
  private options: InspectOptions;

  constructor(
    value: unknown,
    options: InspectOptions = {
      depth: null,
    }
  ) {
    this.value = value;
    this.options = options;
    util.inspect;
  }

  [util.inspect.custom](
    depth: number,
    options: InspectOptions,
    inspect: (object: any, options: InspectOptions) => string
  ) {
    return inspect(this.value, this.options);
  }
}

/**
 * Wraps a value in an object that will serialize using custom logging.
 */
export function logCustom(x: unknown, options?: InspectOptions): CustomLogged {
  return new CustomLogged(x, options);
}

export {log, Logger};
