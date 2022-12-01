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

import {json} from 'express';
import {
  ListOffersPayload,
  ListOffersResponse,
  DecodedReshareChain,
  AcceptOfferResponse,
  OfferHistory,
  Offer,
  ListFormat,
  RejectOfferResponse,
  ReserveOfferResponse,
  OfferPatch,
  ReshareChain,
  HistoryPayload,
  HistoryResponse,
} from 'opr-models';
import {Logger, log} from '../util/loglevel';
import {StatusError} from '../util/statuserror';
import {
  OfferVersionPair,
  PersistentStorage,
} from '../database/persistentstorage';
import {Transaction} from '../database/transaction';
import {applyOfferPatch, diff, diffAsOfferPatch} from '../diff';
import {OfferSetUpdate} from '../offerproducer/offerproducer';
import {OfferProducerMetadata} from '../offerproducer/offerproducermetadata';
import {Clock} from '../util/clock';
import {DefaultClock} from '../util/defaultclock';
import {HandlerRegistration} from './handlerregistration';
import {OfferChange} from './offerchange';
import {
  asStructuredId,
  asVersionedStructuredId,
  idToUrl,
  OfferId,
} from './offerid';
import {OfferLookup} from './offerlookup';
import {OfferModel} from './offermodel';
import {TimelineEntry} from './timelineentry';
import {
  appendAsyncIterables,
  asyncIterableFirst,
  asyncIterableToArray,
  hasContents,
  iterableToAsync,
} from '../util/asynciterable';
import {OfferListingPolicy} from '../policy/offerlistingpolicy';
import {intersect, subtract, trim, updateInterval} from './interval';
import {isReshareListing, Listing} from './listing';
import {Signer} from '../auth/signer';
import {getUpdateTimestamp} from './getupdatetimestamp';

export class PersistentOfferModel implements OfferModel {
  private storage: PersistentStorage;
  private maxPageSize: number;
  private hostOrgUrl: string;
  private listingPolicy: OfferListingPolicy;
  private signer?: Signer;
  private clock: Clock;
  private logger: Logger;
  private changeHandlers: Array<(change: OfferChange) => Promise<void>>;

  constructor(options: PersistentOfferModelOptions) {
    this.storage = options.storage;
    this.maxPageSize = options.maxPageSize ?? 100;
    this.hostOrgUrl = options.hostOrgUrl;
    this.listingPolicy = options.listingPolicy;
    this.signer = options.signer;
    this.clock = options.clock ?? new DefaultClock();
    this.logger = options.logger ?? log.getLogger('PersistentOfferModel');
    this.changeHandlers = [];
  }

  async initialize(): Promise<void> {
    await this.storage.initialize();
  }

  async shutdown(): Promise<void> {
    await this.storage.shutdown();
  }

  async writeOfferProducerMetadata(
    metadata: OfferProducerMetadata
  ): Promise<void> {
    const t = await this.storage.createTransaction();
    await this.storage.writeOfferProducerMetadata(t, metadata);
    await t.commit();
  }

  async getOfferProducerMetadata(
    orgUrl: string
  ): Promise<OfferProducerMetadata | undefined> {
    const t = await this.storage.createTransaction('READONLY');
    return await this.storage.getOfferProducerMetadata(t, orgUrl);
  }

  async decodePageToken<T>(pageToken: string): Promise<T> {
    return JSON.parse(pageToken) as T;
  }

  async encodePageToken<T>(val: T): Promise<string> {
    return JSON.stringify(val);
  }

  async list(
    orgUrl: string,
    payload: ListOffersPayload
  ): Promise<ListOffersResponse> {
    const decodedPageToken = payload.pageToken
      ? await this.decodePageToken<DecodedListPageToken>(payload.pageToken)
      : undefined;
    const pageSize =
      decodedPageToken?.maxResultsPerPage ??
      Math.min(this.maxPageSize, payload.maxResultsPerPage ?? this.maxPageSize);
    let skipCount = decodedPageToken?.skipCount ?? 0;
    const resultFormat =
      decodedPageToken?.resultFormat ??
      payload.requestedResultFormat ??
      'SNAPSHOT';
    const requestTimeUTC = decodedPageToken?.requestTimeUTC ?? this.clock.now();
    if (resultFormat === 'SNAPSHOT') {
      const t = await this.storage.createTransaction('READONLY');
      const offerIterable = this.storage.getOffersAtTime(
        t,
        this.hostOrgUrl,
        orgUrl,
        requestTimeUTC,
        skipCount
      );
      const offers = [];
      const iterator: AsyncIterator<Offer> =
        offerIterable[Symbol.asyncIterator]();
      let result;
      while (
        offers.length < pageSize &&
        (result = await iterator.next()) &&
        !result.done
      ) {
        offers.push(result.value);
      }
      let pageToken;
      if (result && !result.done) {
        pageToken = this.encodePageToken({
          maxResultsPerPage: pageSize,
          requestTimeUTC: requestTimeUTC,
          skipCount: skipCount + offers.length,
        } as DecodedListPageToken);
      }
      return {
        responseFormat: 'SNAPSHOT',
        resultsTimestampUTC: requestTimeUTC,
        offers: offers,
        nextPageToken: pageToken,
      } as ListOffersResponse;
    } else {
      if (payload.diffStartTimestampUTC === undefined) {
        throw new StatusError(
          'DIFF responses must specify a diff start timestamp',
          'ERROR_LIST_MISSING_DIFF_TIMESTAMP',
          400
        );
      }
      const t = await this.storage.createTransaction('READONLY');
      const operations: Array<OfferPatch> = [];
      // Check to see if there are any offers at the starting time. If there
      // aren't any, start the diff with a 'clear' operation to make it clear
      // we're sending the entire list of offers.
      const hasOldOffers = await hasContents(
        this.storage.getOffersAtTime(
          t,
          this.hostOrgUrl,
          orgUrl,
          payload.diffStartTimestampUTC!,
          0,
          1
        )
      );
      if (!hasOldOffers) {
        if (skipCount === 0) {
          operations.push('clear');
        } else {
          skipCount--;
        }
      }
      // Find all the change operations.
      const offerIterable = this.storage.getChangedOffers(
        t,
        this.hostOrgUrl,
        orgUrl,
        payload.diffStartTimestampUTC!,
        requestTimeUTC,
        skipCount
      );
      const iterator: AsyncIterator<OfferVersionPair> =
        offerIterable[Symbol.asyncIterator]();
      let result;
      while (
        operations.length < pageSize &&
        (result = await iterator.next()) &&
        !result.done
      ) {
        const versionPair = result.value;
        const jsonPatch = diffAsOfferPatch(
          versionPair.newVersion,
          versionPair.oldVersion
        );
        operations.push(jsonPatch);
      }
      let pageToken;
      if (result && !result.done) {
        pageToken = this.encodePageToken({
          maxResultsPerPage: pageSize,
          requestTimeUTC: requestTimeUTC,
          skipCount: skipCount + operations.length,
        } as DecodedListPageToken);
      }
      return {
        responseFormat: 'DIFF',
        resultsTimestampUTC: requestTimeUTC,
        diff: operations,
        nextPageToken: pageToken,
      } as ListOffersResponse;
    }
  }

  private getCorpusOfferLookup(
    orgUrl: string,
    transaction?: Transaction
  ): OfferLookup {
    return {
      get: async (offerId: OfferId) => {
        const sid = asStructuredId(offerId);
        const t =
          transaction ?? (await this.storage.createTransaction('READONLY'));
        return await this.storage.getOfferFromCorpus(
          t,
          this.hostOrgUrl,
          orgUrl,
          sid.postingOrgUrl,
          sid.id
        );
      },
    } as OfferLookup;
  }

  async processUpdate(
    fromOrgUrl: string,
    update: OfferSetUpdate
  ): Promise<void> {
    const t = await this.storage.createTransaction();
    const lookup = this.getCorpusOfferLookup(fromOrgUrl, t);
    const now = this.clock.now();
    if (update.delta) {
      for await (const op of update.delta) {
        const result = await applyOfferPatch(lookup, op);
        switch (result.type) {
          case 'CLEAR': {
            for await (const offer of this.storage.getCorpusOffers(
              t,
              this.hostOrgUrl,
              fromOrgUrl
            )) {
              const deleteType = await this.storage.deleteOfferInCorpus(
                t,
                this.hostOrgUrl,
                fromOrgUrl,
                offer.id,
                offer.offeredBy!
              );
              // Check to make sure this is an actual delete. Deleting from a
              // corpus might not delete the offer if it is available in some
              // other corpus.
              if (deleteType === 'DELETE') {
                await this.deleteFutureListings(t, offer, now);
                await this.fireEvent({
                  type: 'DELETE',
                  oldValue: offer,
                  timestampUTC: now,
                });
              }
            }
            break;
          }
          case 'DELETE': {
            const deleteType = await this.storage.deleteOfferInCorpus(
              t,
              this.hostOrgUrl,
              fromOrgUrl,
              result.oldOffer!.id,
              result.oldOffer!.offeredBy!
            );
            // Check to make sure this is an actual delete. Deleting from a
            // corpus might not delete the offer if it is available in some
            // other corpus.
            if (deleteType === 'DELETE') {
              await this.deleteFutureListings(t, result.oldOffer!, now);
              await this.fireEvent({
                type: 'DELETE',
                oldValue: result.oldOffer,
                timestampUTC: now,
              });
            }
            break;
          }
          case 'ERROR': {
            this.logger.error('Error applying op', op, result.error);
            break;
          }
          case 'UPDATE':
          case 'INSERT': {
            const updateType = await this.storage.insertOrUpdateOfferInCorpus(
              t,
              this.hostOrgUrl,
              fromOrgUrl,
              result.newOffer!
            );
            if (updateType !== 'NONE') {
              await this.updateListings(t, result.newOffer!, now);
              await this.fireEvent({
                type: updateType,
                oldValue: result.oldOffer,
                newValue: result.newOffer,
                timestampUTC: now,
              });
            }
            break;
          }
          case 'NOOP': {
            // Do nothing
            break;
          }
        }
      }
      await t.commit();
    } else if (update.offers) {
      const offerIds: Set<string> = new Set();
      for await (const offer of update.offers) {
        offerIds.add(idToUrl(offer, true));
        const oldOffer = await lookup.get(offer);
        const updateType = await this.storage.insertOrUpdateOfferInCorpus(
          t,
          this.hostOrgUrl,
          fromOrgUrl,
          offer
        );
        if (updateType !== 'NONE') {
          await this.updateListings(t, offer, now);
          await this.fireEvent({
            type: updateType,
            oldValue: oldOffer,
            newValue: offer,
            timestampUTC: update.updateCurrentAsOfTimestampUTC,
          });
        }
      }
      for await (const offer of this.storage.getCorpusOffers(
        t,
        this.hostOrgUrl,
        fromOrgUrl
      )) {
        if (!offerIds.has(idToUrl(offer, true))) {
          const deleteType = await this.storage.deleteOfferInCorpus(
            t,
            this.hostOrgUrl,
            fromOrgUrl,
            offer!.id,
            offer!.offeredBy!
          );
          // Check to make sure this is an actual delete. Deleting from a
          // corpus might not delete the offer if it is available in some
          // other corpus.
          if (deleteType === 'DELETE') {
            await this.deleteFutureListings(t, offer, now);
            await this.fireEvent({
              type: 'DELETE',
              oldValue: offer,
              timestampUTC: update.updateCurrentAsOfTimestampUTC,
            });
          }
        }
      }
      await t.commit();
    } else {
      await t.fail();
      throw new StatusError(
        'Update specifies neither offers nor diff',
        'ERROR_BAD_UPDATE_NO_CHANGES',
        400
      );
    }
  }

  private async updateListings(
    t: Transaction,
    offer: Offer,
    timestampUTC: number
  ): Promise<void> {
    // We need to find any stored reservation to use when generating timeline
    // entries. To find the reservation, we grab the first timeline entry that
    // overlaps the current instant. We only need the first, because if there's
    // an active reservation, there will be exactly one timeline entry at the
    // current instant.
    const reservationCandidate = await asyncIterableFirst(
      this.storage.getTimelineForOffer(
        t,
        this.hostOrgUrl,
        offer.id,
        offer.offeredBy!,
        {
          startTimeUTC: timestampUTC,
          endTimeUTC: timestampUTC + 1,
        }
      )
    );
    const storedReservation =
      reservationCandidate && reservationCandidate.isReservation
        ? reservationCandidate
        : undefined;
    await this.deleteFutureListings(t, offer, timestampUTC);
    await this.storage.addTimelineEntries(
      t,
      this.hostOrgUrl,
      appendAsyncIterables(
        this.getLocalTimelineEntries(t, offer, timestampUTC),
        this.getRemoteTimelineEntries(t, offer, timestampUTC, storedReservation)
      )
    );
  }

  private async *getLocalTimelineEntries(
    t: Transaction,
    offer: Offer,
    timestampUTC: number
  ): AsyncIterable<TimelineEntry> {
    const sid = asVersionedStructuredId(offer);
    const acceptChain = await this.storage.getBestAcceptChain(
      t,
      this.hostOrgUrl,
      sid.id,
      sid.postingOrgUrl
    );
    const offerIsFromAnotherHost = offer.offeredBy! !== this.hostOrgUrl;
    if (offerIsFromAnotherHost) {
      const entry = {
        targetOrganizationUrl: this.hostOrgUrl,
        offerId: sid.id,
        postingOrgUrl: sid.postingOrgUrl,
        offerUpdateTimestampUTC: sid.lastUpdateTimeUTC,
        startTimeUTC: timestampUTC,
        endTimeUTC: offer.offerExpirationUTC,
        isReservation: false,
        reshareChain: acceptChain,
      };
      yield entry;
    }
  }

  private async *getRemoteTimelineEntries(
    t: Transaction,
    offer: Offer,
    timestampUTC: number,
    storedReservation?: TimelineEntry
  ): AsyncIterable<TimelineEntry> {
    const sid = asVersionedStructuredId(offer);
    const offerIsFromAnotherHost = sid.postingOrgUrl !== this.hostOrgUrl;

    // Calculate the reshare chain. This is done by extending a chain from an
    // initial root, so first we fetch the correct reshare chain root.
    let reshareChainRoot = await this.storage.getBestReshareChainRoot(
      t,
      this.hostOrgUrl,
      sid.id,
      sid.postingOrgUrl
    );
    if (!offerIsFromAnotherHost) {
      // If the offer originated with this host, this host is responsible for
      // building the first link of the reshare chain. The reshare chain root
      // is an empty array.
      reshareChainRoot = [];
    }

    // If there's no reshare chain root defined at this point, this offer must
    // be from another server, and that server never provided a valid reshare
    // chain. If that's the case, we're not allowed to generate any listings for
    // this offer, so we bail from this function.
    if (reshareChainRoot === undefined) {
      return;
    }

    const rejections = new Set(
      await this.storage.getAllRejections(
        t,
        this.hostOrgUrl,
        sid.id,
        sid.postingOrgUrl
      )
    );
    // Find the first time we ever listed this offer. This is a required
    // piece of information for listing generation.
    const firstListingEntry = await asyncIterableFirst(
      this.storage.getTimelineForOffer(
        t,
        this.hostOrgUrl,
        sid.id,
        sid.postingOrgUrl
      )
    );
    const firstListingTime = firstListingEntry?.startTimeUTC ?? timestampUTC;
    let listings = await this.listingPolicy.getListings(
      offer,
      firstListingTime,
      timestampUTC,
      rejections,
      // NOTE: We're not using the sharedBy set right now - it's okay to reshare
      // to an organization that has shared an offer to us.
      new Set()
    );
    // Make sure no rejected orgs snuck through.
    listings = listings.filter(listing => !rejections.has(listing.orgUrl));

    // If there's a reservation held on the current offer, we need to
    // determine whether the organization that currently holds the reservation
    // still has an active listing. If it does, we create a new timeline entry
    // for the new version of the reservation.
    let newReservationEntry: TimelineEntry | undefined;
    // Pre-process the listings and search for a new reservation interval.
    for (const listing of listings) {
      // Trim the listing so that it's earliest start time is the current
      // timestamp.
      const newInterval = trim(listing, {startAt: timestampUTC});
      if (newInterval) {
        updateInterval(listing, newInterval);
      }

      // If there's a live reservation for the offer and the current listing is
      // from the reserving organization...
      if (
        storedReservation &&
        storedReservation.targetOrganizationUrl === listing.orgUrl
      ) {
        // See if the current listing intersects the current reservation.
        const intersection = intersect(storedReservation, listing);
        // If there is an intersection and the intersection begins at the
        // current timestamp, we've found a continuous, uninterrupted listing
        // that can be used to extend the current reservation.
        if (intersection && intersection.startTimeUTC === timestampUTC) {
          newReservationEntry = {
            targetOrganizationUrl: listing.orgUrl,
            offerId: sid.id,
            postingOrgUrl: sid.postingOrgUrl,
            offerUpdateTimestampUTC: sid.lastUpdateTimeUTC,
            startTimeUTC: listing.startTimeUTC,
            endTimeUTC: intersection.endTimeUTC,
            isReservation: true,
            reshareChain: await this.getReshareChainForOfferListing(
              offer,
              listing,
              reshareChainRoot
            ),
          };
          yield newReservationEntry;
        }
      }
    }

    for (const listing of listings) {
      // We subtract the new reservation entry (if it exists) from all listing
      // intervals so that the reservation entry is the only entry for this
      // offer in its time slot.
      const newIntervals = subtract(listing, newReservationEntry);
      for (const newInterval of newIntervals) {
        const entry = {
          targetOrganizationUrl: listing.orgUrl,
          offerId: sid.id,
          postingOrgUrl: sid.postingOrgUrl,
          offerUpdateTimestampUTC: sid.lastUpdateTimeUTC,
          startTimeUTC: newInterval.startTimeUTC,
          endTimeUTC: newInterval.endTimeUTC,
          isReservation: false,
          reshareChain: await this.getReshareChainForOfferListing(
            offer,
            listing,
            reshareChainRoot
          ),
        };
        yield entry;
      }
    }
  }

  private async getReshareChainForOfferListing(
    offer: Offer,
    listing: Listing,
    reshareChainRoot: ReshareChain
  ): Promise<ReshareChain | undefined> {
    // If no signer is configured, resharing is disabled.
    if (!this.signer) {
      return undefined;
    }
    // Figure out whether a reshare chain is required. We don't want to
    // provide reshare chains that only have a single link with the ACCEPT
    // permission; that's equivalent to no reshare chain at all.

    // If the offer is from another server, it has to have a reshare chain
    // to be shown to other servers. Also, if the offer is from _any_ server
    // and the listing specifies the RESHARE scope, it has to have a reshare
    // chain.
    const offerIsFromAnotherHost = offer.offeredBy! !== this.hostOrgUrl;
    if (offerIsFromAnotherHost || isReshareListing(listing)) {
      const scopes = listing.scopes || ['ACCEPT'];
      return await this.signer.signChain(reshareChainRoot, listing.orgUrl, {
        scopes: scopes,
        initialEntitlement: offer.id,
      });
    }
    return undefined;
  }

  private async deleteFutureListings(
    t: Transaction,
    offerId: OfferId,
    timestampUTC: number
  ): Promise<void> {
    const sid = asStructuredId(offerId);
    await this.storage.truncateFutureTimelineForOffer(
      t,
      this.hostOrgUrl,
      sid.id,
      sid.postingOrgUrl,
      timestampUTC
    );
  }

  async accept(
    offerId: string,
    orgUrl: string,
    ifNotNewerThanTimestampUTC?: number | undefined,
    decodedReshareChain?: DecodedReshareChain | undefined
  ): Promise<AcceptOfferResponse> {
    const now = this.clock.now();
    const t = await this.storage.createTransaction();
    const currentOffer = await this.storage.getOfferAtTime(
      t,
      this.hostOrgUrl,
      orgUrl,
      offerId,
      this.hostOrgUrl,
      now
    );
    if (!currentOffer) {
      throw new StatusError(
        `No offer with id ${offerId} is available to accept`,
        'ACCEPT_ERROR_NO_AVAILABLE_OFFER',
        400
      );
    }
    const offerUpdateTimestampUTC = getUpdateTimestamp(currentOffer);
    if (ifNotNewerThanTimestampUTC !== undefined) {
      if (offerUpdateTimestampUTC > ifNotNewerThanTimestampUTC) {
        throw new StatusError(
          `Offer with id ${offerId} has been updated ` +
            `since ${ifNotNewerThanTimestampUTC}`,
          'ACCEPT_ERROR_OFFER_HAS_CHANGED',
          400,
          {
            currentOffer: currentOffer,
          }
        );
      }
    }

    await this.storage.writeAccept(
      t,
      this.hostOrgUrl,
      orgUrl,
      offerId,
      offerUpdateTimestampUTC,
      now,
      decodedReshareChain
    );
    await this.storage.truncateFutureTimelineForOffer(
      t,
      this.hostOrgUrl,
      offerId,
      this.hostOrgUrl,
      now
    );
    await t.commit();
    return {
      offer: currentOffer,
    };
  }

  async reject(
    rejectingOrgUrl: string,
    offerId: string,
    postingOrgUrl?: string | undefined
  ): Promise<RejectOfferResponse> {
    const now = this.clock.now();
    const t = await this.storage.createTransaction();
    const currentOffer = await this.storage.getOfferAtTime(
      t,
      this.hostOrgUrl,
      rejectingOrgUrl,
      offerId,
      postingOrgUrl ?? this.hostOrgUrl,
      now
    );
    if (!currentOffer) {
      throw new StatusError(
        `No offer with id ${offerId} is available to reject`,
        'REJECT_ERROR_NO_AVAILABLE_OFFER',
        400
      );
    }
    await this.storage.writeReject(
      t,
      this.hostOrgUrl,
      rejectingOrgUrl,
      offerId,
      postingOrgUrl ?? this.hostOrgUrl,
      now
    );
    await this.updateListings(t, currentOffer, now);
    await t.commit();
    return {
      offer: currentOffer,
    };
  }

  async reserve(
    offerId: string,
    requestedReservationSecs: number,
    orgUrl: string
  ): Promise<ReserveOfferResponse> {
    const now = this.clock.now();
    const t = await this.storage.createTransaction();
    const currentOffer = await this.storage.getOfferAtTime(
      t,
      this.hostOrgUrl,
      orgUrl,
      offerId,
      this.hostOrgUrl,
      now
    );
    if (!currentOffer) {
      throw new StatusError(
        `No offer with id ${offerId} is available to accept`,
        'RESERVE_ERROR_NO_AVAILABLE_OFFER',
        400
      );
    }
    const reservationLengthMillis = Math.min(
      currentOffer.maxReservationTimeSecs
        ? currentOffer.maxReservationTimeSecs * 1000
        : Number.MAX_SAFE_INTEGER,
      requestedReservationSecs * 1000
    );
    const reservationEndTimeUTC = now + reservationLengthMillis;
    await this.storage.truncateFutureTimelineForOffer(
      t,
      this.hostOrgUrl,
      offerId,
      this.hostOrgUrl,
      now
    );
    await this.storage.addTimelineEntries(
      t,
      this.hostOrgUrl,
      iterableToAsync([
        {
          targetOrganizationUrl: orgUrl,
          offerId: offerId,
          postingOrgUrl: this.hostOrgUrl,
          offerUpdateTimestampUTC: getUpdateTimestamp(currentOffer),
          startTimeUTC: now,
          endTimeUTC: reservationEndTimeUTC,
          isReservation: true,
          reshareChain: currentOffer.reshareChain,
        } as TimelineEntry,
      ])
    );
    await this.updateListings(t, currentOffer, now);
    await t.commit();
    return {
      offer: currentOffer,
      reservationExpirationUTC: reservationEndTimeUTC,
    };
  }

  async getHistory(
    orgUrl: string,
    payload: HistoryPayload
  ): Promise<HistoryResponse> {
    const decodedPageToken = payload.pageToken
      ? await this.decodePageToken<DecodedHistoryPageToken>(payload.pageToken)
      : undefined;
    const pageSize =
      decodedPageToken?.maxResultsPerPage ??
      Math.min(this.maxPageSize, payload.maxResultsPerPage ?? this.maxPageSize);
    const historySinceUTC =
      decodedPageToken?.historySinceUTC ?? payload.historySinceUTC;
    const skipCount = decodedPageToken?.skipCount ?? 0;
    const t = await this.storage.createTransaction('READONLY');
    const historyIterable = this.storage.getHistory(
      t,
      this.hostOrgUrl,
      orgUrl,
      historySinceUTC,
      skipCount
    );
    const iterator: AsyncIterator<OfferHistory> =
      historyIterable[Symbol.asyncIterator]();
    let result;
    const items: OfferHistory[] = [];
    while (
      items.length < pageSize &&
      (result = await iterator.next()) &&
      !result.done
    ) {
      items.push(result.value);
    }
    let pageToken;
    if (result && !result.done) {
      pageToken = this.encodePageToken({
        maxResultsPerPage: pageSize,
        historySinceUTC: historySinceUTC,
        skipCount: skipCount + items.length,
      } as DecodedHistoryPageToken);
    }
    return {
      offerHistories: items,
      nextPageToken: pageToken,
    } as HistoryResponse;
  }

  private async fireEvent(change: OfferChange): Promise<void> {
    try {
      await Promise.all(
        this.changeHandlers.map(handlerFn => handlerFn(change))
      );
    } catch (e) {
      this.logger.error('Error in change handler', e);
    }
  }

  registerChangeHandler(
    handlerFn: (change: OfferChange) => Promise<void>
  ): HandlerRegistration {
    this.changeHandlers.push(handlerFn);
    return new PersistentOfferModelHandlerRegistration(
      handlerFn,
      this.changeHandlers
    );
  }

  async getAllOffers(): Promise<Offer[]> {
    const t = await this.storage.createTransaction('READONLY');
    return await asyncIterableToArray(
      this.storage.getOffersAtTime(
        t,
        this.hostOrgUrl,
        this.hostOrgUrl,
        this.clock.now()
      )
    );
  }
}

class PersistentOfferModelHandlerRegistration implements HandlerRegistration {
  private changeHandlers: Array<(change: OfferChange) => Promise<void>>;
  private handler: (change: OfferChange) => Promise<void>;

  constructor(
    handler: (change: OfferChange) => Promise<void>,
    changeHandlers: Array<(change: OfferChange) => Promise<void>>
  ) {
    this.changeHandlers = changeHandlers;
    this.handler = handler;
  }

  remove(): void {
    const index = this.changeHandlers.indexOf(this.handler);
    this.changeHandlers.splice(index, 1);
  }
}

interface PersistentOfferModelOptions {
  storage: PersistentStorage;
  hostOrgUrl: string;
  listingPolicy: OfferListingPolicy;
  signer?: Signer;
  clock?: Clock;
  maxPageSize?: number;
  logger?: Logger;
}

interface DecodedListPageToken {
  skipCount: number;
  resultFormat: ListFormat;
  requestTimeUTC: number;
  diffStartTimeUTC?: number;
  maxResultsPerPage: number;
}

interface DecodedHistoryPageToken {
  skipCount: number;
  historySinceUTC?: number;
  maxResultsPerPage: number;
}
