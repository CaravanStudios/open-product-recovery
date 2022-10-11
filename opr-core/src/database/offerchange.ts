/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Offer, Timestamp} from 'opr-models';
import {OfferChangeType} from './offerchangetype';

export interface OfferChange {
  readonly type: OfferChangeType;
  readonly timestampUTC: Timestamp;
  readonly oldValue?: Offer;
  readonly newValue?: Offer;
}
