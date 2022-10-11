/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
