/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Offer} from 'opr-models';
import {Listing} from './listing';

export interface OfferListing {
  readonly offer: Offer;
  readonly listings: Readonly<Array<Readonly<Listing>>>;
}
