/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
