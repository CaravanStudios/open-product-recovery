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

import {
  AcceptOfferResponse,
  DecodedReshareChain,
  ListOffersPayload,
  ListOffersResponse,
  Offer,
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
  getAllOffers(): Promise<Array<Offer>>;
}
