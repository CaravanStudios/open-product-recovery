/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
