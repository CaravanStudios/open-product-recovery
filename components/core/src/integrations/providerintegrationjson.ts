import {JsonMap} from '../coreapi';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ProviderIntegrationJson<T, JsonFormat extends JsonMap = {}>
  extends JsonMap {
  readonly moduleName: string;
  readonly params?: JsonFormat;
}

export function isProviderIntegrationJson<T, JsonFormat extends JsonMap>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  x: any
): x is ProviderIntegrationJson<T, JsonFormat> {
  return (
    typeof x.moduleName === 'string' &&
    (x.config === undefined || typeof x.config === 'object') &&
    (x.exportName === undefined || typeof x.exportName === 'string')
  );
}
