/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {FrontendConfig} from '../../config/frontendconfig';
import type {FrontendConfigProvider} from '../../config/frontendconfigprovider';
import fs from 'fs';

export class LocalFileFrontendConfigProvider implements FrontendConfigProvider {
  private path: string;

  constructor(path: string) {
    this.path = path;
  }

  async getConfig(): Promise<FrontendConfig> {
    return JSON.parse((await fs.promises.readFile(this.path)).toString());
  }
}
