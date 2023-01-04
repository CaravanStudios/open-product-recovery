import {HostConfigJson} from './hostconfigjson';

export interface HostConfigJsonProvider {
  getHostConfig(hostId: string): Promise<HostConfigJson>;
  getAllHostIds(): AsyncIterable<string>;
}
