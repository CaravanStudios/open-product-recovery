/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {DefaultJsonFetcher} from 'opr-core';
import {Headers, RequestInfo, RequestInit} from 'node-fetch';
import {GoogleAuth, IdTokenClient, IdTokenProvider} from 'google-auth-library';

export class AuthenticatedJsonFetcher extends DefaultJsonFetcher {
  private googleAuth = new GoogleAuth();
  private idTokenClient?: IdTokenClient;

  private async getIdTokenProvider(): Promise<IdTokenProvider> {
    if (!this.idTokenClient) {
      // NOTE: We're not going to use this id token client for anything but
      // token generation, so the URL provided here is never used.
      this.idTokenClient = await this.googleAuth.getIdTokenClient(
        'https://www.google.com'
      );
    }
    return this.idTokenClient.idTokenProvider;
  }

  async getIdToken(aud: string): Promise<string> {
    const provider = await this.getIdTokenProvider();
    return await provider.fetchIdToken(aud);
  }

  protected async getHeaders(
    req: RequestInfo,
    reqInit?: RequestInit | undefined
  ): Promise<Headers> {
    const headers = await super.getHeaders(req, reqInit);
    if (!headers.has('Authorization')) {
      const audUrl = new URL('/', this.getUrl(req));
      const token = await this.getIdToken(audUrl.toString());
      headers.set('Authorization', token);
    }
    return headers;
  }
}
