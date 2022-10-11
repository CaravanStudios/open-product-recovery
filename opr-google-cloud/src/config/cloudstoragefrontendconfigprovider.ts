/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {FrontendConfig, FrontendConfigProvider} from 'opr-core';
import {Storage} from '@google-cloud/storage';
import {GcsFileSpec, getGcsJson} from '../util/gcs';

export class CloudStorageFrontendConfigProvider
  implements FrontendConfigProvider
{
  private storage: Storage;
  private fileSpec: GcsFileSpec | string;

  constructor(fileSpec: GcsFileSpec | string, storage = new Storage()) {
    this.storage = storage;
    this.fileSpec = fileSpec;
  }

  getConfig(): Promise<FrontendConfig> {
    return getGcsJson(this.fileSpec, this.storage);
  }
}
