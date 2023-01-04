import {JsonMap} from '../util/jsonvalue';

export interface ProviderIntegration<T, C = {}> {
  construct(json: JsonMap, context?: C): Promise<T>;
  destroy?(obj: T): Promise<void>;
}
