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

export type OperationName =
  | 'LIST'
  | 'ACCEPT'
  | 'REJECT'
  | 'RESERVE'
  | 'HISTORY';

export function getRequiredScopes(op: OperationName): Array<string> {
  switch (op) {
    case 'LIST':
      return ['LISTPRODUCTS'];
    case 'ACCEPT':
    case 'REJECT':
    case 'RESERVE':
      return ['ACCEPTPRODUCT'];
    case 'HISTORY':
      return ['PRODUCTHISTORY'];
  }
}
