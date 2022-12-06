export type JsonValue = string | number | boolean | JsonMap | JsonArray | null;

export interface JsonMap {
  [x: string]: JsonValue;
}

export type JsonArray = Array<JsonValue>;
