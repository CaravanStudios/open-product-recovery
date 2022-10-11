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

import {applyPatch, Operation} from 'fast-json-patch';
import {JSONPatch, Offer} from 'opr-models';
import {toOfferList, toOfferSet} from './toofferset';

/**
 * Applies a JSON patch to a collection of offers and returns the result as an
 * offer set record. This is done by converting the offers to an offer set using
 * #toOfferSet and applying the patch to the resulting offer set.
 */
export function patchAsMap(
  offers: Array<Offer> | Record<string, Offer>,
  patch: JSONPatch
): Record<string, Offer> {
  const set = toOfferSet(offers);
  return applyPatch(set, patch as Array<Operation>).newDocument;
}

/**
 * Applies a JSON patch to a collection of offers and returns the result as an
 * array. This is done by converting the offers to an offer set using
 * #toOfferSet, applying the patch to the resulting offer set, and then
 * converting the result to an array using #toOfferList.
 */
export function patch(
  offers: Array<Offer> | Record<string, Offer>,
  patch: JSONPatch
): Array<Offer> {
  return toOfferList(patchAsMap(offers, patch));
}
