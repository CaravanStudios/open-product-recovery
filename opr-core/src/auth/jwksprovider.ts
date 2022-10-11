/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {JSONWebKeySet} from 'jose';

export interface JwksProvider {
  getJwks(): Promise<JSONWebKeySet>;
}
