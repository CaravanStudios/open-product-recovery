/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ListOffersPayload, ListOffersResponse} from 'opr-models';
import {JWTPayload} from 'jose';
import {AuthenticatedRequestHandler} from './authenticatedrequesthandler';
import {OprDatabase} from '../../database/oprdatabase';

export class ListRequestHandler extends AuthenticatedRequestHandler<
  ListOffersPayload,
  ListOffersResponse
> {
  constructor(database: OprDatabase) {
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
