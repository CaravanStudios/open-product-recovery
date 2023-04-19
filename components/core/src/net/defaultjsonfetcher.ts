/**
 * Copyright 2023 The Open Product Recovery Authors
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

import fetch, {RequestInfo, RequestInit, Headers} from 'node-fetch';
import {NetworkFetchError} from './networkfetcherror';
import {JsonFetcher} from './jsonfetcher';
import {StatusError} from '../util/statuserror';

export class DefaultJsonFetcher implements JsonFetcher {
  getUrl(req: RequestInfo): string {
    if (typeof req === 'string') {
      return req;
    }
    if (typeof req === 'object') {
      if ('href' in req) {
        return req.href;
      }
      return req.url;
    }
    throw new Error('Unreachable');
  }

  protected async getHeaders(
    req: RequestInfo,
    reqInit?: RequestInit
  ): Promise<Headers> {
    const headers = new Headers(reqInit?.headers);
    if (reqInit?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
      headers.set('User-Agent', 'OpenProductRecovery'); //todo: add version?
    }
    return headers;
  }

  async fetch(req: RequestInfo, reqInit?: RequestInit): Promise<unknown> {
    let response;
    let responseText;
    try {
      const fetchReqInit = {...reqInit};
      const headers = await this.getHeaders(req, reqInit);
      fetchReqInit.headers = headers;
      response = await fetch(req, fetchReqInit);
      responseText = await response.text();
    } catch (e) {
      throw new NetworkFetchError(this.getUrl(req), e);
    }
    if (!response.ok) {
      let causeError;
      try {
        const jsonResponse = JSON.parse(responseText);
        if ('code' in jsonResponse && 'message' in jsonResponse) {
          causeError = new StatusError(
            jsonResponse['message'],
            jsonResponse['code'],
            response.status
          );
        }
      } catch (e) {
        // Ignore this error and throw below.
      }
      throw new NetworkFetchError(this.getUrl(req), causeError, responseText);
    }
    try {
      const json = JSON.parse(responseText);
      return json;
    } catch (e) {
      throw new StatusError(
        'Unable to parse JSON response: ' + responseText,
        'NETWORK_FETCH_ERROR_NO_JSON',
        500,
        e
      );
    }
  }
}
