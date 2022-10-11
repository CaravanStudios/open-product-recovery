/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
