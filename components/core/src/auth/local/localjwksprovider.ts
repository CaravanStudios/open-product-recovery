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

import {JwksProvider} from '../../auth/jwksprovider';
import {JSONWebKeySet, JWK} from 'jose';
import {ProviderIntegration} from '../../coreapi';

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

export const LocalJwksIntegration = {
  async construct(json) {
    const keys = json.publicKeys as Array<JWK>;
    return new LocalJwksProvider(keys);
  },
} as ProviderIntegration<LocalJwksProvider>;
