/**
 * Copyright 2022 Google LLC
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
