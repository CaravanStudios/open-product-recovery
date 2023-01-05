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
import {AnnotatedHostIntegrationInstaller} from '../integrations/hostintegration';
import {OfferProducer} from '../offerproducer/offerproducer';
import {FeedConfig} from '../policy/feedconfig';
import {OfferListingPolicy} from '../policy/offerlistingpolicy';
import {ServerAccessControlList} from '../policy/serveraccesscontrollist';
import {ProviderIntegrationJson} from '../integrations/providerintegrationjson';
import {JsonMap} from '../util/jsonvalue';

export interface HostConfigJson extends JsonMap {
  name: string;
  hostOrgUrl?: string;
  hostUrlRoot: string;
  orgFilePath?: string;
  enrollmentURL?: string;
  jwksFilePath?: string;
  scopesDisabled?: boolean;
  listProductsPath?: string;
  acceptProductPath?: string;
  rejectProductPath?: string;
  reserveProductPath?: string;
  historyPath?: string;
  orgConfigProvider?: ProviderIntegrationJson<OrgConfigProvider>;
  listingPolicy: ProviderIntegrationJson<OfferListingPolicy>;
  signer: ProviderIntegrationJson<Signer>;
  jwks?: ProviderIntegrationJson<JwksProvider>;
  strictCorrectnessChecks?: boolean;
  defaultReservationTimeSecs?: number;
  accessControlList: ProviderIntegrationJson<ServerAccessControlList>;
  feedConfigs?: ProviderIntegrationJson<FeedConfig[]>;
  producers?: ProviderIntegrationJson<Array<OfferProducer>>;
  verifier?: ProviderIntegrationJson<Verifier>;
  integrations?: ProviderIntegrationJson<
    Array<AnnotatedHostIntegrationInstaller>
  >;
}
