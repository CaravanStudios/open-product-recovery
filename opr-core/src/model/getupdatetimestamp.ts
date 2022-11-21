import {Offer} from 'opr-models';

export function getUpdateTimestamp(offer: Offer): number {
  return offer.offerUpdateUTC ?? offer.offerCreationUTC;
}
