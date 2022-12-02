/**
 * Copyright 2022 Google LLC
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
