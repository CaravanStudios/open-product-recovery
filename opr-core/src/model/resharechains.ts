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

import {DecodedReshareChain} from 'opr-models';

/**
 * Compares two reshare chains and returns which is the best chain for accepting
 * an offer. The "best" accept chain is the shortest chain that ends in an
 * accept scope. Undefined reshare chains are most preferable, since they have
 * length 0 and imply the accept scope. This function returns < 0 if the first
 * parameter is better, > 0 if the second parameter is better, and 0 if they are
 * equal.
 */
export function compareReshareChainsForAccept(
  a?: DecodedReshareChain,
  b?: DecodedReshareChain
): number {
  const aIsAccept = endsWithAcceptScope(a);
  const bIsAccept = endsWithAcceptScope(b);
  const aLength = a === undefined ? 0 : a.length;
  const bLength = b === undefined ? 0 : b.length;
  if (aIsAccept && bIsAccept) {
    return aLength - bLength;
  }
  if (aIsAccept) {
    return -1;
  }
  return 1;
}

/**
 * Compares two reshare chains and returns which is the best chain for accepting
 * an offer. The "best" accept chain is the shortest chain that ends in an
 * reshare scope. Length one chains with an explicit reshare scope are the most
 * preferable. This function returns < 0 if the first
 * parameter is better, > 0 if the second parameter is better, and 0 if they are
 * equal.
 */
export function compareReshareChainsForReshare(
  a?: DecodedReshareChain,
  b?: DecodedReshareChain
): number {
  const aIsReshare = endsWithReshareScope(a);
  const bIsReshare = endsWithReshareScope(b);
  if (aIsReshare && bIsReshare) {
    return a!.length - b!.length;
  }
  if (aIsReshare) {
    return -1;
  }
  return 1;
}

/** Returns whether the reshare chain ends with the reshare scope. */
export function endsWithReshareScope(c?: DecodedReshareChain): boolean {
  return c !== undefined && c[c.length - 1].scopes.indexOf('RESHARE') >= 0;
}

/** Returns whether the reshare chain ends with the accept scope. */
export function endsWithAcceptScope(c?: DecodedReshareChain): boolean {
  return c === undefined || c[c.length - 1].scopes.indexOf('ACCEPT') >= 0;
}
