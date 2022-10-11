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

import {Offer} from 'opr-models';
import {deepClone} from 'fast-json-patch';
import {getFullOfferId} from '../model/getfullofferid';

/**
 * Returns a collection of offers as an "offer set record." An offer set record
 * is a Record<string, Offer> that maps from full offer ids to offer contents.
 * This format is useful for JSON-patch, because it allows an entire collection
 * of offers to be modified with a single, unambiguous patch.
 *
 * If the clone parameter is set (or omitted), all offers in the incoming
 * collection are cloned before being added to the resulting set.
 */
export function toOfferSet(
  offers: Array<Offer> | Record<string, Offer>,
  clone = true
): Record<string, Offer> {
  if (!Array.isArray(offers)) {
    return clone ? deepClone(offers) : offers;
  }
  const out = {} as Record<string, Offer>;
  for (const offer of offers) {
    const cloned = clone ? (deepClone(offer) as Offer) : offer;
    out[getFullOfferId(cloned)] = cloned;
  }
  return out;
}

/**
 * Returns an array of offers from an offer set record. If the clone parameter
 * is set, every offer is cloned before being added to the resulting array.
 */
export function toOfferList(
  set: Record<string, Offer>,
  clone = false
): Array<Offer> {
  const result = [];
  for (const offerId in set) {
    const offer = set[offerId];
    const cloned = clone ? (deepClone(offer) as Offer) : offer;
    result.push(cloned);
  }
  return result;
}

/** Returns a deep clone of a list of offers. */
export function cloneOfferList(offers: Array<Offer>): Array<Offer> {
  return deepClone(offers);
}
