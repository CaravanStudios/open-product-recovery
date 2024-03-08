/**
 * Copyright 2023 The Open Product Recovery Authors
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

import * as path from 'path';
import * as diff from 'fast-json-patch';
import {Operation} from 'fast-json-patch';
import {JsonValue, parsePathSync, SourcedJsonValue} from './sourcedjson';

/** Options for constructing a resolver. */
export interface ResolverOptions {
  /** A list of custom directives to install after the default directives. */
  installDirectives?: Array<Directive>;
}

/**
 * A class that resolves a sourced JSON file as a template. Templates are
 * plain JSON where the presence of some object keys (usually beginning with a
 * $ character) indicate that a node should be transformed using a directive.
 *
 * 4 directives are supported by default:
 *
 * $import : <path:string>
 *   Replaces the current node with the contents of the file at the given path.
 *   Relative paths are resolved relative to the location of the source file
 *   of the parent node.
 * $replace : <value:any>
 *   Replaces the current node with the value of the $replace key. This is
 *   useful for transforming arrays and primitives, because directives must be
 *   keys of normal JSON objects.
 * $patch : <patch:JSONPatch>
 *   Patches the current object with value of the $patch key as a JSON patch.
 * $apply : <directiveList:DirectivePair>
 *   Applies a list of directives, specified as objects with keys named "name"
 *   and "value". For example, { "name" : "$import", "value" : "./myfile.json"}.
 *   The $apply directive is useful in cases where the same directive needs to
 *   be applied to an object more than once.
 *
 * Directives are applied in the order the directive keys appear in the object.
 * Note that in JSON, if the same key is specified more than once the last value
 * of the key will be used. This means that if the same directive is specified
 * more than once in an object, only the last appearance of the directive will
 * be processed. The $apply directive allows directives to be specified in a way
 * that is not subject to this constraint.
 */
export class Resolver {
  private directives: Array<Directive>;

  constructor(options?: ResolverOptions) {
    this.directives = [
      ...(options?.installDirectives || []),
      new ApplyDirective(),
      new PatchDirective(),
      new ImportDirective(),
      new ReplaceDirective(),
    ];
  }

  /** Returns whether the given key is accepted by a directive. */
  isDirectiveKey(key: string): boolean {
    for (const directive of this.directives) {
      if (directive.accept(key)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Resolves the given SourcedJsonValue as a template. The original template
   * value is not modified.
   */
  async resolve(source: SourcedJsonValue): Promise<SourcedJsonValue> {
    source = source.deepClone();
    return await this.processDirectives(source);
  }

  private async processDirectives(
    node: SourcedJsonValue
  ): Promise<SourcedJsonValue> {
    if (node.isArray()) {
      for (let i = 0; i < node.getLength(); i++) {
        node.setSourced(i, await this.processDirectives(node.getSourced(i)!));
      }
      return node;
    } else if (node.isObject()) {
      let result = node as SourcedJsonValue;
      for (const key of node.getOwnKeys()) {
        const value = await this.processDirectives(node.getSourced(key)!);
        result = await this.applyDirective(result, key, value);
      }
      return result;
    } else {
      return node;
    }
  }

  /**
   * Applies the given directive to the given node. This method should only be
   * called by Directive implementations that need to read and apply directives
   * that are specified in some custom manner that is not handled by the
   * resolver (like the $patch directive, which reads directives in a custom
   * format).
   */
  async applyDirective(
    obj: SourcedJsonValue,
    key: string,
    value: SourcedJsonValue
  ): Promise<SourcedJsonValue> {
    const matchedDirective = this.directives.find(d => d.accept(key));
    if (matchedDirective) {
      obj = await matchedDirective.transform(this, obj, key, value);
    } else {
      obj.setSourced(key, value);
    }
    return obj;
  }
}

/**
 * A template directive that controls how a sourced json template is
 * transformed. Templates are transformed when a particular object key is
 * "accepted" by a directive. The directive's transform() method then uses
 * the value of that key (and possibly other information) to return a new node
 * that replaces the original node in the template. The new node might be the
 * same object as the original node, and the original node may be modified in
 * place.
 */
export interface Directive {
  accept(key: string): boolean;

  transform(
    resolver: Resolver,
    obj: SourcedJsonValue,
    key: string,
    value: SourcedJsonValue
  ): Promise<SourcedJsonValue>;
}

/** Replaces a node with a given value. */
class ReplaceDirective implements Directive {
  accept(key: string) {
    return key === '$replace';
  }

  async transform(
    resolver: Resolver,
    obj: SourcedJsonValue,
    key: string,
    value: SourcedJsonValue
  ): Promise<SourcedJsonValue> {
    return value;
  }
}

/** Applies a series of directives to the current node. */
class ApplyDirective implements Directive {
  accept(key: string) {
    return key === '$apply';
  }

  async transform(
    resolver: Resolver,
    obj: SourcedJsonValue,
    key: string,
    value: SourcedJsonValue
  ): Promise<SourcedJsonValue> {
    value.assertIsArray();
    if (obj.isObject()) {
      obj.deleteKey(key);
    }
    for (let i = 0; i < value.getLength(); i++) {
      const dir = value
        .propAsObject(i)
        .reqSourced(`Directive at position ${i} is not an object`);
      const directiveName = dir
        .propAsString('name')
        .req(`Directive name at position ${i} is not a string`);
      const directiveValue = dir
        .prop('value')
        .reqSourced(`Directive value at position ${i} is not specified`);
      obj = await resolver.applyDirective(obj, directiveName, directiveValue);
    }
    return obj;
  }
}

/** Applies a JSON patch to the current node. */
class PatchDirective implements Directive {
  accept(key: string) {
    return key === '$patch';
  }

  async transform(
    resolver: Resolver,
    obj: SourcedJsonValue,
    key: string,
    value: SourcedJsonValue
  ): Promise<SourcedJsonValue> {
    value.assertIsArray(
      'Bad $apply value: value must be an array of directives'
    );
    if (obj.isObject()) {
      obj.deleteKey('$patch');
    }
    for (let i = 0; i < value.getLength(); i++) {
      const operation = value
        .propAsObject(i)
        .reqSourced(`Patch op at ${i} is not an object`);
      operation
        .propAsString('op')
        .assertIsSetAndValid(`Patch op type at ${i} is not a string`);
    }
    // Use a custom json conversion so that all the primitives under each
    // operation's "value" property are serialized to a location-preserving
    // format, but all the other primitives are left alone.
    const patchJson = value.toJson(path => {
      const shouldConvert =
        path.length > 2 ||
        (path.length === 2 && path[path.length - 1].key === 'value');
      return shouldConvert;
    });
    diff.applyPatch<JsonValue>(
      obj.toJson(),
      patchJson as unknown as Operation[],
      false,
      true,
      true
    );
    return obj;
  }
}

/** Replaces the current node with a node imported from a file. */
class ImportDirective implements Directive {
  accept(key: string) {
    // NOTE: This is a woefully incomplete JSON ref implementation, but it works
    // for all of our use cases.
    return key === '$import' || key === '$ref';
  }

  async transform(
    resolver: Resolver,
    obj: SourcedJsonValue,
    key: string,
    value: SourcedJsonValue
  ): Promise<SourcedJsonValue> {
    value.assertIsString('Bad $import path: import path must be a string');
    const sourceFilePath = obj.loc.source;
    const parentFilePath = path.dirname(sourceFilePath);
    const userImportPath = value.value;
    const fullImportPath = path.resolve(parentFilePath, userImportPath);
    let importedSource;
    try {
      importedSource = parsePathSync(fullImportPath);
    } catch (e) {
      value.fail(
        `Error importing file at ${fullImportPath} ` +
          `(userPath: ${userImportPath}, parentFilePath: ${sourceFilePath})`,
        e
      );
    }
    // TODO: Handle reference paths
    try {
      return await resolver.resolve(importedSource);
    } catch (e) {
      value.fail(`Error resolving directives at ${fullImportPath}`, e);
    }
  }
}
