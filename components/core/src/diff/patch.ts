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

import {applyPatch, Operation} from 'fast-json-patch';
import {JSONPatch, Offer, OfferPatch} from 'opr-models';
import {idToUrl} from '../model/offerid';
import {OfferLookup, OfferMapLookup} from '../model/offerlookup';
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

export async function applyOfferPatchesAsMap(
  offers: Array<Offer> | Record<string, Offer>,
  patches: OfferPatch[]
): Promise<Record<string, Offer>> {
  if (!Array.isArray(offers)) {
    offers = toOfferList(offers);
  }
  const lookup = new OfferMapLookup(...offers);
  let result: Record<string, Offer> = {};
  for (const op of patches) {
    const patchResult = await applyOfferPatch(lookup, op);
    if (patchResult.type === 'INSERT' || patchResult.type === 'UPDATE') {
      result[idToUrl(patchResult.newOffer!, true)] = patchResult.newOffer!;
    } else if (patchResult.type === 'CLEAR') {
      result = {};
    }
  }
  return result;
}

export interface OfferPatchResult {
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'CLEAR' | 'NOOP' | 'ERROR';
  oldOffer?: Offer;
  newOffer?: Offer;
  error?: Error;
}

export async function applyOfferPatch(
  lookup: OfferLookup,
  patch: OfferPatch
): Promise<OfferPatchResult> {
  if (patch === 'clear') {
    return {type: 'CLEAR'};
  }
  const oldOffer = await lookup.get(patch.target);
  let newOffer = undefined;
  try {
    const result = applyPatch(oldOffer, patch.patch, undefined, false);
    newOffer = result.newDocument || undefined;
  } catch (e) {
    return {
      type: 'ERROR',
      oldOffer: oldOffer,
      newOffer: oldOffer,
      error: e as Error,
    };
  }
  if (oldOffer === newOffer) {
    return {
      type: 'NOOP',
      oldOffer: oldOffer,
      newOffer: oldOffer,
    };
  }
  const type =
    oldOffer === undefined
      ? 'INSERT'
      : newOffer === undefined
      ? 'DELETE'
      : 'UPDATE';
  return {
    type: type,
    oldOffer: oldOffer,
    newOffer: newOffer,
  };
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
