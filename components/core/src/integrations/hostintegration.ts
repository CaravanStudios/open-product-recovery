import {JsonMap} from '../coreapi';
import {IntegrationApi} from './integrationapi';

export type HostItegrationTeardownFn = (
  integrationApi: IntegrationApi
) => Promise<void>;

export type HostIntegrationInstallFn = (
  integrationApi: IntegrationApi
) => Promise<void | HostItegrationTeardownFn>;

export interface AnnotatedHostIntegrationInstaller {
  moduleName: string;
  params: JsonMap;
  install: HostIntegrationInstallFn;
}
