/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {JSONWebKeySet} from 'jose';
import {OrgConfig} from './orgconfig';
import {OrgConfigCache} from './orgconfigcache';

export class OrgConfigCacheLocalMem implements OrgConfigCache {
  private orgConfigMap: Map<string, OrgConfig>;
  private jwksConfigMap: Map<string, JSONWebKeySet>;

  constructor() {
    this.orgConfigMap = new Map();
    this.jwksConfigMap = new Map();
  }

  async get(orgUrl: string): Promise<OrgConfig | null> {
    return this.orgConfigMap.get(orgUrl) || null;
  }

  async put(
    orgUrl: string,
    config?: OrgConfig | undefined
  ): Promise<OrgConfig | null> {
    const oldValue = this.orgConfigMap.get(orgUrl) || null;
    if (config) {
      this.orgConfigMap.set(orgUrl, config);
    } else {
      this.orgConfigMap.delete(orgUrl);
    }
    return oldValue;
  }

  async getJwks(orgUrl: string): Promise<JSONWebKeySet | null> {
    return this.jwksConfigMap.get(orgUrl) || null;
  }

  async putJwks(
    orgUrl: string,
    jwks?: JSONWebKeySet | undefined
  ): Promise<JSONWebKeySet | null> {
    const oldValue = this.jwksConfigMap.get(orgUrl) || null;
    if (jwks) {
      this.jwksConfigMap.set(orgUrl, jwks);
    } else {
      this.jwksConfigMap.delete(orgUrl);
    }
    return oldValue;
  }
}
