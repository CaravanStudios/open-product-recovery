/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {JSONPatch, ListOffersPayload, Offer} from 'opr-models';

export interface OfferSetUpdate {
  earliestNextRequestUTC: number;
  updateCurrentAsOfTimestampUTC: number;
  diffStartTimeUTC?: number;
  sourceOrgUrl: string;
  offers?: Array<Offer>;
  delta?: JSONPatch;
}

export interface OfferProducer {
  readonly id: string;

  produceOffers(payload: ListOffersPayload): Promise<OfferSetUpdate>;
}
