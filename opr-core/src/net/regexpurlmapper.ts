/**
 * Copyright 2022 Google LLC
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

import {UrlMapper} from './urlmapper';

export interface Mapping {
  input: RegExp | string;
  replacement: string;
}

export type MappingConfig =
  | Array<string>
  | Array<Mapping>
  | Record<string, string>;

export class RegexpUrlMapper implements UrlMapper {
  private mappings: Array<Mapping>;

  constructor(mappings?: Array<Mapping>) {
    this.mappings = mappings || [];
  }

  map(url: string): string {
    for (const mapping of this.mappings) {
      if (url.match(mapping.input)) {
        return url.replace(mapping.input, mapping.replacement);
      }
    }
    return url;
  }

  addMapping(...mappings: Array<Mapping>) {
    this.mappings.push(...mappings);
  }

  addMappingFromConfig(config: MappingConfig) {
    this.addMapping(...RegexpUrlMapper.mappingsFromConfig(config));
  }

  private static getMappingFromStr(configItem: string): Mapping {
    const firstColons = configItem.indexOf('::');
    const input = configItem.substring(0, firstColons);
    const replacement = configItem.substring(firstColons + 1);
    return {
      input,
      replacement,
    };
  }

  static mappingsFromConfig(config: MappingConfig): Array<Mapping> {
    const result = new Array<Mapping>();
    if (Array.isArray(config)) {
      for (const configItem of config) {
        const mapping =
          typeof configItem === 'string'
            ? RegexpUrlMapper.getMappingFromStr(configItem)
            : configItem;
        result.push(mapping);
      }
    } else {
      for (const key of Object.getOwnPropertyNames(config)) {
        const value = config[key];
        if (typeof value === 'string') {
          result.push({input: new RegExp(key), replacement: value});
        }
      }
    }
    return result;
  }
}
