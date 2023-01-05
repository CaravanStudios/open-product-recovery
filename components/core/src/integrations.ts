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

import {LocalJwksIntegration} from './auth/local/localjwksprovider';
import {LocalKeySignerIntegration} from './auth/local/localkeysigner';
import {StaticMultitenantIntegration} from './config/statichostconfigprovider';
import {TemplateHostIdExtractorIntegration} from './config/templatehostidextractor';
import {StaticServerAccessControlListIntegration} from './coreapi';
import {ProviderIntegration} from './integrations/providerintegration';
import {StaticFeedConfigProviderIntegration} from './policy/staticfeedconfigprovider';
import {UniversalAcceptListingPolicyIntegration} from './policy/universalacceptlistingpolicy';

export const integrations: Record<
  string,
  ProviderIntegration<unknown, unknown>
> = {
  StaticMultitenant: new StaticMultitenantIntegration(),
  UniversalListingPolicy: UniversalAcceptListingPolicyIntegration,
  StaticFeeds: StaticFeedConfigProviderIntegration,
  LocalKeySigner: LocalKeySignerIntegration,
  LocalJwks: LocalJwksIntegration,
  StaticAccessControlList: StaticServerAccessControlListIntegration,
  TemplateHostIds: TemplateHostIdExtractorIntegration,
};
