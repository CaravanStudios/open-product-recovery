/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {OprDatabase} from '../../database/oprdatabase';
import {JWTPayload} from 'jose';
import {RejectOfferPayload, RejectOfferResponse} from 'opr-models';
import {AuthenticatedRequestHandler} from './authenticatedrequesthandler';

export class RejectRequestHandler extends AuthenticatedRequestHandler<
  RejectOfferPayload,
  RejectOfferResponse
> {
  constructor(database: OprDatabase) {
    super(
      database,
      ['ACCEPTPRODUCT'],
      'reject.payload.schema.json',
      'reject.response.schema.json'
    );
  }

  async handle(
    request: RejectOfferPayload,
    decodedAuthToken: JWTPayload
  ): Promise<RejectOfferResponse> {
    await this.database.reject(
      decodedAuthToken.iss!,
      request.offerId,
      request.offeredByUrl
    );
    return {};
  }
}
