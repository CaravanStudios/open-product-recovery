import {JsonMap, ProviderIntegration, StatusError} from 'opr-core';
import {CloudStorageHostConfigProvider} from './cloudstoragehostconfigprovider';

export const CloudStorageHostConfigProviderIntegration = {
  async construct(json?: JsonMap): Promise<CloudStorageHostConfigProvider> {
    if (!json || !json.bucket) {
      throw new StatusError(
        'CloudStorageHostConfig error: a bucket must be specified',
        'CLOUD_STORAGE_HOST_PROVIDER_NO_BUCKET'
      );
    }
    return new CloudStorageHostConfigProvider({
      bucket: json.bucket as string,
    });
  },
} as ProviderIntegration<CloudStorageHostConfigProvider>;
