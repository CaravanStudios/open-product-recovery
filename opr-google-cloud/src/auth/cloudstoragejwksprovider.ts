/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Storage} from '@google-cloud/storage';
import {LocalJwksProvider, JWK} from 'opr-core';
import {getGcsJsonFromFile, GcsFileSpec, listDir} from '../util/gcs';

export class CloudStorageJwksProvider extends LocalJwksProvider {
  private fileSpec: GcsFileSpec | string;
  private storage: Storage;

  constructor(fileSpec: GcsFileSpec | string, storage = new Storage()) {
    super(() => this.getPublicKeys());
    this.storage = storage;
    this.fileSpec = fileSpec;
  }

  private async getPublicKeys(): Promise<Array<JWK>> {
    const matchingFiles = await listDir(this.fileSpec, this.storage);
    const keys = await Promise.all(
      matchingFiles.map(async x => {
        return (await getGcsJsonFromFile(x)) as JWK;
      })
    );
    return keys;
  }
}
