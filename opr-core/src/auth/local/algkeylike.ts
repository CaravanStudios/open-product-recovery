/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {KeyLike} from 'jose';

/** An extension of Jose's KeyLike interface with an optional algorithm. */
export interface AlgKeyLike extends KeyLike {
  alg?: string;
}
