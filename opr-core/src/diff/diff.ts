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

import {compare} from 'fast-json-patch';
import {JSONPatch, Offer} from 'opr-models';
import {toOfferSet} from './toofferset';

/**
 * Returns a JSON patch that will convert the collection of offers in the "to"
 * parameter to the collection of offers in the "from" parameter. This is done
 * by converting the sets of offers into an offer set using the #toOfferSet
 * function. The resulting patch is a patch to convert one offer set to another.
 */
export function diff(
  to: Array<Offer> | Record<string, Offer>,
  from: Array<Offer> | Record<string, Offer>
): JSONPatch {
  const seta = toOfferSet(to);
  const setb = toOfferSet(from);
  return compare(seta, setb) as JSONPatch;
}
