/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
