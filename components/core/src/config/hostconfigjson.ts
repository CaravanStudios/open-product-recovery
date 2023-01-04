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
