/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ReshareChain} from 'opr-models';
import {ChainScope} from './chainscope';

export interface IssueTokenOptions {
  /** Optional subject string for the token. */
  sub?: string;
  /** Optional list of scopes for the token. */
  scopes?: Array<string>;
  /** The maximum age of this token in milliseconds. */
  maxAgeMillis?: number;
}

export interface SignChainOptions {
  initialEntitlement?: string;
  scopes?: Array<ChainScope>;
}

export interface Signer {
  issueToken(aud: string, options?: IssueTokenOptions): Promise<string>;
  signChain(
    chain: Readonly<ReshareChain>,
    sub: string,
    options?: SignChainOptions
  ): Promise<ReshareChain>;
}
