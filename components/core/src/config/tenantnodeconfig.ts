/**
 * Copyright 2023 Google LLC
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

import {JwksProvider} from '../auth/jwksprovider';
import {Signer} from '../auth/signer';
import {Verifier} from '../auth/verifier';
import {OrgConfigProvider} from './orgconfigprovider';
import {TenantNodeIntegrationInstaller} from '../integrations/tenantnodeintegrationinstaller';
import {OfferProducer} from '../offerproducer/offerproducer';
import {FeedConfig} from '../policy/feedconfig';
import {OfferListingPolicy} from '../policy/offerlistingpolicy';
import {ServerAccessControlList} from '../policy/serveraccesscontrollist';
import {Logger} from '../util/loglevel';
import {Clock} from '../util/clock';
import {PluggableFactorySet} from '../integrations/pluggablefactoryset';
import {ConfigJson} from './resolveconfigjson';

export interface TenantNodeConfig extends TenantNodeUserConfig {
  hostUrlRoot: string;
  logger?: Logger;
  clock?: Clock;
  // Destroys all objects used by this config.
  destroy(): Promise<void>;
}

// User configurable tenant node options
export interface TenantNodeUserConfig {
  name: string;
  hostOrgUrl?: string;
  orgFilePath?: string;
  enrollmentURL?: string;
  jwksFilePath?: string;
  scopesDisabled?: boolean;
  listProductsPath?: string;
  acceptProductPath?: string;
  rejectProductPath?: string;
  reserveProductPath?: string;
  historyPath?: string;
  orgConfigProvider?: OrgConfigProvider;
  listingPolicy: OfferListingPolicy;
  signer: Signer;
  jwks?: JwksProvider;
  strictCorrectnessChecks?: boolean;
  defaultReservationTimeSecs?: number;
  accessControlList: ServerAccessControlList;
  feedConfigs?: FeedConfig[];
  producers?: Array<OfferProducer>;
  verifier?: Verifier;
  integrations?: Array<TenantNodeIntegrationInstaller>;
}

export type TenantNodeConfigJson<
  Allowed extends PluggableFactorySet = PluggableFactorySet
> = ConfigJson<TenantNodeUserConfig, Allowed>;
