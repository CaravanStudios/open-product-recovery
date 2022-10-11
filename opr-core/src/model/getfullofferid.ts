/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
