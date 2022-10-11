/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {StatusError} from './statuserror';

export class IllegalRequestError extends StatusError {
  constructor(desc: string, code: string) {
    super(desc, code, 400);
  }
}
