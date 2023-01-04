import {JsonMap, ProviderIntegration} from 'opr-core';
import {DataSourceOptions} from 'typeorm';
import {SqlOprPersistentStorage} from './sqloprpersistentstorage';

export const SqlOprPersistentStorageIntegration = {
  async construct(json?: JsonMap): Promise<SqlOprPersistentStorage> {
    const storage = new SqlOprPersistentStorage({
      dsOptions: json as unknown as DataSourceOptions,
    });
    await storage.initialize();
    return storage;
  },
  async destroy(obj: SqlOprPersistentStorage): Promise<void> {
    await obj.shutdown();
  },
} as ProviderIntegration<SqlOprPersistentStorage>;
