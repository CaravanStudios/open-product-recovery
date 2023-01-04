import {Logger} from 'loglevel';
import {Clock} from '../util/clock';
import {ResolvedConfigValue} from '../config/resolveconfigjson';
import {HostConfigJson} from '../config/hostconfigjson';

export type HostConfig = ResolvedConfigValue<HostConfigJson> & {
  logger?: Logger;
  clock?: Clock;
  // Destroys all objects used by this config.
  destroy(): Promise<void>;
};
