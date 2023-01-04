import {ProviderIntegration} from '../integrations/providerintegration';
import {HostConfigJsonProvider} from './hostconfigprovider';
import {HostConfigJson} from './hostconfigjson';
import {StatusError} from '../util/statuserror';
import {iterableToAsync} from '../util/asynciterable';
import {JsonMap} from '../util/jsonvalue';

export interface StaticMultitenantOptionsJson extends JsonMap {
  hosts: Record<string, HostConfigJson>;
}

export class StaticMultitenantIntegration
  implements ProviderIntegration<HostConfigJsonProvider>
{
  async construct(
    json: StaticMultitenantOptionsJson
  ): Promise<HostConfigJsonProvider> {
    console.log('Constructing statichostconfigprovider with config', json);
    return new StaticHostConfigProvider(json);
  }
}

export class StaticHostConfigProvider implements HostConfigJsonProvider {
  private idMap: Record<string, HostConfigJson>;

  constructor(options: StaticMultitenantOptionsJson) {
    this.idMap = options.hosts;
  }

  async getHostConfig(hostId: string): Promise<HostConfigJson> {
    const configJson = this.idMap[hostId];
    if (!configJson) {
      throw new StatusError(
        'No host found for ' + hostId,
        'NO_HOST_FOUND',
        404
      );
    }
    return configJson;
  }

  getAllHostIds(): AsyncIterable<string> {
    return iterableToAsync(Object.getOwnPropertyNames(this.idMap));
  }
}
