/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {createLocalJWKSet, JSONWebKeySet} from 'jose';
import {OrgConfig} from './orgconfig';
import {OrgConfigCache} from './orgconfigcache';
import {StatusError} from '../util/statuserror';
import {UrlMapper} from '../net/urlmapper';
import {NullUrlMapper} from '../net/nullurlmapper';
import {JsonFetcher} from '../net/jsonfetcher';
import {DefaultJsonFetcher} from '../net/defaultjsonfetcher';
import {OrgConfigCacheNull} from './orgconfigcachenull';

export interface OrgConfigProviderOptions {
  orgConfigCache?: OrgConfigCache;
  urlMapper?: UrlMapper;
  jsonFetcher?: JsonFetcher;
}

export class OrgConfigProvider {
  private orgConfigCache: OrgConfigCache;
  private urlMapper: UrlMapper;
  private jsonFetcher: JsonFetcher;

  /**
   * @param orgConfigCache The org cache to check for standard requests.
   * @param urlMapper A url mapper that remaps urls for fetches. For dev use
   *     only.
   */
  constructor(options: OrgConfigProviderOptions = {}) {
    this.orgConfigCache = options.orgConfigCache || new OrgConfigCacheNull();
    this.urlMapper = options.urlMapper || new NullUrlMapper();
    this.jsonFetcher = options.jsonFetcher || new DefaultJsonFetcher();
  }

  async get(orgUrl: string, noCache = false): Promise<OrgConfig> {
    if (!noCache) {
      const cacheConfig = await this.orgConfigCache.get(orgUrl);
      if (cacheConfig) {
        return cacheConfig;
      }
    }
    // TODO(johndayrichter): Check the returned json with json schema before
    // assuming it's the right type.
    const fetchUrl = this.urlMapper.map(orgUrl);
    const orgConfig = (await this.jsonFetcher.fetch(fetchUrl)) as OrgConfig;
    this.orgConfigCache.put(orgUrl, orgConfig);
    return orgConfig;
  }

  async getJwks(orgUrl: string, noCache = false): Promise<JSONWebKeySet> {
    if (!noCache) {
      const cacheJwks = await this.orgConfigCache.getJwks(orgUrl);
      if (cacheJwks) {
        return cacheJwks;
      }
    }
    const orgConfig = await this.get(orgUrl, noCache);
    const jwksUrl = orgConfig.jwksURL;
    if (!jwksUrl) {
      throw new StatusError(
        'No JWKS url specified for ' + orgUrl,
        'NO_KEYSET_SPECIFIED',
        500
      );
    }
    const fetchUrl = this.urlMapper.map(jwksUrl);
    const jwks = (await this.jsonFetcher.fetch(fetchUrl)) as JSONWebKeySet;
    // Create, but don't use, a local jwkset to verify that the json is right.
    createLocalJWKSet(jwks);
    this.orgConfigCache.putJwks(orgUrl, jwks);
    return jwks;
  }
}
