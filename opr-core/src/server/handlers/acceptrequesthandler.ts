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
import {OfferModel} from '../../model/offermodel';
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
  constructor(database: OfferModel, myOrgUrl?: string, verifier?: Verifier) {
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
