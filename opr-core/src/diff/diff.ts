/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
