import {OfferListingPolicy} from '../offerlistingpolicy';
import {Listing, ChainScope} from '../../coreapi';
import {Offer} from 'opr-models';

export interface OrgListing {
  orgUrl: string;
  scopes: Array<ChainScope>;
}

export interface ListingCircle {
  // todo (ryckmanat): add filtering option here once we have a general method
  maximumListingTime: number;
  listedOrgs: Array<OrgListing>;
  childCircles?: Array<ListingCircle>;
}

/**
 * A generic listing policy that applies a series of nested collections
 * of organizations to a given org
 */
export class GenericCirclesListingPolicy implements OfferListingPolicy {
  private listingCircles: Array<ListingCircle>;

  constructor(listingCircles: Array<ListingCircle>) {
    this.listingCircles = listingCircles;
  }

  private async buildListings(
    offer: Offer,
    listingCircles: Array<ListingCircle>,
    baseListings: Array<Listing> = [],
    firstListingTimeUTC: number,
    currentTimeUTC: number,
    rejections: Set<string>,
    sharedBy: Set<string>
  ): Promise<Array<Listing>> {
    let baseTime: number;
    for (const circle of listingCircles) {
      baseTime = firstListingTimeUTC;
      const viableOrgs = circle.listedOrgs.filter(
        org => ~rejections.has(org.orgUrl) && ~sharedBy.has(org.orgUrl)
      );
      if (viableOrgs) {
        for (const listing of viableOrgs) {
          baseListings.push({
            orgUrl: listing.orgUrl,
            startTimeUTC: baseTime,
            endTimeUTC: baseTime + circle.maximumListingTime,
            scopes: listing.scopes,
          });
        }
        baseTime += circle.maximumListingTime;
      }
      if (circle.childCircles) {
        baseListings.concat(
          await this.buildListings(
            offer,
            circle.childCircles,
            baseListings,
            baseTime,
            currentTimeUTC,
            rejections,
            sharedBy
          )
        );
      }
    }
    return baseListings;
  }

  async getListings(
    offer: Offer,
    firstListingTimeUTC: number,
    currentTimeUTC: number,
    rejections: Set<string>,
    sharedBy: Set<string>
  ): Promise<Array<Listing>> {
    return this.buildListings(
      offer,
      this.listingCircles,
      [],
      firstListingTimeUTC,
      currentTimeUTC,
      rejections,
      sharedBy
    );
  }
}
