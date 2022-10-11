/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {JWK} from 'jose';
import {LocalJwksProvider} from '../local/localjwksprovider';
import fs from 'fs';
import path from 'path';

export class LocalFileJwksProvider extends LocalJwksProvider {
  private path: string;

  constructor(path: string) {
    super(() => this.getPublicKeys());
    this.path = path;
  }

  private async getPublicKeys(): Promise<Array<JWK>> {
    const files = await fs.promises.readdir(this.path);
    // TODO(johndayrichter): Support glob paths instead of just directory
    // names.
    const keys = await Promise.all(
      files.map(async x => {
        const p = path.resolve(this.path, x);
        return JSON.parse((await fs.promises.readFile(p)).toString());
      })
    );
    return keys;
  }
}
