/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {OprDatabase} from '../../database/oprdatabase';
import {JWTPayload} from 'jose';
import {HistoryPayload, HistoryResponse} from 'opr-models';
import {AuthenticatedRequestHandler} from './authenticatedrequesthandler';

export class HistoryRequestHandler extends AuthenticatedRequestHandler<
  HistoryPayload,
  HistoryResponse
> {
  constructor(database: OprDatabase) {
    super(
      database,
      ['PRODUCTHISTORY'],
      'history.payload.schema.json',
      'history.response.schema.json'
    );
  }

  shouldIgnoreAccessControlList(): boolean {
    return true;
  }

  async handle(
    request: HistoryPayload,
    decodedAuthToken: JWTPayload
  ): Promise<HistoryResponse> {
    const historyItems = await this.database.getHistory(
      decodedAuthToken.iss!,
      request.historySinceUTC
    );
    return {
      offerHistories: historyItems,
    };
  }
}
