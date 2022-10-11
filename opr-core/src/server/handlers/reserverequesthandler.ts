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

import {Verifier} from '../../auth/verifier';
import {ReserveOfferPayload, ReserveOfferResponse} from 'opr-models';
import {JWTPayload} from 'jose';
import {BaseAcceptHandler} from './baseaccepthandler';
import {OprDatabase} from '../../database/oprdatabase';

export class ReserveRequestHandler extends BaseAcceptHandler<
  ReserveOfferPayload,
  ReserveOfferResponse
> {
  private defaultReservationTimeSecs: number;

  constructor(
    database: OprDatabase,
    defaultReservationTime: number,
    myOrgUrl?: string,
    verifier?: Verifier
  ) {
    super(
      database,
      'reserve.payload.schema.json',
      'reserve.response.schema.json',
      myOrgUrl,
      verifier
    );
    this.defaultReservationTimeSecs = defaultReservationTime;
  }

  async handleWithChain(
    request: ReserveOfferPayload,
    decodedAuthToken: JWTPayload
  ): Promise<ReserveOfferResponse> {
    const reservationExpUTC = await this.database.reserve(
      request.offerId,
      request.requestedReservationSecs || this.defaultReservationTimeSecs,
      decodedAuthToken.iss!
    );
    return {
      reservationExpirationUTC: reservationExpUTC,
    };
  }
}
