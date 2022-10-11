/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {AlgKeyLike} from './algkeylike';

/** A version of AlgKeyLike where the algorithm must be specified. */
export interface MandatoryAlgKeyLike extends AlgKeyLike {
  alg: string;
}
