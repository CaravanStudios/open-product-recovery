/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
