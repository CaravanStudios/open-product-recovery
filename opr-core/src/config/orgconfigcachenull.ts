/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {JSONWebKeySet} from 'jose';
import {OrgConfig} from './orgconfig';
import {OrgConfigCache} from './orgconfigcache';

export class OrgConfigCacheNull implements OrgConfigCache {
  constructor() {}

  async get(orgUrl: string): Promise<OrgConfig | null> {
    return null;
  }

  async put(
    orgUrl: string,
    config?: OrgConfig | undefined
  ): Promise<OrgConfig | null> {
    return null;
  }

  async getJwks(orgUrl: string): Promise<JSONWebKeySet | null> {
    return null;
  }

  async putJwks(
    orgUrl: string,
    jwks?: JSONWebKeySet | undefined
  ): Promise<JSONWebKeySet | null> {
    return null;
  }
}
