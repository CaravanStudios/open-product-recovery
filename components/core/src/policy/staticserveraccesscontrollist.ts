import {ProviderIntegration} from '../coreapi';
import {ServerAccessControlList} from './serveraccesscontrollist';

export class StaticServerAccessControlList implements ServerAccessControlList {
  private accessControlList: Record<string, boolean>;

  constructor(accessControlList: Array<string>) {
    this.accessControlList = {};
    for (const entry of accessControlList) {
      this.accessControlList[entry] = true;
    }
    console.log('Constructed ACL', this.accessControlList);
  }

  async isAllowed(organizationURL: string): Promise<boolean> {
    return (
      this.accessControlList[organizationURL] === true ||
      this.accessControlList['*'] === true
    );
  }
}

export const StaticServerAccessControlListIntegration = {
  async construct(json, context?) {
    return new StaticServerAccessControlList(json.allow as Array<string>);
  },
} as ProviderIntegration<StaticServerAccessControlList>;
