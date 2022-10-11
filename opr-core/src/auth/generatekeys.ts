/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {exportJWK, generateKeyPair, GenerateKeyPairOptions} from 'jose';
import {LabeledJwk} from './labeledjwk';

export const RSA_ALGORITHM_NAMES = [
  'RS256',
  'RS384',
  'RS512',
  'PS256',
  'PS384',
  'PS512',
  'RSA-OAEP',
  'RSA-OAEP-256',
  'RSA-OAEP-384',
  'RSA-OAEP-512',
  'RSA1_5',
] as const;

export type RSA_ALGORITHM_NAME = typeof RSA_ALGORITHM_NAMES[number];
export interface RsaKeySpec {
  alg: RSA_ALGORITHM_NAME;
  modulusLength?: number;
}

export const EC_NO_CONFIG_ALGORITHM_NAMES = [
  'ES256',
  'ES256K',
  'ES384',
  'ES512',
] as const;
export type EC_NO_CONFIG_ALGORITHM_NAME =
  typeof EC_NO_CONFIG_ALGORITHM_NAMES[number];
export interface EcNoConfigKeySpec {
  alg: EC_NO_CONFIG_ALGORITHM_NAME;
}

export const EC_ED_CONFIG_ALGORITHM_NAMES = ['EdDSA'] as const;
export type EC_ED_CONFIG_ALGORITHM_NAME =
  typeof EC_ED_CONFIG_ALGORITHM_NAMES[number];
export const EC_ED_CURVE_NAMES = ['Ed25519', 'Ed448'] as const;
export type EC_ED_CURVE_NAME = typeof EC_ED_CURVE_NAMES[number];
export interface EcEdConfigKeySpec {
  alg: EC_ED_CONFIG_ALGORITHM_NAME;
  crv?: EC_ED_CURVE_NAME;
}

export const EC_ECDH_CONFIG_ALGORITHM_NAMES = [
  'ECDH-ES',
  'ECDH-ES+A128KW',
  'ECDH-ES+A192KW',
  'ECDH-ES+A256KW',
] as const;
export type EC_ECDH_CONFIG_ALGORITHM_NAME =
  typeof EC_ECDH_CONFIG_ALGORITHM_NAMES[number];
export const EC_ECDH_CURVE_NAMES = [
  'P-256',
  'P-384',
  'P-521',
  'X25519',
  'X448',
] as const;
export type EC_ECDH_CURVE_NAME = typeof EC_ECDH_CURVE_NAMES[number];
export interface EcEcdhConfigSpec {
  alg: EC_ECDH_CONFIG_ALGORITHM_NAME;
  crv?: EC_ECDH_CURVE_NAME;
}

export type EC_ALGORITHM_NAME =
  | EC_NO_CONFIG_ALGORITHM_NAME
  | EC_ED_CONFIG_ALGORITHM_NAME
  | EC_ECDH_CONFIG_ALGORITHM_NAME;
export const EC_CONFIGURABLE_ALGORITHM_NAMES = [
  ...EC_ED_CONFIG_ALGORITHM_NAMES,
  ...EC_ECDH_CONFIG_ALGORITHM_NAMES,
] as const;
export const EC_ALGORITHM_NAMES = [
  ...EC_NO_CONFIG_ALGORITHM_NAMES,
  ...EC_CONFIGURABLE_ALGORITHM_NAMES,
] as const;
export const ALGORITHM_NAMES = [
  ...RSA_ALGORITHM_NAMES,
  ...EC_ALGORITHM_NAMES,
] as const;
export type ALGORITHM_NAME = EC_ALGORITHM_NAME | RSA_ALGORITHM_NAME;

export type EC_CURVE_NAME = EC_ED_CURVE_NAME | EC_ECDH_CURVE_NAME;
export const CURVE_NAMES = [...EC_ED_CURVE_NAMES, ...EC_ECDH_CURVE_NAMES];
export type EcConfigurableKeySpec = EcEdConfigKeySpec | EcEcdhConfigSpec;
export type KeySpec = RsaKeySpec | EcNoConfigKeySpec | EcConfigurableKeySpec;

const algToCurveMap = {} as Record<
  EC_ALGORITHM_NAME,
  Readonly<Array<EC_CURVE_NAME>>
>;

for (const noConfigAlg of EC_NO_CONFIG_ALGORITHM_NAMES) {
  algToCurveMap[noConfigAlg] = [];
}
for (const edConfigAlg of EC_ED_CONFIG_ALGORITHM_NAMES) {
  algToCurveMap[edConfigAlg] = EC_ED_CURVE_NAMES;
}
for (const ecdhConfigAlg of EC_ECDH_CONFIG_ALGORITHM_NAMES) {
  algToCurveMap[ecdhConfigAlg] = EC_ECDH_CURVE_NAMES;
}

export function isRsaAlgorithm(alg: string): alg is RSA_ALGORITHM_NAME {
  return (RSA_ALGORITHM_NAMES as Readonly<Array<string>>).indexOf(alg) >= 0;
}

export function isEcAlgorithm(alg: string): alg is RSA_ALGORITHM_NAME {
  return (EC_ALGORITHM_NAMES as Readonly<Array<string>>).indexOf(alg) >= 0;
}

export interface JwkKeyPair {
  publicKey: LabeledJwk;
  privateKey: LabeledJwk;
}

export function toKeySpec(
  alg: string,
  userOptions?: GenerateKeyPairOptions
): KeySpec {
  // TODO: Check config correctness.
  return {
    ...userOptions,
    alg: alg,
  } as KeySpec;
}

export async function generateKeys(
  keySpec: KeySpec | string,
  userOptions?: GenerateKeyPairOptions
): Promise<JwkKeyPair> {
  if (typeof keySpec === 'string') {
    keySpec = toKeySpec(keySpec, userOptions);
  }
  const options = {} as GenerateKeyPairOptions;
  options.modulusLength = (keySpec as RsaKeySpec).modulusLength;
  options.crv = (keySpec as EcConfigurableKeySpec).crv;
  const keys = await generateKeyPair(keySpec.alg, options);
  const privateJwk = {
    ...(await exportJWK(keys.privateKey)),
    alg: keySpec.alg,
  };
  const publicJwk = {
    ...(await exportJWK(keys.publicKey)),
    alg: keySpec.alg,
  };
  const jwks = {
    privateKey: privateJwk,
    publicKey: publicJwk,
  };
  return jwks;
}
