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
