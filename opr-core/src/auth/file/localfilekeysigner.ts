/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {LocalKeySigner} from '../local/localkeysigner';
import {JWK} from 'jose';
import fs from 'fs';

export class LocalFileKeySigner extends LocalKeySigner {
  constructor(issuer: string, path: string) {
    super(issuer, () => LocalFileKeySigner.getJwkJson(path));
  }

  static async getJwkJson(path: string): Promise<JWK> {
    return JSON.parse((await fs.promises.readFile(path)).toString()) as JWK;
  }
}
