/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {JSONWebKeySet} from 'jose';
import {OrgConfig} from './orgconfig';

export interface OrgConfigCache {
  get(orgUrl: string): Promise<OrgConfig | null>;
  put(orgUrl: string, config?: OrgConfig): Promise<OrgConfig | null>;
  getJwks(orgUrl: string): Promise<JSONWebKeySet | null>;
  putJwks(orgUrl: string, jwks?: JSONWebKeySet): Promise<JSONWebKeySet | null>;
}
