/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Pluggable} from '../integrations/pluggable';
import {PluggableFactory} from '../integrations/pluggablefactory';
import {PluggableFactorySet} from '../integrations/pluggablefactoryset';
import {
  isPluggableFactoryJsonStanza,
  PluggableFactoryJsonMapStanza,
  PluggableFactoryJsonStanza,
} from '../integrations/pluggablefactoryjson';
import {Simplify, ValueOf} from 'type-fest';
import {integrations} from '../integrations';
import {StaticMultitenantOptionsJson} from './statictenantnodeconfigprovider';
import {Signer} from '../auth/signer';
import {TenantNodeConfigJson} from './tenantnodeconfig';
import {OfferListingPolicy} from '../coreapi';

type S = AllowedFactoriesOfType<typeof integrations, OfferListingPolicy>;
type R = AllowedFactoryJsonsOfType<typeof integrations, Signer>;
const nodeConfig: TenantNodeConfigJson<typeof integrations> = {
  // jwks: {
  //   moduleName: 'LocalJwks',
  //   params: {
  //     publicKeys: [],
  //   },
  // },
  name: 'Example',
  listingPolicy: {
    moduleName: 'UniversalListingPolicy',
    params: {
      orgUrls: [],
    },
  },
  accessControlList: {
    moduleName: 'StaticAccessControlList',
    params: {
      allow: [],
    },
  },
  signer: {
    moduleName: 'LocalKeySigner',
    params: {
      privateKey: {},
    },
  },
};

type LegalFactories = AllowedFactoryNamed<
  typeof integrations,
  'StaticMultitenant'
>;
type LegalStanza = Simplify<
  LegalJsonMapStanza<typeof integrations, 'StaticMultitenant'>
>;

const x: LegalStanza = {
  moduleName: 'StaticMultitenant',
  params: {
    hosts: {},
  },
};

// export type AllowedFactoriesOfType<
//   Allowed extends PluggableFactorySet,
//   T extends Pluggable
// > = {
//   [key in StringKeyOf<Allowed>]: Allowed[key] extends PluggableFactory<
//     infer P,
//     unknown,
//     unknown
//   >
//     ? P extends T
//       ? Allowed[key]
//       : never
//     : never;
// };
export type AllowedFactoriesOfType<
  Allowed extends PluggableFactorySet,
  T extends Pluggable
> = {
  [key in StringKeyOf<Allowed> as key extends string
    ? Allowed[key] extends PluggableFactory<T, unknown, unknown>
      ? key
      : never
    : never]: Allowed[key];
};

export type AllowedFactoryJsonsOfType<
  Allowed extends PluggableFactorySet,
  T extends Pluggable
> = {
  [key in keyof AllowedFactoriesOfType<Allowed, T>]: AllowedFactoriesOfType<
    Allowed,
    T
  >[key] extends PluggableFactory<Pluggable, infer C, unknown>
    ? PluggableFactoryJsonStanza<key, C>
    : never;
};

export type FactoryConfig<
  Allowed extends PluggableFactorySet,
  FactoryName extends StringKeyOf<Allowed>
> = AllowedFactoryNamed<Allowed, FactoryName> extends PluggableFactory<
  Pluggable,
  infer C,
  unknown
>
  ? C
  : never;

export type FactoryResult<T> = T extends PluggableFactory<
  infer P,
  unknown,
  unknown
>
  ? P
  : never;

export type StringKeyOf<T> = Extract<keyof T, string>;

export type AllowedFactoryNamed<
  Allowed extends PluggableFactorySet,
  ModuleName extends StringKeyOf<Allowed>
> = ValueOf<Pick<Allowed, ModuleName>>;

export interface ResolvedPluggableResult<
  Allowed extends PluggableFactorySet,
  ModuleName extends StringKeyOf<Allowed> = StringKeyOf<Allowed>
> {
  result: FactoryResult<Allowed[ModuleName]>;
  configJson: PluggableFactoryJsonStanza<
    ModuleName,
    FactoryConfig<Allowed, ModuleName>
  >;
  factory: Allowed[ModuleName];
}

export type LegalJsonStanza<
  Allowed extends PluggableFactorySet,
  ModuleName extends StringKeyOf<Allowed> = StringKeyOf<Allowed>
> = PluggableFactoryJsonStanza<ModuleName, FactoryConfig<Allowed, ModuleName>>;

export type LegalJsonMapStanza<
  Allowed extends PluggableFactorySet,
  ModuleName extends StringKeyOf<Allowed> = StringKeyOf<Allowed>
> = PluggableFactoryJsonMapStanza<
  ModuleName,
  FactoryConfig<Allowed, ModuleName>
>;

export function extractModuleName<ModuleName extends string>(
  configJson: PluggableFactoryJsonStanza<ModuleName, unknown>
): ModuleName {
  if (typeof configJson === 'string') {
    return configJson;
  } else if (Array.isArray(configJson)) {
    return configJson[0];
  } else {
    const valAsMap = configJson as PluggableFactoryJsonMapStanza<
      ModuleName,
      unknown
    >;
    return valAsMap.moduleName;
  }
}

export function extractParams<
  ModuleName extends StringKeyOf<Allowed>,
  Allowed extends PluggableFactorySet
>(
  configJson: PluggableFactoryJsonStanza<
    ModuleName,
    FactoryConfig<Allowed, ModuleName>
  >
): FactoryConfig<Allowed, ModuleName> {
  if (typeof configJson === 'string') {
    return undefined as FactoryConfig<Allowed, ModuleName>;
  } else if (Array.isArray(configJson)) {
    return configJson[1];
  } else {
    const valAsMap = configJson as PluggableFactoryJsonMapStanza<
      ModuleName,
      FactoryConfig<Allowed, ModuleName>
    >;
    return valAsMap.params;
  }
}

export async function constructPluggableFromConfig<
  Allowed extends PluggableFactorySet,
  ModuleName extends StringKeyOf<Allowed> = StringKeyOf<Allowed>,
  ContextType = undefined
>(
  configJson: LegalJsonStanza<Allowed>,
  allowed: Allowed,
  context: ContextType
): Promise<ResolvedPluggableResult<Allowed, ModuleName>> {
  const moduleName = extractModuleName(configJson);
  const params = extractParams(configJson);
  const factory = allowed[moduleName];
  const val = await factory.construct(params, context, allowed);
  val.moduleNameSource = moduleName;
  return {
    result: val as FactoryResult<Allowed[ModuleName]>,
    configJson: configJson as PluggableFactoryJsonStanza<
      ModuleName,
      FactoryConfig<Allowed, ModuleName>
    >,
    factory: factory as Allowed[ModuleName],
  };
}

type PluggablesInCollection<T> = T extends Pluggable
  ? T
  : T extends Array<infer P extends Pluggable>
  ? P
  : never;

export type ConfigJson<T, Allowed extends PluggableFactorySet> = {
  [key in keyof T]: T[key] extends Pluggable | Pluggable[] | undefined
    ? ValueOf<
        AllowedFactoryJsonsOfType<Allowed, PluggablesInCollection<T[key]>>
      >
    : T[key];
};

export interface ResolutionResult<T> {
  result: T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allPluggables: Array<ResolvedPluggableResult<any, any>>;
  destroyAll(): Promise<void>;
}

/**
 * Resolves a JSON configuration with pluggable configuration stanzas into an
 * object where all the pluggable config stanzas are resolved into constructed
 * Pluggable objects.
 */
export async function resolveConfigJson<
  ResultType,
  Allowed extends PluggableFactorySet,
  X = undefined
>(
  config: ConfigJson<ResultType, Allowed>,
  allowed: Allowed,
  context?: X
): Promise<ResolutionResult<ResultType>> {
  const resultObj: Record<string, unknown> = {};
  const allPluggables: Array<ResolvedPluggableResult<Allowed>> = [];
  for (const key in config) {
    const configVal = config[key];
    let resultVal;
    if (isPluggableFactoryJsonStanza(configVal, allowed)) {
      resultVal = await constructPluggableFromConfig(
        configVal as LegalJsonStanza<Allowed>,
        allowed,
        context
      );
      allPluggables.push(resultVal);
      resultObj[key] = resultVal.result;
    } else if (Array.isArray(configVal)) {
      const newArray = [];
      for (const subVal of configVal) {
        if (isPluggableFactoryJsonStanza(configVal, allowed)) {
          const subResultVal = await constructPluggableFromConfig(
            configVal as LegalJsonStanza<Allowed>,
            allowed,
            context
          );
          allPluggables.push(subResultVal);
          newArray.push(subResultVal.result);
        } else {
          newArray.push(subVal);
        }
      }
      resultObj[key] = resultVal;
    } else {
      resultObj[key] = configVal;
    }
  }
  return {
    result: resultObj as ResultType,
    allPluggables: allPluggables,
    async destroyAll(): Promise<void> {
      await Promise.all(
        allPluggables.map(p => p.result.destroy && p.result.destroy())
      );
    },
  };
}
