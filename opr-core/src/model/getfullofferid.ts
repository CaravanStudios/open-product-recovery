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
import {StatusError} from '../coreapi';

/**
 * Returns the full, globally unique identifier for an offer, constructed by
 * concatenating the offeredBy field with a # symbol and the offer id.
 */
export function getFullOfferId(offer: Offer) {
  if (!offer.offeredBy) {
    throw new StatusError(
      `Bad offer ${offer.id}: no offeredBy field`,
      'INTERNAL_ERROR_BAD_OFFER_NO_SOURCE',
      500
    );
  }
  return `${offer.offeredBy!}#${offer.id}`;
}
