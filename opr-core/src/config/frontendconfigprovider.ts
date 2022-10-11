/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {FrontendConfig} from './frontendconfig';

export interface FrontendConfigProvider {
  getConfig(): Promise<FrontendConfig>;
}
