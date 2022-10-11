/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GcsJwkProviderConfig {
  type: 'GCS';
  path: string;
}

export interface LocalJwksProviderConfig {
  type: 'FILE';
  path: string;
}

export type JwksProviderConfig = GcsJwkProviderConfig | LocalJwksProviderConfig;

export interface GcsBackendFetcherConfig {
  type: 'GCS';
}

export interface NoAuthFetcherConfig {
  type: 'NOAUTH';
}

export type BackendFetcherConfig =
  | GcsBackendFetcherConfig
  | NoAuthFetcherConfig;

export interface LocalMemOrgConfigCacheOptions {
  type: 'LOCALMEM';
}

export type OrgConfigCacheOptions = LocalMemOrgConfigCacheOptions;

export interface RegexpAccessControlListEntry {
  regexp: string;
  isLiteral?: boolean;
}

export type AccessControlListEntry = string | RegexpAccessControlListEntry;

export interface FrontendConfig {
  name: string;
  organizationURL: string;
  orgFilePath?: string;
  enrollmentURL?: string;
  jwksURL: string;
  scopesDisabled?: boolean;
  listProductsPath?: string;
  acceptProductPath?: string;
  rejectProductPath?: string;
  reserveProductPath?: string;
  historyPath?: string;
  accessControlList?: Array<AccessControlListEntry>;
}
