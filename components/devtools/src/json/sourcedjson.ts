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

import parse from 'json-to-ast';
import fs from 'fs';

/**
 * Map of primitive type names to the related types.
 */
interface PrimitiveTypesMap {
  string: string;
  number: number;
  boolean: boolean;
  // Null is a strange value. It has its own type in Typescript, but
  // (typeof null) returns "object".
  null: null;
}

/**
 * A union type containing every string that represents a primitive type name
 * (the keys in PrimitiveTypesMap)
 */
type PrimitiveTypeNames = keyof PrimitiveTypesMap;

/**
 * A union type containing every primitive type (the values in
 * PrimitiveTypesMap)
 */
type PrimitiveType = PrimitiveTypesMap[PrimitiveTypeNames];

/**
 * A map of type names to types for every valid JSON object type.
 */
interface JsonTypesMap extends PrimitiveTypesMap {
  object: JsonObject;
  array: JsonArray;
  any: JsonValue;
}

/**
 * A union type containing all valid JSON type names.
 */
type JsonTypeNames = keyof JsonTypesMap;

/**
 * A type for a JSON value.
 */
export type JsonValue = JsonObject | JsonArray | PrimitiveType;

/**
 * A type for a JSON object in this API. Not _any_ JSON object, but any JSON
 * object created by the SourcedJson parser.
 */
export type JsonObject = {
  /**
   * The special reserved property that returns the sourced version of the
   * JSON object.
   * The indexed property declaration below says that all keys in a JSON Object
   * must map to a JsonValue. The $ property breaks that contract by having a
   * value of the type SourcedJsonObject. By creating two type declarations and
   * intersecting them, the compiler lets us get away with this and override the
   * contract for this one property name.
   */
  $: SourcedJsonObject;
} & {
  [key: string]: JsonValue;
};

/**
 * A JSON array for this API, with a special $ accessor for the SourcedJson
 * version of the object.
 */
export interface JsonArray extends Array<JsonValue> {
  $: SourcedJsonArray;
}

/**
 * A description of a source location. This is an extension of the Location
 * object used by json-to-ast with some modifications.
 */
export interface Location extends parse.Location {
  /**
   * Whether this location is a guess. Guesses are generated when an unsourced
   * object is added to a sourced JSON object.
   */
  isGuess?: boolean;

  /**
   * Force the source property to be defined. All locations have a source
   * string in this API.
   */
  source: string;
}

/**
 * An error based on a SourcedJson value. SourcedJson errors report additional
 * detail about the source location of the object that generated the error.
 * SourcedJson errors should be thrown when an error is caused by an incorrect
 * value that came from a JSON source - for example, a file path that cannot
 * be loaded, or a test expectation that failed.
 * Typically, user code should not construct SourcedJsonValueErrors directly.
 * User code should use the SourcedJsonValue#fail() method or one of the
 * SourcedJson assertion methods instead.
 */
export class SourcedJsonValueError extends Error {
  constructor(options?: SourcedJsonValueErrorOptions) {
    let message =
      options?.message ||
      'Illegal value' +
        (options?.value ? ': ' + JSON.stringify(options.value) : '');
    if (options?.value?.loc) {
      const loc = options.value.loc;
      message +=
        '\n       caused by value of type ' +
        `${options.value.getJsonTypeName()}: ` +
        JSON.stringify(options.value.toJson()) +
        '\n       defined at: ' +
        (loc.isGuess ? '<unknown>, nearest known parent at: ' : '') +
        `${loc.source}: ${loc.start.line}:${loc.start.column}`;
    }
    const causeIsError = options?.cause instanceof Error;
    if (options?.cause) {
      if (causeIsError) {
        message += `\n    caused by error: ${(options.cause as Error).stack}`;
      } else {
        message += `\n    caused by error: ${options?.cause}`;
      }
    }
    const errorParams = {
      cause: causeIsError ? (options.cause as Error) : undefined,
    };
    super(message, errorParams);
  }

  private shorten(val: string, maxLength = 40) {
    if (val.length <= maxLength) {
      return val;
    }
    const start = val.substring(0, Math.floor((maxLength - 3) / 2));
    const end = val.substring(Math.floor((maxLength - 3) / 2) + 1);
    return start + '...' + end;
  }
}

/** Options for constructing a SourcedJsonValueError */
export interface SourcedJsonValueErrorOptions {
  message?: string;
  value?: SourcedJsonValue;
  cause?: unknown;
}

/**
 * Base class of all SourcedJsonValues.
 *
 * SourcedJsonValue contains many quality-of-life methods for TypeScript users.
 * In all cases, isXXX and assertXXX methods use assertion signatures to
 * narrow down object types in code that checks JSON structure.
 */
export abstract class SourcedJsonValue {
  /** The location from which this value was loaded. */
  readonly loc: Location;

  constructor(loc: Location) {
    this.loc = loc;
  }

  /**
   * Throws a SourcedJsonValueError based on this value.
   */
  fail(message: string, cause?: unknown): never {
    throw new SourcedJsonValueError({
      message: message,
      cause: cause,
      value: this,
    });
  }

  /**
   * Returns the JSON type of the value held by this object.
   */
  getJsonTypeName(): JsonTypeNames {
    if (this.isObject()) {
      return 'object';
    }
    if (this.isArray()) {
      return 'array';
    }
    if (this.isBoolean()) {
      return 'boolean';
    }
    if (this.isNumber()) {
      return 'number';
    }
    if (this.isString()) {
      return 'string';
    }
    if (this.isNull()) {
      return 'null';
    }
    throw new Error('Unexpected condition - value is no known type');
  }

  /** Returns whether this is an array. */
  isArray(): this is SourcedJsonArray {
    return this instanceof SourcedJsonArray;
  }

  /** Throws an error with the given message if this is not an array. */
  assertIsArray(
    errorMessage = 'Expected array'
  ): asserts this is SourcedJsonArray {
    if (!this.isArray()) {
      this.fail(errorMessage);
    }
  }

  /** Returns whether this is an object. */
  isObject(): this is SourcedJsonObject {
    return this instanceof SourcedJsonObject;
  }

  /** Throws an error with the given message if this is not an array. */
  assertIsObject(
    errorMessage = 'Expected object'
  ): asserts this is SourcedJsonObject {
    if (!this.isObject()) {
      this.fail(errorMessage);
    }
  }

  private isPrimitiveOfType(
    primitiveType: PrimitiveTypeNames
  ): this is PrimitiveTypesMap[typeof primitiveType] {
    if (!(this instanceof SourcedJsonPrimitive)) {
      return false;
    }
    if (primitiveType === 'null') {
      return this.value === null;
    }
    return typeof this.value === primitiveType;
  }

  private assertIsPrimitiveOfType(
    type: PrimitiveTypeNames,
    errorMessage = `Expected ${type}`
  ): asserts this is PrimitiveTypesMap[typeof type] {
    if (!this.isPrimitiveOfType(type)) {
      this.fail(errorMessage);
    }
  }

  /** Returns whether this is a number. */
  isNumber(): this is SourcedJsonPrimitive<number> {
    return this.isPrimitiveOfType('number');
  }

  /** Throws an error with the given message if this is not a number. */
  assertIsNumber(
    errorMessage?: string
  ): asserts this is SourcedJsonPrimitive<number> {
    return this.assertIsPrimitiveOfType('number', errorMessage);
  }

  /** Returns whether this is a string. */
  isString(): this is SourcedJsonPrimitive<string> {
    return this.isPrimitiveOfType('string');
  }

  /** Throws an error with the given message if this is not a string. */
  assertIsString(
    errorMessage?: string
  ): asserts this is SourcedJsonPrimitive<string> {
    this.assertIsPrimitiveOfType('string', errorMessage);
  }

  /** Returns whether this is a boolean. */
  isBoolean(): this is SourcedJsonPrimitive<boolean> {
    return this.isPrimitiveOfType('boolean');
  }

  /** Throws an error with the given message if this is not a boolean. */
  assertIsBoolean(
    errorMessage?: string
  ): asserts this is SourcedJsonPrimitive<boolean> {
    this.assertIsPrimitiveOfType('boolean', errorMessage);
  }

  /** Returns whether this is null. */
  isNull(): this is SourcedJsonPrimitive<null> {
    return this.isPrimitiveOfType('null');
  }

  /** Throws an error with the given message if this is not null. */
  assertIsNull(
    errorMessage?: string
  ): asserts this is SourcedJsonPrimitive<null> {
    this.assertIsPrimitiveOfType('null', errorMessage);
  }

  /** Returns an untyped property getter for the given key. */
  prop(key: string | number): PropGetter<SourcedJsonValue, 'any'> {
    return new PropGetter({
      key: key,
      typeName: 'any',
      obj: this,
      toJson(x: SourcedJsonValue): JsonValue {
        return x.toJson();
      },
      isSourcedTypeFn(x) {
        return x instanceof SourcedJsonValue;
      },
    });
  }

  /** Returns an array property getter for the given key. */
  propAsArray(key: string | number): PropGetter<SourcedJsonArray, 'array'> {
    return new PropGetter({
      key: key,
      typeName: 'array',
      obj: this,
      toJson(x: SourcedJsonArray): JsonArray {
        return x.toJson();
      },
      isSourcedTypeFn(x) {
        return x instanceof SourcedJsonArray;
      },
    });
  }

  /** Returns an object property getter for the given key. */
  propAsObject(key: string | number): PropGetter<SourcedJsonObject, 'object'> {
    return new PropGetter({
      key: key,
      typeName: 'object',
      obj: this,
      toJson(x: SourcedJsonObject): JsonObject {
        return x.toJson();
      },
      isSourcedTypeFn(x) {
        return x instanceof SourcedJsonObject;
      },
    });
  }

  /** Returns a string property getter for the given key. */
  propAsString(
    key: string | number
  ): PropGetter<SourcedJsonPrimitive<string>, 'string'> {
    return new PrimitivePropGetter({
      key: key,
      typeName: 'string',
      obj: this,
    });
  }

  /** Returns a property getter for null values for the given key. */
  propAsNull(
    key: string | number
  ): PropGetter<SourcedJsonPrimitive<null>, 'null'> {
    return new PrimitivePropGetter({
      key: key,
      typeName: 'null',
      obj: this,
    });
  }

  /** Returns a number property getter for the given key. */
  propAsNumber(
    key: string | number
  ): PropGetter<SourcedJsonPrimitive<number>, 'number'> {
    return new PrimitivePropGetter({
      key: key,
      typeName: 'number',
      obj: this,
    });
  }

  /** Returns a boolean property getter for the given key. */
  propAsBoolean(
    key: string | number
  ): PropGetter<SourcedJsonPrimitive<boolean>, 'boolean'> {
    return new PrimitivePropGetter({
      key: key,
      typeName: 'boolean',
      obj: this,
    });
  }

  /** Gets the source location for the value at the given key. */
  getLoc(key: string | number): Location | undefined {
    const sourced = this.getSourced(key);
    if (!sourced) {
      return undefined;
    }
    return sourced.loc;
  }

  /** Sets the given key to the given sourced json value */
  abstract setSourced(key: string | number, value: SourcedJsonValue): void;

  /** Gets the sourced json value for the given key */
  abstract getSourced(key: string | number): SourcedJsonValue | undefined;

  /** Deep clones this sourced json value. */
  abstract deepClone(): SourcedJsonValue;

  /**
   * Converts this object to JSON. The resulting JSON has a live connection to
   * the original SourcedJson objects. If toJson() generates a JSON array, and
   * objects are deleted, those objects will disappear from the original
   * SourcedJson array as well.
   *
   * Note that this method runs in constant time if there are no parameters
   * passed. The zero-parameter version of this method returns a pre-computed
   * proxy object or primitive value.
   *
   * When SourcedJsonValues are converted to JSON, objects and arrays can be
   * converted back to their original SourcedJsonValue through the $ property.
   * However, it is not possible to attach additional accessors to primitives
   * in Javascript and Typescript, so JSON primitives do not carry source
   * information. Often, this doesn't matter, because the caller still has
   * access to the SourcedJson object if necessary.
   *
   * However, sometimes a SourcedJson object must be converted to JSON and
   * handed off to another library to be manipulated. For example, you may need
   * to load a source JSON file and manipulate it with a JSON patch loaded from
   * another file. Ideally, you could retain the source information for both
   * objects and identify which file a particular string came from.
   *
   * This can be done by serializing to JSON with "sourceable primitives". A
   * sourceable primitive is a primitive value that has been wrapped in a JSON
   * object. For example, "monkey" becomes {value: "monkey"}. If a sourceable
   * primitive value is inserted into a JSON array or object generated by this
   * library, it will be unwrapped and handled automatically.
   *
   * The useSourceablePrimitives parameter handles this conversion. If true,
   * all primitives in the object become sourceable primitives. If
   * useSourceablePrimitives is a function, that function is called for every
   * primitive value in the JSON output, with a path containing every ancestor
   * parent and key leading to the current primitive. This allows complex
   * serialization behavior for objects like JSON patches, where most primitives
   * need to be manipulated but some need to be left alone.
   */
  abstract toJson(
    useSourceablePrimitives?: boolean | ((path: SourcedPath) => boolean),
    path?: SourcedPath
  ): JsonValue;
}

/** A path to a sourced primitive. */
export type SourcedPath = Array<SourcedPathNode>;

/**
 * A path node in a SourcedPath. Each node contains a parent object and the key
 * by which the next object was accessed. Note that keys are always strings
 * here, even when accessing arrays.
 */
export interface SourcedPathNode {
  key: string;
  thisObj: SourcedJsonValue;
}

/**
 * A sourced primitive.
 */
export class SourcedJsonPrimitive<
  T extends PrimitiveType
> extends SourcedJsonValue {
  readonly value: T;

  constructor(loc: Location, value: T) {
    super(loc);
    this.value = value;
  }

  deepClone(): SourcedJsonValue {
    return new SourcedJsonPrimitive<T>(this.loc, this.value);
  }

  setSourced(key: string | number): void {
    throw new SourcedJsonValueError({
      message:
        `Cannot dereference key ${key} of ` +
        `${typeof this.value} ${this.value}`,
      value: this,
    });
  }

  getSourced(key: string | number): SourcedJsonValue | undefined {
    throw new SourcedJsonValueError({
      message:
        `Cannot dereference key ${key} of ` +
        `${typeof this.value} ${this.value}`,
      value: this,
    });
  }

  toJson(
    useSourceablePrimitives?: boolean | ((path: SourcedPath) => boolean),
    path: SourcedPath = []
  ): JsonValue {
    // Convert a boolean value for useSourceablePrimitives to a function that
    // always returns true.
    if (useSourceablePrimitives === true) {
      useSourceablePrimitives = () => true;
    }
    // If we're not using sourceable primitives, just return the wrapped
    // primitive value.
    if (
      useSourceablePrimitives === undefined ||
      useSourceablePrimitives === false ||
      useSourceablePrimitives(path) === false
    ) {
      return this.value;
    }
    // If we are using sourceable primitives, first create a wrapper object for
    // the primtive value.
    const returnVal = {
      value: this.value,
    };
    // Return a proxy that attaches the $ property to the wrapped primitive so
    // its source can be retrieved.
    return new Proxy(returnVal, {
      get: (target: object, p: string | symbol, receiver: any) => {
        if (p === '$') {
          return this;
        }
        return Reflect.get(target, p, receiver);
      },
      set: () => {
        throw new Error('Illegal to set values in sourceable primitive');
      },
    }) as unknown as JsonValue;
  }
}

/**
 * A proxy handler for all non-primitive JSON objects. This proxy handler is
 * used in normal JSON without sourceable primitives.
 */
class JsonProxyHandler implements ProxyHandler<object> {
  protected parentObject: SourcedJsonValue;

  constructor(parentObject: SourcedJsonValue) {
    this.parentObject = parentObject;
  }

  /**
   * Retrieves the value for the given property from the proxy object. If the
   * value is a SourcedJsonValue, convert it to JSON before returning it.
   */
  get?(target: object, p: string | symbol, receiver: any): any {
    if (p === '$') {
      return this.parentObject;
    }
    const targetValue = Reflect.get(target, p, receiver);
    if (targetValue instanceof SourcedJsonValue) {
      return targetValue.toJson();
    } else {
      return targetValue;
    }
  }

  /**
   * Sets the value of a property. If the new value has a $ property, the
   * underlying SourcedJsonValue is fetched and used to set the value in the
   * underlying proxied object. If the new value has no $ property, it is
   * converted to a SourcedJsonValue, the closest source position is guessed,
   * and the new SourcedJsonValue is set in the underlying proxied object.
   */
  set?(target: object, p: string | symbol, value: any, receiver: any): boolean {
    // Note: This line is a bit of a hack - because types are erased at runtime,
    // the call below will also dereference wrapped primitives, because they
    // have a $ property too.
    const valueSourced = (value as JsonObject | JsonArray).$;
    if (typeof p === 'symbol') {
      throw new Error('Cannot set symbols on JSON objects');
    }
    if (valueSourced instanceof SourcedJsonValue) {
      (this.parentObject as SourcedJsonValue).setSourced(p, valueSourced);
    } else {
      if (this.parentObject.isArray()) {
        // If we're setting a non-numeric property of an array (like length),
        // pass that right through to the target.
        if (isNaN(parseInt(p))) {
          Reflect.set(target, p, value, receiver);
          return true;
        }
      }
      this.parentObject.setSourced(
        p,
        jsonToSourcedValue(value as JsonValue, {
          ...this.parentObject.loc,
          isGuess: true,
        })
      );
    }
    return true;
  }
}

/**
 * A subclass of JsonProxyHandler for sourceable primitives that passes a check
 * function through the toJson() call chain. Otherwise it behaves identically
 * to the parent class.
 */
class JsonSourceablePrimitivesHandler extends JsonProxyHandler {
  private checkFn: (path: SourcedPath) => boolean;
  private path: SourcedPath;

  constructor(
    parentObject: SourcedJsonValue,
    path: SourcedPath,
    checkFn: (path: SourcedPath) => boolean
  ) {
    super(parentObject);
    this.checkFn = checkFn;
    this.path = path;
  }

  get?(target: object, p: string | symbol, receiver: any): any {
    if (p === '$') {
      return this.parentObject;
    }
    const targetValue = Reflect.get(target, p, receiver);
    if (targetValue instanceof SourcedJsonValue) {
      return targetValue.toJson(this.checkFn, [
        ...this.path,
        {
          key: p as string,
          thisObj: this.parentObject,
        },
      ]);
    } else {
      return targetValue;
    }
  }
}

/** A sourced json object. */
export class SourcedJsonObject extends SourcedJsonValue {
  private readonly valuesMap: Record<string, SourcedJsonValue>;
  private readonly jsonObject: JsonObject;

  constructor(loc: Location) {
    super(loc);
    this.valuesMap = {};
    this.jsonObject = new Proxy(
      this.valuesMap,
      new JsonProxyHandler(this)
    ) as unknown as JsonObject;
  }

  deleteKey(key: string): void {
    delete this.valuesMap[key];
  }

  getOwnKeys(): string[] {
    return Object.getOwnPropertyNames(this.valuesMap);
  }

  forEach(fn: (value: SourcedJsonValue, key: string) => boolean | void): void {
    for (const key of this.getOwnKeys()) {
      const result = fn(this.getSourced(key)!, key);
      if (result === true) {
        return;
      }
    }
  }

  deepClone(): SourcedJsonValue {
    const result = new SourcedJsonObject(this.loc);
    for (const key of this.getOwnKeys()) {
      result.setSourced(key, this.getSourced(key)!.deepClone());
    }
    return result;
  }

  setSourced(key: string | number, value: SourcedJsonValue): void {
    this.valuesMap[key] = value;
  }

  getSourced(key: string | number): SourcedJsonValue | undefined {
    return this.valuesMap[key];
  }

  toJson(
    useSourceablePrimitives?: boolean | ((path: SourcedPath) => boolean),
    path: SourcedPath = []
  ): JsonObject {
    if (useSourceablePrimitives === true) {
      useSourceablePrimitives = () => true;
    }
    if (
      useSourceablePrimitives === undefined ||
      useSourceablePrimitives === false
    ) {
      return this.jsonObject;
    } else {
      return new Proxy(
        this.valuesMap,
        new JsonSourceablePrimitivesHandler(this, path, useSourceablePrimitives)
      ) as unknown as JsonObject;
    }
  }
}

/** A sourced json array object. */
export class SourcedJsonArray extends SourcedJsonValue {
  private valuesArray: Array<SourcedJsonValue>;
  private readonly jsonArray: JsonArray;

  constructor(loc: Location) {
    super(loc);
    this.valuesArray = [];
    this.jsonArray = new Proxy(
      this.valuesArray,
      new JsonProxyHandler(this)
    ) as unknown as JsonArray;
  }

  forEach(fn: (value: SourcedJsonValue, key: number) => boolean | void): void {
    for (let i = 0; i < this.getLength(); i++) {
      const result = fn(this.getSourced(i)!, i);
      if (result === true) {
        return;
      }
    }
  }

  [Symbol.iterator](): IterableIterator<SourcedJsonValue> {
    return this.valuesArray[Symbol.iterator]();
  }

  getLength(): number {
    return this.valuesArray.length;
  }

  deepClone(): SourcedJsonValue {
    const result = new SourcedJsonArray(this.loc);
    for (let i = 0; i < this.getLength(); i++) {
      result.setSourced(i, this.getSourced(i)!.deepClone());
    }
    return result;
  }

  push(...values: SourcedJsonValue[]): void {
    this.valuesArray.push(...values);
  }

  setSourced(key: string | number, value: SourcedJsonValue): void {
    if (typeof key === 'string') {
      key = parseInt(key);
    }
    this.valuesArray[key] = value;
  }

  getSourced(key: string | number): SourcedJsonValue | undefined {
    if (typeof key === 'string') {
      key = parseInt(key);
    }
    return this.valuesArray[key];
  }

  toJson(
    useSourceablePrimitives?: boolean | ((path: SourcedPath) => boolean),
    path: SourcedPath = []
  ): JsonArray {
    if (useSourceablePrimitives === true) {
      useSourceablePrimitives = () => true;
    }
    if (
      useSourceablePrimitives === undefined ||
      useSourceablePrimitives === false
    ) {
      return this.jsonArray;
    } else {
      return new Proxy(
        this.valuesArray,
        new JsonSourceablePrimitivesHandler(this, path, useSourceablePrimitives)
      ) as unknown as JsonArray;
    }
  }
}

/**
 * Creates a sourced json value from a source string and a path. The "path" can
 * be any string, and is used in the location.source property of all parsed
 * values.
 */
export function parseSource(source: string, path = '$root'): SourcedJsonValue {
  const result = parse(source, {
    source: path,
  });
  return astToSourcedValue(result);
}

/**
 * Synchronously reads a file from the local filesystem and parses it as a
 * sourced JSON value.
 */
export function parsePathSync(sourcePath: string): SourcedJsonValue {
  const source = fs.readFileSync(sourcePath).toString();
  return parseSource(source, sourcePath);
}

/**
 * Converts a JSON abstract syntax tree to a sourced json value.
 */
function astToSourcedValue(ast: parse.ValueNode): SourcedJsonValue {
  let resultValue;
  const source = ast.loc?.source;
  if (!source) {
    throw new Error('Unexpected condition: No source found for ast');
  }
  switch (ast.type) {
    case 'Array': {
      resultValue = new SourcedJsonArray(ast.loc as Location);
      for (let i = 0; i < ast.children.length; i++) {
        const child = ast.children[i];
        resultValue.push(astToSourcedValue(child));
      }
      break;
    }
    case 'Object': {
      resultValue = new SourcedJsonObject(ast.loc as Location);
      for (const child of ast.children) {
        const key = child.key.value;
        const value = astToSourcedValue(child.value);
        resultValue.setSourced(key, value);
      }
      break;
    }
    case 'Literal': {
      resultValue = new SourcedJsonPrimitive(ast.loc as Location, ast.value);
      break;
    }
  }
  return resultValue;
}

/**
 * Creates a sourced JSON value tree from a plain JSON value.
 */
function jsonToSourcedValue(json: unknown, loc: Location): SourcedJsonValue {
  if (Array.isArray(json)) {
    const result = new SourcedJsonArray(loc);
    for (const value of json) {
      result.push(jsonToSourcedValue(value, loc));
    }
    return result;
  } else if (typeof json === 'object') {
    const result = new SourcedJsonObject(loc);
    for (const key in json) {
      result.setSourced(
        key,
        jsonToSourcedValue((json as Record<string, unknown>)[key], loc)
      );
    }
    return result;
  } else {
    const jsonType = typeof json;
    if (
      jsonType === 'number' ||
      jsonType === 'string' ||
      jsonType === 'boolean' ||
      json === null
    ) {
      return new SourcedJsonPrimitive(loc, json as PrimitiveType);
    }
    return new SourcedJsonPrimitive(loc, null);
  }
}

/**
 * Returns a SourcedJsonValue from an unknown object if possible, according to
 * the following rules:
 * 1) If the given object is a SourcedJsonValue, return it.
 * 2) If the given value has a $ property and the value of that property is a
 *    SourcedJsonValue, return the value of the $ property.
 * 3) Otherwise, return undefined.
 */
export function $maybe(val: unknown): SourcedJsonValue | undefined {
  if (val === undefined) {
    throw new Error('Cannot source undefined');
  }
  if (val instanceof SourcedJsonValue) {
    return val;
  }
  if (
    (val as JsonObject | JsonArray).$ !== undefined &&
    (val as JsonObject | JsonArray).$ instanceof SourcedJsonValue
  ) {
    return (val as JsonObject | JsonArray).$;
  }
  return undefined;
}

/**
 * Returns a SourcedJsonValue from an object of unknown type. If $maybe(val)
 * does not return undefined, that value is returned. Otherwise, the given
 * value is treated as a plain JSON object and converted to a SourcedJsonValue.
 */
export function $(val: unknown): SourcedJsonValue {
  return (
    $maybe(val) ??
    jsonToSourcedValue(val, createArtificialLocation('<code>', true))
  );
}

/**
 * A private helper interface with options for building a property getter.
 */
interface PropGetterOptions<
  SourcedType extends SourcedJsonValue,
  JsonTypeName extends JsonTypeNames
> {
  key: string | number;
  obj: SourcedJsonValue;
  typeName: JsonTypeName;
  isSourcedTypeFn: (x: SourcedJsonValue) => boolean;
  toJson: (x: SourcedType) => JsonTypesMap[JsonTypeName] | undefined;
}

/**
 * A private helper class for treating property values as a particular type.
 * PropGetter objects are returned by all the propAsXXX() methods in
 * SourcedJsonValue.
 */
class PropGetter<
  SourcedType extends SourcedJsonValue,
  JsonTypeName extends JsonTypeNames
> {
  protected readonly key: string | number;
  protected readonly obj: SourcedJsonValue;
  protected readonly typeName: JsonTypeName;
  private isSourcedTypeFn: (x: SourcedJsonValue) => boolean;
  private toJsonFn: (x: SourcedType) => JsonTypesMap[JsonTypeName] | undefined;

  constructor(options: PropGetterOptions<SourcedType, JsonTypeName>) {
    this.key = options.key;
    this.obj = options.obj;
    this.typeName = options.typeName;
    this.isSourcedTypeFn = options.isSourcedTypeFn;
    this.toJsonFn = options.toJson;
  }

  /**
   * If the property has a value, return it as the appropriate subtype of
   * SourcedJsonValue. If the property does not have a value, return undefined.
   * If the property value is defined and is the wrong type, an error (with
   * a configurable message and JSON source information) is thrown.
   */
  getSourced(
    errorMessage = `Expected ${this.key} to be ${this.typeName} or undefined`
  ): SourcedType | undefined {
    const sourcedRaw = this.obj.getSourced(this.key);
    if (sourcedRaw === undefined) {
      return sourcedRaw;
    }
    if (!this.isSourcedTypeFn(sourcedRaw)) {
      this.obj.fail(errorMessage);
    }
    return sourcedRaw as SourcedType;
  }

  /**
   * Return the property value as the appropriate subtype of SourcedJsonValue.
   * If the property value is undefined or is the wrong type, an error (with
   * a configurable message and JSON source information) is thrown.
   */
  reqSourced(
    errorMessage = `Expected ${this.key} to be ${this.typeName}`
  ): SourcedType {
    const sourced = this.getSourced(errorMessage);
    if (sourced === undefined) {
      return this.obj.fail(errorMessage);
    }
    return sourced;
  }

  /** Returns true if the value of the property is defined. */
  isSet(): boolean {
    const sourced = this.obj.getSourced(this.key);
    return sourced !== undefined;
  }

  /**
   * Returns true if the value of the property is defined and is the expected
   * type, or if the property is undefined.
   */
  isValid(): boolean {
    const sourced = this.obj.getSourced(this.key);
    if (sourced === undefined) {
      return true;
    }
    if (!this.isSourcedTypeFn(sourced)) {
      return false;
    }
    const json = this.toJsonFn(sourced as SourcedType);
    return json !== undefined;
  }

  /**
   * Asserts that the value of the property is defined. If it is not, an error
   * (with a configurable message and JSON source information) is thrown.
   */
  assertIsSet(errorMessage = `Expected ${this.key} to be defined`): this {
    if (!this.isSet()) {
      this.obj.fail(errorMessage);
    }
    return this;
  }

  /**
   * Asserts that the value of the property is defined. If it is not, an error
   * (with a configurable message and JSON source information) is thrown.
   */
  assertIsValid(
    errorMessage = `Expected ${this.key} to be ${this.typeName} or undefined`
  ): this {
    if (!this.isValid()) {
      this.obj.fail(errorMessage);
    }
    return this;
  }

  /**
   * Asserts that the value of the property is defined and valid. If it is not,
   * an error (with a configurable message and JSON source information) is
   * thrown.
   */
  assertIsSetAndValid(
    errorMessage = `Expected ${this.key} to be ${this.typeName}`
  ): this {
    if (!this.isSet()) {
      this.obj.fail(errorMessage);
    }
    return this;
  }

  /**
   * If the property has a value, return it as the appropriate subtype of
   * SourcedJsonValue or cast as requested by the caller. If the property does
   * not have a value, return undefined. If the property value is defined and
   * is the wrong type, an error (with a configurable message and JSON source
   * information) is thrown.
   */
  get<T = JsonTypesMap[JsonTypeName]>(
    errorMessage = `Expected ${this.key} to be ${this.typeName} or undefined`
  ): T | undefined {
    const sourced = this.getSourced(errorMessage);
    if (sourced === undefined) {
      return undefined;
    }
    const converted = this.toJsonFn(sourced);
    return converted === undefined ? undefined : (converted as unknown as T);
  }

  /**
   * If the property has a value, return it as the appropriate subtype of
   * SourcedJsonValue or cast as requested by the caller. If the property does
   * not have a value, return the given default value. If the property value is
   * defined and is the wrong type, an error (with a configurable message and
   * JSON source information) is thrown.
   */
  getOrDefault<T = JsonTypesMap[JsonTypeName]>(
    defaultVal: T,
    errorMessage?: string
  ): T {
    return this.get<T>(errorMessage) ?? defaultVal;
  }

  /**
   * Return the property value as the appropriate subtype of SourcedJsonValue or
   * cast as requested by the caller. If the property value is undefined or is
   * the wrong type, an error (with a configurable message and JSON source
   * information) is thrown.
   */
  req<T = JsonTypesMap[JsonTypeName]>(
    errorMessage = `Expected ${this.key} to be ${this.typeName}`
  ): T {
    const json = this.get(errorMessage);
    if (json === undefined) {
      return this.obj.fail(errorMessage);
    }
    return json as unknown as T;
  }
}

/** Private configuration interface for primitive getters. */
interface PrimitivePropGetterOptions<T extends PrimitiveTypeNames> {
  key: string | number;
  typeName: T;
  obj: SourcedJsonValue;
}

/**
 * A private subclass of PropGetter with additional logic for primitive type
 * checking.
 */
class PrimitivePropGetter<
  JsonTypeName extends PrimitiveTypeNames
> extends PropGetter<
  SourcedJsonPrimitive<PrimitiveTypesMap[JsonTypeName]>,
  JsonTypeName
> {
  constructor(options: PrimitivePropGetterOptions<JsonTypeName>) {
    super({
      key: options.key,
      typeName: options.typeName,
      obj: options.obj,
      toJson: (
        x: SourcedJsonPrimitive<PrimitiveTypesMap[JsonTypeName]>
      ): JsonTypesMap[JsonTypeName] | undefined => {
        const val = x.value;
        if (this.typeName === 'null') {
          return x.value === null
            ? (null as unknown as JsonTypesMap[JsonTypeName])
            : undefined;
        }
        if (typeof val === this.typeName) {
          return x.value as unknown as JsonTypesMap[JsonTypeName];
        } else {
          return undefined;
        }
      },
      isSourcedTypeFn(x) {
        return (
          x instanceof SourcedJsonPrimitive && typeof x.value === this.typeName
        );
      },
    });
  }
}

/**
 * Returns (and asserts) the given object as a JsonArray if it is a JSON array
 * with an associated SourcedJsonArray.
 */
export function isArray(x: unknown): x is JsonArray {
  return (
    (x as JsonArray | JsonObject).$ && (x as JsonArray | JsonObject).$.isArray()
  );
}

/**
 * Asserts that the given object as a JsonArray if it is a JSON array
 * with an associated SourcedJsonArray. If it is not, an error is thrown with
 * a configurable error message.
 */
export function assertIsArray(
  x: unknown,
  errorMessage = 'Expected array'
): asserts x is JsonArray {
  if (!isArray(x)) {
    const sourced = $maybe(x);
    if (sourced) {
      sourced.fail(errorMessage);
    } else {
      throw new Error(errorMessage);
    }
  }
}

/**
 * Returns (and asserts) the given object as a JsonObject if it is a JSON array
 * with an associated SourcedJsonArray.
 */
export function isObject(x: unknown): x is JsonObject {
  return (
    (x as JsonArray | JsonObject).$ &&
    (x as JsonArray | JsonObject).$.isObject()
  );
}

/**
 * Asserts that the given object as a JsonObject if it is a JSON object
 * with an associated SourcedJsonObject. If it is not, an error is thrown with
 * a configurable error message.
 */
export function assertIsObject(
  x: unknown,
  errorMessage = 'Expected object'
): asserts x is JsonObject {
  if (!isObject(x)) {
    const sourced = $maybe(x);
    if (sourced) {
      sourced.fail(errorMessage);
    } else {
      throw new Error(errorMessage);
    }
  }
}

/**
 * Creates an artificial location object. This is useful when generating objects
 * from code that must be mixed into the same object tree as SourcedJsonObjects.
 */
export function createArtificialLocation(
  source: string,
  isGuess?: boolean
): Location {
  return {
    isGuess: isGuess,
    source: source,
    start: {
      line: -1,
      column: -1,
      offset: -1,
    },
    end: {
      line: -1,
      column: -1,
      offset: -1,
    },
  };
}
