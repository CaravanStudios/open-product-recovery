/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AcceptOfferResponse,
  DecodedReshareChain,
  ListOffersPayload,
  ListOffersResponse,
  OfferHistory,
} from 'opr-models';
import {OfferSetUpdate} from '../coreapi';
import {OfferProducerMetadata} from '../offerproducer/offerproducermetadata';
import {HandlerRegistration} from './handlerregistration';
import {OfferChange} from './offerchange';

export interface OprDatabase {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  unlockProducer(metadata: OfferProducerMetadata): Promise<void>;
  lockProducer(producerId: string): Promise<OfferProducerMetadata | undefined>;
  list(orgUrl: string, payload: ListOffersPayload): Promise<ListOffersResponse>;
  processUpdate(producerId: string, update: OfferSetUpdate): Promise<void>;
  accept(
    offerId: string,
    orgUrl: string,
    ifNotNewerThanTimestampUTC?: number,
    decodedReshareChain?: DecodedReshareChain
  ): Promise<AcceptOfferResponse>;
  reject(
    rejectingOrgUrl: string,
    offerId: string,
    offeringOrgUrl?: string
  ): Promise<void>;
  reserve(
    offerId: string,
    requestedReservationSecs: number,
    orgUrl: string
  ): Promise<number>;
  getHistory(
    orgUrl: string,
    sinceTimestampUTC?: number
  ): Promise<Array<OfferHistory>>;
  registerChangeHandler(
    handlerFn: (change: OfferChange) => Promise<void>
  ): HandlerRegistration;
}
