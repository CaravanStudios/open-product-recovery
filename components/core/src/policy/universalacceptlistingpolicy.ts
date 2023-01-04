import {Offer} from 'opr-models';
import {Listing} from '../model/listing';
import {asAsyncGetter, AsyncGetter} from '../util/asyncgetter';
import {JsonMap} from '../util/jsonvalue';
import {OfferListingPolicy} from './offerlistingpolicy';

/**
 * A listing policy that grants all organizations permission to accept all
 * offers, but not to reshare them.
 */
export class UniversalAcceptListingPolicy implements OfferListingPolicy {
  private orgCollectionProvider: AsyncGetter<Iterable<string>>;

  constructor(
    orgCollectionProvider: AsyncGetter<Iterable<string>> | Iterable<string>
  ) {
    this.orgCollectionProvider = asAsyncGetter(orgCollectionProvider);
  }

  async getListings(
    offer: Offer,
    firstListingTimeUTC: number,
    currentTimeUTC: number,
    rejections: Set<string>,
    sharedBy: Set<string>
  ): Promise<Array<Listing>> {
    const creationTimeUTC = offer.offerCreationUTC;
    const expirationTimeUTC = offer.offerExpirationUTC;
    const orgs = await this.orgCollectionProvider.get();
    const result = [] as Listing[];
    for (const orgUrl of orgs) {
      if (rejections.has(orgUrl) || sharedBy.has(orgUrl)) {
        continue;
      }
      result.push({
        orgUrl: orgUrl,
        startTimeUTC: creationTimeUTC,
        endTimeUTC: expirationTimeUTC,
        scopes: ['ACCEPT'],
      });
    }
    return result;
  }
}

export class FakeListingPolicy implements OfferListingPolicy {
  private listingMap?: Record<string, Array<Listing>>;
  private delegate?: OfferListingPolicy;

  constructor(delegate?: OfferListingPolicy) {
    this.delegate = delegate;
  }

  clearListings(): void {
    this.listingMap = undefined;
  }

  setListings(listingMap: Record<string, Array<Listing>>): void {
    this.listingMap = listingMap;
  }

  async getListings(
    offer: Offer,
    firstListingTimeUTC: number,
    currentTimeUTC: number,
    rejections: Set<string>,
    sharedBy: Set<string>
  ): Promise<Listing[]> {
    if (this.listingMap) {
      return this.listingMap[offer.id] || [];
    }
    if (this.delegate) {
      return this.delegate.getListings(
        offer,
        firstListingTimeUTC,
        currentTimeUTC,
        rejections,
        sharedBy
      );
    }
    throw new Error('No delegate or listings set');
  }
}

export interface UniversalAcceptListingPolicyIntegrationOptions
  extends JsonMap {
  orgUrls: string[];
}

export const UniversalAcceptListingPolicyIntegration = {
  construct: async (
    json: UniversalAcceptListingPolicyIntegrationOptions
  ): Promise<UniversalAcceptListingPolicy> => {
    return new UniversalAcceptListingPolicy(json.orgUrls);
  },
};
