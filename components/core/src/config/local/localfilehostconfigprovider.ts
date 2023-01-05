/**
 * Copyright 2023 Google LLC
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

import {ProviderIntegration} from '../../integrations/providerintegration';
import {HostConfigJsonProvider} from '../hostconfigprovider';
import {HostConfigJson} from '../hostconfigjson';
import {StatusError} from '../../util/statuserror';
import {JsonMap} from '../../util/jsonvalue';
import path from 'path';
import fs from 'fs/promises';

export interface LocalFileMultitenantOptionsJson extends JsonMap {
  // Path to the base directory of configuration files.
  basePath: string;
}

export class LocalFileMultitenantIntegration
  implements ProviderIntegration<HostConfigJsonProvider>
{
  async construct(
    json: LocalFileMultitenantOptionsJson
  ): Promise<HostConfigJsonProvider> {
    return new LocalFileHostConfigProvider(json);
  }
}

export class LocalFileHostConfigProvider implements HostConfigJsonProvider {
  private basePath: string;

  constructor(options: LocalFileMultitenantOptionsJson) {
    this.basePath = options.basePath;
  }

  async getHostConfig(hostId: string): Promise<HostConfigJson> {
    const configFilePath = path.resolve(
      './' + hostId + '/config.json',
      this.basePath
    );
    try {
      return JSON.parse((await fs.readFile(configFilePath)).toString());
    } catch (e) {
      throw new StatusError(
        'No host found for ' + hostId,
        'NO_HOST_FOUND',
        404,
        e
      );
    }
  }

  async *getAllHostIds(): AsyncIterable<string> {
    const filePaths = await fs.readdir(this.basePath);
    for (const fileName of filePaths) {
      const stat = await fs.stat(path.resolve(fileName, this.basePath));
      if (stat.isDirectory()) {
        yield fileName;
      }
    }
  }
}
