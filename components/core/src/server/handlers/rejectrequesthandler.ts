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

import {OfferModel} from '../../model/offermodel';
import {JWTPayload} from 'jose';
import {RejectOfferPayload, RejectOfferResponse} from 'opr-models';
import {AuthenticatedRequestHandler} from './authenticatedrequesthandler';

export class RejectRequestHandler extends AuthenticatedRequestHandler<
  RejectOfferPayload,
  RejectOfferResponse
> {
  constructor(database: OfferModel) {
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
    return await this.database.reject(
      decodedAuthToken.iss!,
      request.offerId,
      request.offeredByUrl
    );
  }
}
