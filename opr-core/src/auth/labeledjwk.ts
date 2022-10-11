/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {JWK} from 'jose';

export interface LabeledJwk extends JWK {
  alg: string;
}
