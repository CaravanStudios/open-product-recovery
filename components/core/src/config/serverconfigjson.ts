import {PersistentStorage} from '../database/persistentstorage';
import {ProviderIntegrationJson} from '../integrations/providerintegrationjson';
import {JsonMap} from '../util/jsonvalue';
import {HostConfigJsonProvider} from './hostconfigprovider';
import {HostIdExtractor} from './hostidextractor';

export interface ServerConfigJson extends JsonMap {
  storage: ProviderIntegrationJson<PersistentStorage>;
  hostSetup: ProviderIntegrationJson<HostConfigJsonProvider>;
  hostMapping: ProviderIntegrationJson<HostIdExtractor>;
  hostName?: string;
}
