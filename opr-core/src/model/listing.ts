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

import {ChainScope} from '../auth/chainscope';
import {Interval} from './interval';

export const WILDCARD_ORG_ID = '*';

export interface ListingTarget {
  orgUrl: string;
  scopes?: Array<ChainScope>;
}

export interface Listing extends Interval, ListingTarget {}

/** Returns whether the given listing implies the ACCEPT scope. */
export function isAcceptListing(listing: Listing): boolean {
  return !listing.scopes || listing.scopes.indexOf('ACCEPT') >= 0;
}

/** Returns whether the given listing implies the RESHARE scope. */
export function isReshareListing(listing: Listing): boolean {
  return listing.scopes ? listing.scopes.indexOf('RESHARE') >= 0 : false;
}
