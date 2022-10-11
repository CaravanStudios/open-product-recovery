/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {RequestInfo} from 'node-fetch';
import {DefaultJsonFetcher} from './defaultjsonfetcher';

export class FakeJsonFetcher extends DefaultJsonFetcher {
  private responseMap = {} as Record<string, unknown>;

  map(url: string, json: unknown) {
    this.responseMap[url] = json;
  }

  async fetch(req: RequestInfo): Promise<unknown> {
    const url = this.getUrl(req);
    const json = this.responseMap[url];
    if (!json) {
      throw new Error('No response mapped for url ' + url);
    }
    return json;
  }
}
