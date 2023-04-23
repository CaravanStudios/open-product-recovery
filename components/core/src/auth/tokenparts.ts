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

import {StatusError} from '../util/statuserror';

/**
 * Returns the signature from an encoded JWT. If the signature is missing,
 * throw a status error.
 */
export function extractSignature(token: string): string {
  return extractAll(token)[2];
}

/** Returns the encoded payload of a JWT. */
export function extractPayload(token: string): string {
  return extractAll(token)[1];
}

/** Returns the encoded header of a JWT. */
export function extractHeader(token: string): string {
  return extractAll(token)[0];
}

/**
 * Returns the encoded segments of a signed JWT as an array. If the token has
 * fewer than 3 segments (meaning it's unsigned or invalid), an exception is
 * thrown.
 */
export function extractAll(token: string): Array<string> {
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    throw new StatusError(
      'Bad signed token ' + token + '; should have 3 dot-separated components',
      'SIGNED_TOKEN_INVALID',
      403
    );
  }
  return tokenParts;
}
