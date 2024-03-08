/**
 * Copyright 2023 The Open Product Recovery Authors
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

import {Offer} from 'opr-models';
import {
  asVersionedStructuredId,
  idToUrl,
  OfferId,
  stripIdVersion,
} from './offerid';

export interface OfferLookup {
  get(target: OfferId): Promise<Offer | undefined>;
}

export class OfferMapLookup implements OfferLookup {
  private map: Record<string, Offer>;

  constructor(...offers: Array<Offer>) {
    this.map = {};
    this.add(...offers);
  }

  async get(target: OfferId): Promise<Offer | undefined> {
    const offerUrl = idToUrl(target);
    return this.map[offerUrl];
  }

  add(...offers: Array<Offer>): void {
    for (const offer of offers) {
      const versionedOfferId = asVersionedStructuredId(offer);
      const unversionedOfferId = stripIdVersion(versionedOfferId);
      this.map[idToUrl(versionedOfferId)] = offer;
      this.map[idToUrl(unversionedOfferId)] = offer;
    }
  }
}
