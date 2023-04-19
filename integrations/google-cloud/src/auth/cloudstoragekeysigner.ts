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

import {Storage} from '@google-cloud/storage';
import {LocalKeySigner, JWK} from 'opr-core';
import {getGcsJson, GcsFileSpec} from '../util/gcs';

export class CloudStorageKeySigner extends LocalKeySigner {
  private fileSpec: GcsFileSpec | string;
  private storage: Storage;

  constructor(
    issuer: string,
    fileSpec: GcsFileSpec | string,
    storage = new Storage()
  ) {
    super(issuer, () => this.getPrivateKeyFromGcs());
    this.storage = storage;
    this.fileSpec = fileSpec;
  }

  private async getPrivateKeyFromGcs(): Promise<JWK> {
    return await getGcsJson(this.fileSpec, this.storage);
  }
}
