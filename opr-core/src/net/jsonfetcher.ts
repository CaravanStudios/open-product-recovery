/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {RequestInfo, RequestInit} from 'node-fetch';

export interface JsonFetcher {
  fetch(req: RequestInfo, reqInit?: RequestInit): Promise<unknown>;
}
