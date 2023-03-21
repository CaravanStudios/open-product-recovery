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

import {ListOffersPayload, Offer, OfferPatch} from 'opr-models';
import { IntegrationApi } from '../coreapi';
import {Pluggable} from '../integrations/pluggable';

export interface OfferSetUpdate {
  earliestNextRequestUTC: number;
  updateCurrentAsOfTimestampUTC: number;
  diffStartTimeUTC?: number;
  sourceOrgUrl: string;
  offers?: AsyncIterable<Offer>;
  delta?: AsyncIterable<OfferPatch>;
}

export interface OfferProducer extends Pluggable {
  readonly type: 'offerProducer';

  readonly id: string;

  /**
   * Produce a diffset of offers that the client should apply to its state.
   * The response includes a page of the diffs starting at the timestamp passed
   * in as diffStartTimestampUTC. The returned offers should be in chronological
   * order.
   *
   * @param {ListOffersPayload} payload The request parameters.
   * @param {IntegrationApi} [integrationApi] API to get server-level data.
   * Only used for intra-server calls, not for RPC calls.
   * @return {Promise<OfferSetUpdate>} Returned as a promise to allow for RPCs
   * and IO.
   * @memberof OfferProducer
   */
  produceOffers(payload: ListOffersPayload, integrationApi: IntegrationApi):
      Promise<OfferSetUpdate>;
}
