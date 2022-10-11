/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Clock} from '../../util/clock';
import {DefaultClock} from '../../util/defaultclock';
import {StatusError} from '../../util/statuserror';
import {importJWK, JWK, JWTPayload, KeyLike, SignJWT} from 'jose';
import {Signer, IssueTokenOptions, SignChainOptions} from '../signer';
import {ReshareChain} from 'opr-models';

const DEFAULT_TOKEN_MAX_AGE_MILLIS = 10 * 60 * 1000; // 10 minutes

export class LocalKeySigner implements Signer {
  protected issuer: string;
  private privateKeyProvider: () => Promise<JWK>;
  private clock: Clock;

  constructor(
    issuer: string,
    privateKeyProvider: (() => Promise<JWK>) | JWK,
    clock: Clock = new DefaultClock()
  ) {
    this.issuer = issuer;
    this.clock = clock;
    if (typeof privateKeyProvider === 'function') {
      this.privateKeyProvider = privateKeyProvider;
    } else {
      this.privateKeyProvider = async () => {
        return privateKeyProvider;
      };
    }
  }

  async signChain(
    chain: ReshareChain,
    sub: string,
    options?: SignChainOptions
  ): Promise<ReshareChain> {
    let entitlement = options?.initialEntitlement;
    if (chain.length > 0) {
      const lastToken = chain[chain.length - 1];
      const tokenParts = lastToken.split('.');
      const lastSig = tokenParts[tokenParts.length - 1];
      entitlement = lastSig;
    }
    if (!entitlement) {
      throw new Error('Cannot sign a chain without an entitlement');
    }
    const jwk = await this.getPrivateKey();
    const key = await importJWK(jwk);
    const payload = {
      entitlements: entitlement,
    } as Record<string, unknown>;
    if (options?.scopes && options?.scopes.length) {
      payload['scope'] = options.scopes.join(' ');
    }
    const signJwt = this.createSignJwt(payload)
      .setProtectedHeader({alg: jwk.alg!})
      .setIssuer(this.issuer)
      .setSubject(sub);
    const token = await signJwt.sign(key);
    return [...chain, token];
  }

  private async getPrivateKey(): Promise<JWK> {
    const jwk = await this.privateKeyProvider();
    if (!jwk.alg) {
      throw new StatusError('JWKs in OPR must specify an alg');
    }
    return jwk;
  }

  protected createSignJwt(payload: JWTPayload): SignJWT {
    return new SignJWT(payload);
  }

  async issueToken(aud: string, options?: IssueTokenOptions): Promise<string> {
    const jwk = await this.getPrivateKey();
    const key = await importJWK(jwk);
    const payload = {} as Record<string, unknown>;
    if (options?.scopes && options?.scopes.length) {
      payload['scope'] = options.scopes.join(' ');
    }
    const maxAgeMillis = options?.maxAgeMillis || DEFAULT_TOKEN_MAX_AGE_MILLIS;
    const signJwt = this.createSignJwt(payload)
      .setProtectedHeader({alg: jwk.alg!})
      .setIssuedAt(Math.round(this.clock.now() / 1000))
      .setIssuer(this.issuer)
      .setAudience(aud)
      .setExpirationTime(Math.round((this.clock.now() + maxAgeMillis) / 1000));
    if (options?.sub) {
      signJwt.setSubject(options.sub);
    }
    return await signJwt.sign(key);
  }
}
