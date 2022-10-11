/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {JwksProvider} from '../../auth/jwksprovider';
import {JSONWebKeySet, JWK} from 'jose';

export class LocalJwksProvider implements JwksProvider {
  private publicKeysProvider: () => Promise<Array<JWK>>;

  constructor(publicKeysProvider: (() => Promise<Array<JWK>>) | Array<JWK>) {
    if (Array.isArray(publicKeysProvider)) {
      this.publicKeysProvider = async () => {
        return publicKeysProvider;
      };
    } else {
      this.publicKeysProvider = publicKeysProvider;
    }
  }

  async getJwks(): Promise<JSONWebKeySet> {
    return {
      keys: await this.publicKeysProvider(),
    };
  }
}
