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

import {deepClone, StatusError} from 'opr-core';
import {Offer, Product, ProductBundle, Validator} from 'opr-models';
import {GoogleSheetsClient, SheetDataRow} from './googlesheetsclient';
import {GoogleSheetsFormat} from './googlesheetsformat';

// Regexp for extracting contact info from a single cell.
const CONTACT_INFO_REGEXP = /(.+)\s*<(.+)>\s*/;
// Regexp for extracting location info from a single cell.
const LOCATION_INFO_REGEXP = /(.+?)[\n,]\s*(.+)\s*/;

// Range of rows to fetch. This constant means "Everything in the sheet named
// 'Offers'"
const ROW_RANGE = 'Offers';

/**
 * A simple sheet format where rows list products and rows with the same offer
 * id are grouped together.
 */
export class SimpleSheetFormat implements GoogleSheetsFormat {
  private offerDefaults?: Partial<Offer>;

  constructor(offerDefaults?: Partial<Offer>) {
    this.offerDefaults = offerDefaults;
  }

  async getOffers(client: GoogleSheetsClient): Promise<Array<Offer>> {
    return await this.toOffers(await client.getRows(ROW_RANGE));
  }

  protected async toOffers(rows: Array<SheetDataRow>): Promise<Array<Offer>> {
    const offers = [];
    const idToContents = {} as Record<string, Array<SheetDataRow>>;
    for (const vMap of rows) {
      const id = vMap.getProp('offerId');
      const status = vMap.getProp('status');
      if (id && id !== '' && status && status !== '') {
        let mapList = idToContents[id];
        if (!mapList) {
          mapList = [];
          idToContents[id] = mapList;
        }
        mapList.push(vMap);
      }
    }
    for (const offerId in idToContents) {
      const offer = deepClone(this.offerDefaults);
      const bundleDescComponents = [];
      const products = [];
      let offerExpirationTimeUTC = Number.MAX_SAFE_INTEGER;
      let offerCreationTimeUTC = Number.MAX_SAFE_INTEGER;
      let contactName = undefined;
      let contactEmail = undefined;
      let locationAddress = undefined;
      let locationName = undefined;
      let totalWeightLb = 0;
      for (const contentMap of idToContents[offerId]) {
        const desc = contentMap.getProp('desc');
        if (!desc) {
          continue;
        }
        bundleDescComponents.push(desc);
        const unitWeightLb = Number(contentMap.getProp('unitWeightLb'));
        if (isNaN(unitWeightLb) || unitWeightLb < 0) {
          continue;
        }
        totalWeightLb += unitWeightLb;
        const creationTimeUTC = Number(contentMap.getProp('creationTimeUTC'));
        if (isNaN(creationTimeUTC)) {
          continue;
        }
        if (creationTimeUTC < offerCreationTimeUTC) {
          offerCreationTimeUTC = creationTimeUTC;
        }
        const maxAgeDays = Number(contentMap.getProp('maxAgeDays'));
        if (isNaN(maxAgeDays)) {
          continue;
        }
        const productExpirationTimeUTC =
          creationTimeUTC + maxAgeDays * 24 * 60 * 60 * 1000;
        if (productExpirationTimeUTC < offerExpirationTimeUTC) {
          offerExpirationTimeUTC = productExpirationTimeUTC;
        }
        const quantity = Number(contentMap.getProp('quantity'));
        const product = {
          description: desc,
          quantity: isNaN(quantity) ? 1 : quantity,
          unitWeight: {
            unit: 'pound',
            value: unitWeightLb,
          },
          expirationTimestampUTC: productExpirationTimeUTC,
        } as Product;
        products.push(product);
        const itemContactInfo = contentMap.getProp('contactInfo');
        if (itemContactInfo) {
          const result = CONTACT_INFO_REGEXP.exec(itemContactInfo);
          if (result) {
            contactName = contactName ?? result[1];
            contactEmail = contactEmail ?? result[2];
          }
        }
        const itemLocationInfo = contentMap.getProp('locationInfo');
        if (itemLocationInfo) {
          const result = LOCATION_INFO_REGEXP.exec(itemLocationInfo);
          if (result) {
            locationName = locationName ?? result[1];
            locationAddress = locationAddress ?? result[2];
          }
        }
      }
      if (products.length === 0) {
        continue;
      }
      offer.id = offerId;
      offer.contents = {
        description: bundleDescComponents.join(' and '),
        contents: products,
        quantity: 1,
        unitWeight: {
          value: totalWeightLb,
          unit: 'pound',
        },
      } as ProductBundle;
      offer.description = bundleDescComponents.join(' and ');
      offer.contactInfo =
        contactName && contactEmail
          ? {
              contactName: contactName,
              contactEmail: contactEmail,
            }
          : offer.contactInfo;
      offer.offerLocation =
        locationName && locationAddress
          ? {
              locationName: locationName,
              locationAddress: locationAddress,
            }
          : offer.offerLocation;
      offer.offerCreationUTC = offerCreationTimeUTC;
      offer.offerExpirationUTC = offerExpirationTimeUTC;
      const validatorResult = Validator.validate(offer, 'offer.schema.json');
      if (validatorResult.valid) {
        offers.push(offer);
      } else {
        console.log(
          'Skipping incomplete offer',
          validatorResult.getErrorMessage(),
          offer
        );
      }
    }
    console.log('offers', offers);
    return offers;
  }

  async writeAccept(
    client: GoogleSheetsClient,
    offerId: string
  ): Promise<void> {
    const rows = await client.getRows(ROW_RANGE);
    for (const row of rows) {
      if (row.getProp('offerId') === offerId) {
        await client.setProperty(row, 'status', 'ACCEPTED');
        return;
      }
    }
    throw new StatusError(
      'Offer ' + offerId + 'not found',
      'SHEETS_ERRROR_OFFER_NOT_FOUND'
    );
  }
}
