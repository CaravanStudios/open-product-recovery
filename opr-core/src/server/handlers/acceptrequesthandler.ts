/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Verifier} from '../../auth/verifier';
import {OprDatabase} from '../../database/oprdatabase';
import {JWTPayload} from 'jose';
import {
  AcceptOfferPayload,
  AcceptOfferResponse,
  DecodedReshareChain,
} from 'opr-models';
import {BaseAcceptHandler} from '../../server/handlers/baseaccepthandler';

export class AcceptRequestHandler extends BaseAcceptHandler<
  AcceptOfferPayload,
  AcceptOfferResponse
> {
  constructor(database: OprDatabase, myOrgUrl?: string, verifier?: Verifier) {
    super(
      database,
      'accept.payload.schema.json',
      'accept.response.schema.json',
      myOrgUrl,
      verifier
    );
  }

  async handleWithChain(
    request: AcceptOfferPayload,
    decodedAuthToken: JWTPayload,
    decodedReshareChain: DecodedReshareChain
  ): Promise<AcceptOfferResponse> {
    return await this.database.accept(
      request.offerId,
      decodedAuthToken.iss!,
      request.ifNotNewerThanTimestampUTC,
      decodedReshareChain
    );
  }
}
