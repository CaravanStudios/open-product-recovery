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

import {ListOffersPayload, ListOffersResponse} from 'opr-models';
import {JWTPayload} from 'jose';
import {AuthenticatedRequestHandler} from './authenticatedrequesthandler';
import {OfferModel} from '../../database/offermodel';

export class ListRequestHandler extends AuthenticatedRequestHandler<
  ListOffersPayload,
  ListOffersResponse
> {
  constructor(database: OfferModel) {
    super(
      database,
      ['LISTPRODUCTS'],
      'list.payload.schema.json',
      'list.response.schema.json'
    );
  }

  async handle(
    request: ListOffersPayload,
    decodedAuthToken: JWTPayload
  ): Promise<ListOffersResponse> {
    return await this.database.list(decodedAuthToken.iss!, request);
  }
}
