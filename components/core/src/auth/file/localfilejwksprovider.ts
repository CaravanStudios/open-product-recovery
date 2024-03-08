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
