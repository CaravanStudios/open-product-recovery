import {Offer} from 'opr-models';

export interface RemoteOfferId {
  offerId: string;
  postingOrgUrl: string;
}

export function getRemoteOfferId(
  offer: Offer | string | RemoteOfferId
): RemoteOfferId {
  if (typeof offer === 'string') {
    const parts = offer.split('#');
    if (parts.length !== 2) {
      throw new Error('Bad remote offer id ' + offer);
    }
    return {
      offerId: parts[1],
      postingOrgUrl: parts[0],
    };
  }
  if ((offer as RemoteOfferId).postingOrgUrl === undefined) {
    return {
      offerId: (offer as Offer).id,
      postingOrgUrl: (offer as Offer).offeredBy!,
    };
  }
  return offer as RemoteOfferId;
}
