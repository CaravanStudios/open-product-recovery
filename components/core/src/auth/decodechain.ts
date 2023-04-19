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
