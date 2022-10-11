/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {FeedConfig, FeedConfigProvider} from 'opr-core';
import {Storage} from '@google-cloud/storage';
import {GcsFileSpec, getGcsJson} from '../util/gcs';

export class CloudStorageFeedConfigProvider implements FeedConfigProvider {
  private storage: Storage;
  private fileSpec: GcsFileSpec | string;

  constructor(fileSpec: GcsFileSpec | string, storage = new Storage()) {
    this.storage = storage;
    this.fileSpec = fileSpec;
  }

  async getFeeds(): Promise<Array<FeedConfig>> {
    return getGcsJson(this.fileSpec, this.storage);
  }
}
