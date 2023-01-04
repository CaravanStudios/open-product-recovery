import {ProviderIntegration} from '../integrations/providerintegration';
import {
  isProviderIntegrationJson,
  ProviderIntegrationJson,
} from '../integrations/providerintegrationjson';
import {JsonMap} from '../util/jsonvalue';
import {StatusError} from '../util/statuserror';

export type ResolvedConfigValue<Type> = {
  [Property in keyof Type]: Type[Property] extends
    | ProviderIntegrationJson<infer ReturnType, infer ConfigType>
    | undefined
    ? ReturnType
    : Type[Property] extends Array<
        ProviderIntegrationJson<infer ReturnType, infer ConfigType>
      >
    ? Array<ReturnType>
    : Type[Property];
};

export interface ResolutionResult<Type> {
  resolvedConfig: ResolvedConfigValue<Type>;
  destroyAll(): Promise<void>;
}

interface ResolvedProviderIntegration<T> {
  value: T;
  destructor?: (obj: T) => Promise<void>;
}

async function resolveProviderIntegrationJson<
  ReturnType,
  ConfigType extends JsonMap,
  ContextType = {}
>(
  val: ProviderIntegrationJson<ReturnType, ConfigType>,
  context?: ContextType
): Promise<ResolvedProviderIntegration<ReturnType>> {
  if (!require.main) {
    throw new StatusError(
      'Dynamic module resolution requires a main module',
      'NO_MAIN_MODULE'
    );
  }
  const moduleParts = val.moduleName.split('#');
  const moduleName = moduleParts[0];
  const integrationName = moduleParts.length > 1 ? moduleParts[1] : 'default';
  const dynamicModule = require.main?.require(moduleName);
  if (!dynamicModule) {
    throw new StatusError(
      'Could not find module ' + moduleName,
      'CANNOT_RESOLVE_MODULE'
    );
  }
  const integrations = dynamicModule.integrations;
  if (!integrations) {
    throw new StatusError(
      'Module ' + moduleName + ' does not publish any integrations',
      'NO_INTEGRATIONS_IN_MODULE'
    );
  }
  const providerIntegration = integrations[
    integrationName
  ] as ProviderIntegration<ReturnType, ContextType>;
  if (!providerIntegration) {
    throw new Error(
      'Could not find ' +
        integrationName +
        ' in module ' +
        moduleName +
        ' from config ' +
        JSON.stringify(val)
    );
  }
  const constructedValue = await providerIntegration.construct(
    val.params ?? {},
    context
  );
  return {
    value: constructedValue,
    destructor: providerIntegration.destroy,
  };
}

export async function resolveConfigJson<T extends JsonMap, C = {}>(
  config: T,
  context?: C,
  valueMapper?: (x: unknown, config: JsonMap) => unknown
): Promise<ResolutionResult<T>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolvedConfig: any = {};
  const destroyers: Array<() => Promise<void>> = [];
  for (const key in config) {
    const val = config[key];
    if (isProviderIntegrationJson(val)) {
      const resolved = await resolveProviderIntegrationJson(val, context);
      const resolvedValue = valueMapper
        ? valueMapper(resolved.value, val)
        : resolved.value;
      resolvedConfig[key] = resolvedValue;
      if (resolved.destructor) {
        destroyers.push(() => resolved.destructor!(resolved.value));
      }
    } else if (Array.isArray(val)) {
      const arr: Array<unknown> = [];
      for (const item of val) {
        if (isProviderIntegrationJson(item)) {
          const resolved = await resolveProviderIntegrationJson(item, context);
          const resolvedValue = valueMapper
            ? valueMapper(resolved.value, item)
            : resolved.value;
          resolvedConfig[key] = resolvedValue;
          arr.push(resolvedValue);
          if (resolved.destructor) {
            destroyers.push(() => resolved.destructor!(resolved.value));
          }
        } else {
          arr.push(item);
        }
      }
      resolvedConfig[key] = arr;
    } else {
      resolvedConfig[key] = val;
    }
  }
  const destroyAll = async () => {
    await Promise.all(destroyers.map(async d => await d()));
  };
  return {
    resolvedConfig: resolvedConfig,
    destroyAll: destroyAll,
  };
}
