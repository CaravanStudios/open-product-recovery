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

import {
  HostConfigJson,
  HostConfigJsonProvider,
  JsonMap,
  ProviderIntegration,
  StatusError,
} from 'opr-core';
import {getGcsJson, listDir} from '../util/gcs';

export interface CloudStorageHostConfigOptionsJson extends JsonMap {
  bucket: string;
}

export class StaticMultitenantIntegration
  implements ProviderIntegration<HostConfigJsonProvider>
{
  async construct(
    json: CloudStorageHostConfigOptionsJson
  ): Promise<HostConfigJsonProvider> {
    console.log('Constructing statichostconfigprovider with config', json);
    return new CloudStorageHostConfigProvider(json);
  }
}

export class CloudStorageHostConfigProvider implements HostConfigJsonProvider {
  private bucket: string;

  constructor(options: CloudStorageHostConfigOptionsJson) {
    this.bucket = options.bucket;
  }

  async getHostConfig(hostId: string): Promise<HostConfigJson> {
    try {
      return await getGcsJson({
        bucket: this.bucket,
        path: `hosts/${hostId}/config.json`,
      });
    } catch (e) {
      throw new StatusError(
        'No host found with id ' + hostId,
        'NO_HOST_FOUND',
        404,
        e
      );
    }
  }

  async *getAllHostIds(): AsyncIterable<string> {
    const files = await listDir({bucket: this.bucket, path: 'hosts'});
    for (const file of files) {
      const segments = file.cloudStorageURI.toString().split('/');
      const id = segments[segments.length - 1];
      yield id;
    }
  }
}
