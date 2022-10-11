/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
