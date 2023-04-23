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

import {compare} from 'fast-json-patch';
import {JSONPatch, Offer, OfferPatch} from 'opr-models';
import {asStructuredId, stripIdVersion} from '../model/offerid';
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

/** @deprecated */
export function diffAsOfferPatches(
  to: Array<Offer> | Record<string, Offer>,
  from: Array<Offer> | Record<string, Offer>
): OfferPatch[] {
  const seta = toOfferSet(to);
  const setb = toOfferSet(from);
  const patches: OfferPatch[] = [];
  for (const idUrl in seta) {
    const oldOffer = seta[idUrl];
    const newOffer = setb[idUrl];
    patches.push(diffAsOfferPatch(newOffer, oldOffer));
  }
  for (const idUrl in setb) {
    const oldOffer = seta[idUrl];
    // Skip anything where there's a matching offer in set a, we've
    // already dealt with those.
    if (oldOffer) {
      continue;
    }
    patches.push(diffAsOfferPatch(setb[idUrl], undefined));
  }
  return patches;
}

export function diffAsOfferPatch(
  toOffer?: Offer,
  fromOffer?: Offer
): OfferPatch {
  let jsonPatch: JSONPatch;
  let requiresVersion = false;
  if (!toOffer && !fromOffer) {
    throw new Error(
      'Illegal arguments: toOffer and fromOffer cannot both be undefined'
    );
  }
  if (!toOffer) {
    jsonPatch = [
      {
        op: 'remove',
        path: '',
      },
    ];
  } else if (!fromOffer) {
    jsonPatch = [
      {
        op: 'add',
        path: '',
        value: toOffer as unknown as Record<string, unknown>,
      },
    ];
  } else {
    jsonPatch = compare(toOffer, fromOffer) as JSONPatch;
    for (const op of jsonPatch) {
      if (op.path !== '') {
        requiresVersion = true;
        break;
      }
    }
  }
  const target = asStructuredId((fromOffer ?? toOffer)!);
  return {
    target: requiresVersion ? target : stripIdVersion(target),
    patch: jsonPatch,
  };
}
