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

/* DO NOT EDIT - Automatically generated from json schema files */

/* eslint-disable */
/**
 * Payload for a request to accept an offer.
 */
export interface AcceptOfferPayload {
  offerId: string;
  ifNotNewerThanTimestampUTC?: Timestamp;
  reshareChain?: ReshareChain;
}

/**
 * Response to a request to accept an offer.
 */
export interface AcceptOfferResponse {
  [k: string]: 'false';
}

/**
 * A decoded auth token
 */
export interface DecodedAuthToken {
  iss: string;
  sub?: string;
  aud: string;
  [k: string]: unknown;
}

/**
 * A decoded reshare chain, containing only the resharing org id and scope
 */
export type DecodedReshareChain = DecodedReshareChainLink[];

/**
 * A decoded reshare chain link, containing the resharing org id and scope
 */
export interface DecodedReshareChainLink {
  sharingOrgUrl: string;
  recipientOrgUrl: string;
  scopes: ('RESHARE' | 'ACCEPT')[];
  entitlements: string;
  signature: string;
}

/**
 * Payload for a request for offer history.
 */
export interface HistoryPayload {
  historySinceUTC?: Timestamp;
}

/**
 * Response to a request for offer history.
 */
export interface HistoryResponse {
  offerHistories: OfferHistory[];
}

export type JSONPatch = (
  | {
      path: JSONPath;
      /**
       * The operation to perform.
       */
      op: 'add' | 'replace' | 'test';
      /**
       * The value to add, replace or test.
       */
      value: {
        [k: string]: unknown;
      };
    }
  | {
      path: JSONPath;
      /**
       * The operation to perform.
       */
      op: 'remove';
    }
  | {
      path: JSONPath;
      /**
       * The operation to perform.
       */
      op: 'move' | 'copy';
      from: JSONPath;
    }
)[];

/**
 * A JSON Pointer path.
 */
export type JSONPath = string;

/**
 * Payload for a request to list offers.
 */
export interface ListOffersPayload {
  pageToken?: string;
  requestedResultFormat?: ListFormat;
  diffStartTimestampUTC?: Timestamp;
  maxResultsPerPage?: number;
}

/**
 * Response to a request to list offers.
 */
export interface ListOffersResponse {
  responseFormat: ListFormat;
  resultsTimestampUTC: Timestamp;
  nextPageToken?: string;
  offers?: Offer[];
  diff?: JSONPatch;
}

/**
 * Enum of possible formats for responses to the list endpoint
 */
export type ListFormat = 'SNAPSHOT' | 'DIFF';

/**
 * An offer
 */
export interface Offer {
  id: string;
  description: string;
  notes?: string;
  contents: ProductBundle;
  reshareChain?: ReshareChain;
  transportationDetails?: TransportationDetails;
  contactInfo: OfferContact | unknown[];
  offeredBy?: string;
  offerLocation: OfferLocation;
  offerExpirationUTC: Timestamp;
  offerCreationUTC: Timestamp;
  offerUpdateUTC?: Timestamp;
  maxReservationTimeSecs?: number;
}

/**
 * Description of a person associated with an offer.
 */
export interface OfferContact {
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  contactSMS?: string;
}

/**
 * Description of the history of an accepted offer
 */
export interface OfferHistory {
  offer: Offer;
  acceptedAtUTC: Timestamp;
  decodedReshareChain?: DecodedReshareChain;
  acceptingOrganization: string;
}

/**
 * Description of the location of an offer.
 */
export interface OfferLocation {
  locationName: string;
  locationAddress: string;
  /**
   * @minItems 0
   */
  accessWindows?: TimeRange[] | null;
  pickupNotes?: string;
}

/**
 * An absolute measurement of some physical quantity. A measurement is always a combination of a unit, a dimension, and a value. For some measurements, the dimension must be specified explicitly (i.e. a measurement in 'inches' must specify a physical dimension being measured, like 'height'). However, for some measurements the dimension is implied by the unit (i.e. 'count' is always a measure of quantity), so the dimension does not need to be specified explicitly, although it is legal to do so.
 */
export type OtherMeasurement =
  | {
      unit: 'count';
      dimension?: 'quantity';
      value: number;
      [k: string]: unknown;
    }
  | {
      unit: 'celcius' | 'farenheit';
      dimension: 'temperature-max' | 'temperature-min' | 'temperature-ideal';
      value: number;
      [k: string]: unknown;
    }
  | {
      unit:
        | 'cubiccentimeter'
        | 'cubicfoot'
        | 'cubicinch'
        | 'cubicmeter'
        | 'pallet';
      dimension?: 'volume';
      value: number;
      [k: string]: unknown;
    }
  | {
      unit: 'fluidounce' | 'gallon' | 'liter';
      dimension?: 'volume-liquid';
      value: number;
      [k: string]: unknown;
    }
  | {
      unit: 'centimeter' | 'foot' | 'inch' | 'meter' | 'yard';
      dimension: 'length' | 'width' | 'height';
      value: number;
      [k: string]: unknown;
    };

/**
 * All possible packing type values
 */
export type PackagingType =
  | 'none'
  | 'box'
  | 'bin'
  | 'bag'
  | 'pallet'
  | 'shippingcontainer';

/**
 * A stated price of a product or bundle, along with the ISO currency code
 */
export interface Price {
  value: number;
  currency?: string;
}

/**
 * A description of a single product
 */
export interface Product {
  id?: string;
  description: string;
  unitWeight?: Weight;
  expirationTimestampUTC?: Timestamp;
  quantity?: number;
  price?: Price;
  /**
   * @minItems 0
   * @maxItems 10
   */
  itemTypeIds?: TypeIdentifier[];
  /**
   * A list of uris to photos showing this item. Multiple values are allowed. It is the responsibility of the submitter to ensure that photos are public and/or reachable by others.
   *
   * @minItems 0
   */
  photoUris?: string[];
  /**
   * A list of physical measurements for each instance of this item, such as volume, length, etc. Only one value may be specified for each unit of measure. This field specifies the measurements for a single instance of this item. If a quantity is specified for this product, these measurements apply to a SINGLE item in the line, not all items in the line.
   *
   * @minItems 1
   */
  otherUnitMeasurements?: OtherMeasurement[];
}

/**
 * A collection of products and product bundles
 */
export interface ProductBundle {
  id?: string;
  description: string;
  unitWeight: Weight;
  expirationTimestampUTC?: Timestamp;
  /**
   * @minItems 1
   */
  contents: (ProductBundle | Product)[];
  quantity: number;
  packagingType?: PackagingType;
  price?: Price;
  /**
   * A list of uris to photos showing this item. Multiple values are allowed. It is the responsibility of the submitter to ensure that photos are public and/or reachable by others.
   *
   * @minItems 0
   */
  photoUris?: string[] | null;
  isGrossEstimate?: boolean;
  /**
   * A list of physical measurements for each instance of this item, such as volume, length, etc. Only one value may be specified for each unit of measure. This field specifies the measurements for a single instance of this item. If a quantity is specified for this product, these measurements apply to a SINGLE item in the line, not all items in the line.
   *
   * @minItems 1
   */
  otherUnitMeasurements?: OtherMeasurement[];
}

/**
 * Payload for a request to reject an offer.
 */
export interface RejectOfferPayload {
  offerId: string;
  offeredByUrl?: string;
}

/**
 * Response to a request to reject an offer.
 */
export interface RejectOfferResponse {}

/**
 * Payload for a request to reserve an offer.
 */
export interface ReserveOfferPayload {
  offerId: string;
  reshareChain?: ReshareChain;
  requestedReservationSecs?: Timestamp;
}

/**
 * Response to a request to reserve an offer.
 */
export interface ReserveOfferResponse {
  reservationExpirationUTC: Timestamp;
}

/**
 * An offer
 */
export type ReshareChain = string[];

/**
 * A range of time with an absolute start and endpoint.
 */
export interface TimeRange {
  startTimeUTC: Timestamp;
  endTimeUTC: Timestamp;
}

/**
 * A positive timestamp, in UTC milliseconds
 */
export type Timestamp = number;

/**
 * Information about offer transportation
 */
export interface TransportationDetails {}

/**
 * A reference to a term in a controlled vocabulary that describes a particular product
 */
export interface TypeIdentifier {
  vocabularyId: 'gtin' | 'foodex2' | 'plu';
  itemId: string;
}

/**
 * An absolute weight of some physical quantity. A weight is always a combination of a unit, a dimension, and a value. This is typically, but not exclusively, used as a sub-type of Measurement.
 */
export interface Weight {
  unit: 'gram' | 'kilogram' | 'ounce' | 'pound';
  dimension?: 'weight';
  value: number;
  [k: string]: unknown;
}
