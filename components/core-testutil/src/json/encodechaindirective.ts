/**
 * Copyright 2023 The Open Product Recovery Authors
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

import {importJWK, SignJWT} from 'jose';
import {$, Directive, Resolver, SourcedJsonValue} from 'opr-devtools';
import {TokenKeyGetter} from './tokenkeygetter';

const DEFAULT_JWK = {
  kty: 'EC',
  crv: 'P-256',
  x: 'rSGY_zAh5_OKYo7lQBWsObKb7zFFUDyn35dKIdu-PS4',
  y: 'Nq71ySDD1FfS0ui_cBZcdeqZmVNc-ChKe_KcnmyZvpM',
  d: 'z-gEONqok13ltcWCAcBnb3mRuPOUegpBTyYDkxdhuN0',
  alg: 'ES256',
};

export class EncodeChainDirective implements Directive {
  private keyGetter: TokenKeyGetter;

  constructor(keyGetter: TokenKeyGetter = async () => DEFAULT_JWK) {
    this.keyGetter = keyGetter;
  }

  accept(key: string): boolean {
    return key === '$encodeChain';
  }

  async transform(
    resolver: Resolver,
    obj: SourcedJsonValue,
    key: string,
    value: SourcedJsonValue
  ): Promise<SourcedJsonValue> {
    value.assertIsArray();
    const result: Array<string> = [];
    for (const obj of value) {
      const payload: SourcedJsonValue = obj;
      payload.assertIsObject();
      const payloadJson = payload.toJson();
      const jwk = await this.keyGetter(payloadJson);
      if (!jwk.alg) {
        throw new Error('JWK must contain an alg field');
      }
      const signingKey = await importJWK(jwk);
      const signJwt = new SignJWT(payload.toJson()).setProtectedHeader({
        alg: jwk.alg,
      });
      const token = await signJwt.sign(signingKey);
      result.push(token);
    }
    return $(result);
  }
}
