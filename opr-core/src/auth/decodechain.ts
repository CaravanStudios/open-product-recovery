/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {decodeJwt, JWTPayload} from 'jose';
import {
  DecodedReshareChain,
  DecodedReshareChainLink,
  ReshareChain,
} from 'opr-models';
import {extractSignature} from './tokenparts';

/** Decodes a reshare chain without doing any validation on the signature. */
export function decodeChain(reshareChain: ReshareChain): DecodedReshareChain {
  return reshareChain.map(jwt => jwtToChainLink(jwt));
}

/**
 * Converts an individual JWT into a decoded chain link without validating the
 * signature.
 */
export function jwtToChainLink(jwt: string): DecodedReshareChainLink {
  return jwtPayloadToChainLink(decodeJwt(jwt), extractSignature(jwt));
}

/** Converts a decoded JWT payload into a decoded chain link. */
export function jwtPayloadToChainLink(
  decoded: JWTPayload,
  signature: string
): DecodedReshareChainLink {
  return {
    sharingOrgUrl: decoded.iss!,
    recipientOrgUrl: decoded.sub!,
    entitlements: decoded.entitlements as string,
    signature: signature,
    scopes: (decoded['scope'] as string).split(' '),
  } as DecodedReshareChainLink;
}
