/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {IllegalRequestError} from './illegalrequesterror';

export class UnknownOfferError extends IllegalRequestError {
  constructor(offerId: string) {
    super(`Unknown offer ${offerId}`, 'OFFER_UNKNOWN');
  }
}
