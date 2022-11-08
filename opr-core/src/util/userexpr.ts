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

export type UserFilterUnsafeFn<R, T> = (context: T) => R;

export type StringKeys<T> = Extract<keyof T, string>;

/**
 * Executes a user-provided Javascript expression in a scope populated with the
 * variable names and values set using the key-value pairs in the given object.
 * NEVER RUN THIS METHOD WITH AN UNTRUSTED EXPRESSION. This method must only be
 * used to evaluate Javascript expressions that are provided by a trusted
 * developer (usually from a stored configuration of some kind). The user
 * expression will have access to the global Javascript context and can execute
 * arbitrary code against it.
 *
 * If the same expression is likely to be evaluated many times against different
 * sets of parameters, better performance will be obtained by compiling the user
 * expression with compileUserExprUnsafe and re-using the resulting function.
 */
export function evalUserExprUnsafe<R, T>(userExpr: string, params: T): R {
  const compiledFn = compileUserExprUnsafe<R, T>(userExpr, params);
  return compiledFn(params);
}

/**
 * Executes a user-provided Javascript expression into a function. The function
 * can be called with a map of key-value pairs that will be mapped into the
 * variable values available in the user expression.
 * NEVER RUN THIS METHOD WITH AN UNTRUSTED EXPRESSION. This method must only be
 * used to evaluate Javascript expressions that are provided by a trusted
 * developer (usually from a stored configuration of some kind). The user
 * expression will have access to the global Javascript context and can execute
 * arbitrary code against it.
 */
export function compileUserExprUnsafe<R, T>(
  userExpr: string,
  varNamesOrStruct: Array<StringKeys<T>> | T
): UserFilterUnsafeFn<R, T> {
  const varNames = Array.isArray(varNamesOrStruct)
    ? varNamesOrStruct
    : (Object.getOwnPropertyNames(varNamesOrStruct) as Array<StringKeys<T>>);
  const userFunction = new Function(...varNames, `return ${userExpr};`);
  return (x: T) => {
    const paramValues = varNames.map(name => x[name]);
    return userFunction(...paramValues);
  };
}
