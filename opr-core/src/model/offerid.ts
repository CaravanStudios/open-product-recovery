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

import {Offer, StructuredOfferId, VersionedStructuredOfferId} from 'opr-models';
import {getUpdateTimestamp} from './getupdatetimestamp';

/**
 * Union type that can be used to identify an offer. If a string is used, the
 * string must conform to the format returned by idToUrl().
 */
export type OfferId = Offer | string | StructuredOfferId;

/**
 * Returns a StructuredOfferId or VersionedStructuredOfferId for any OfferId
 * type, depending on whether version information is available. If versioning is
 * required or forbidden, call asUnversionedStructuredId() or
 * asVersionedStructuredId() instead.
 */
export function asStructuredId(offer: OfferId): StructuredOfferId {
  if (typeof offer === 'string') {
    return urlToId(offer);
  }
  if ((offer as Offer).offeredBy !== undefined) {
    offer = offer as Offer;
    return {
      id: offer.id,
      postingOrgUrl: offer.offeredBy!,
      lastUpdateTimeUTC: getUpdateTimestamp(offer),
    } as StructuredOfferId;
  }
  return offer as StructuredOfferId;
}

/**
 * Returns an unversioned StructuredOfferId for any OfferId type.
 */
export function asUnversionedStructuredId(offer: OfferId): StructuredOfferId {
  const structured = asStructuredId(offer);
  return isVersionedId(structured) ? stripIdVersion(structured) : structured;
}

/**
 * Returns a VersionedStructuredOfferId for any OfferId type, if possible. If
 * the given OfferId type does not contain version information, an error is
 * thrown.
 */
export function asVersionedStructuredId(
  offer: OfferId
): VersionedStructuredOfferId {
  const structured = asStructuredId(offer);
  if (isVersionedId(structured)) {
    return structured;
  }
  throw new Error('No version information available in ' + offer);
}

/**
 * Returns an unversioned StructuredOfferId from a VersionedStructuredOfferId by
 * removing the lastUpdateTimeUTC field.
 */
export function stripIdVersion(offerId: StructuredOfferId): StructuredOfferId {
  return {
    id: offerId.id,
    postingOrgUrl: offerId.postingOrgUrl,
  };
}

/**
 * Returns whether the given StructuredOfferId contains version information.
 */
export function isVersionedId(
  offerId: StructuredOfferId
): offerId is VersionedStructuredOfferId {
  const structured = asStructuredId(offerId);
  return (
    (structured as VersionedStructuredOfferId).lastUpdateTimeUTC !== undefined
  );
}

/**
 * Converts the given OfferId value to an idUrl of the form:
 * postingOrgUrl#id&lastUpdateTimestampUTC
 * If version information is not available, the trailing &lastUpdateTimestampUTC
 * is omitted.
 *
 * By default, version information is included in the URL if it is available in
 * the OfferId. If the stripVersion parameter is set to true, version
 * information will not be encoded in the URL.
 */
export function idToUrl(offerId: OfferId, stripVersion = false): string {
  const structured = asStructuredId(offerId);
  const updateTimestampUTC = stripVersion
    ? undefined
    : (structured as VersionedStructuredOfferId).lastUpdateTimeUTC;
  return (
    `${structured.postingOrgUrl!}#${structured.id}` +
    (updateTimestampUTC !== undefined ? '&' + updateTimestampUTC : '')
  );
}

/**
 * Converts the given id url to a StructuredOfferId or
 * VersionedStructuredOfferId, depending on whether version information is
 * available in the url.
 */
export function urlToId(idUrl: string): StructuredOfferId {
  const parts = idUrl.split('#');
  if (parts.length !== 2) {
    throw new Error('Bad id url ' + idUrl);
  }
  const idParts = parts[1].split('&');
  if (idParts.length < 1 || idParts.length > 2) {
    throw new Error('Bad id url ' + idUrl);
  }
  const result = {
    id: idParts[0],
    postingOrgUrl: parts[0],
  } as VersionedStructuredOfferId;
  if (idParts.length === 2) {
    const timestampUTC = parseInt(idParts[2]);
    if (isNaN(timestampUTC)) {
      throw new Error('Bad id url ' + idUrl);
    }
    result.lastUpdateTimeUTC = timestampUTC;
  }
  return result;
}
