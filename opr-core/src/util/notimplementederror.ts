/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {StatusError} from './statuserror';

export class NotImplementedError extends StatusError {
  constructor() {
    super('Not implemented', 'NOT_IMPLEMENTED', 501);
  }
}
