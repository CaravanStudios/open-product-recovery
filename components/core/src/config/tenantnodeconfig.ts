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

import {OrgConfigProvider} from './orgconfigprovider';
import {Logger} from '../util/loglevel';
import {Clock} from '../util/clock';
import {PluggableFactorySet} from '../integrations/pluggablefactoryset';
import {ConfigJson, PluggableConfig} from './resolveconfigjson';

export interface TenantNodeConfig extends TenantNodeUserConfig {
  orgConfigProvider?: OrgConfigProvider;
  hostUrlRoot: string;
  logger?: Logger;
  clock?: Clock;
  // Destroys all objects used by this config.
  destroy(): Promise<void>;
}

export type TenantNodeUserConfig = PluggableConfig<
  typeof TenantNodeUserConfigDesc
>;

export const TenantNodeUserConfigDesc = {
  name: 'string',
  hostOrgUrl: {
    type: 'string',
    isOptional: true,
  },
  orgFilePath: {
    type: 'string',
    isOptional: true,
  },
  enrollmentURL: {
    type: 'string',
    isOptional: true,
  },
  jwksFilePath: {
    type: 'string',
    isOptional: true,
  },
  scopesDisabled: {
    type: 'boolean',
    isOptional: true,
  },
  listProductsPath: {
    type: 'string',
    isOptional: true,
  },
  acceptProductPath: {
    type: 'string',
    isOptional: true,
  },
  rejectProductPath: {
    type: 'string',
    isOptional: true,
  },
  reserveProductPath: {
    type: 'string',
    isOptional: true,
  },
  historyPath: {
    type: 'string',
    isOptional: true,
  },
  listingPolicy: 'listingPolicy',
  signer: 'signer',
  jwks: {
    type: 'jwksProvider',
    isOptional: true,
  },
  strictCorrectnessChecks: {
    type: 'boolean',
    isOptional: true,
  },
  defaultReservationTimeSecs: {
    type: 'number',
    isOptional: true,
  },
  accessControlList: 'accessControlList',
  feedConfigs: {
    type: 'json',
    isOptional: true,
    isArray: true,
  },
  producers: {
    type: 'offerProducer',
    isOptional: true,
    isArray: true,
  },
  verifier: {
    type: 'verifier',
    isOptional: true,
  },
  integrations: {
    type: 'integrationInstaller',
    isOptional: true,
    isArray: true,
  },
} as const;

export type TenantNodeConfigJson<
  Allowed extends PluggableFactorySet = PluggableFactorySet
> = ConfigJson<TenantNodeUserConfig, Allowed>;
