/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ListOffersPayload} from 'opr-models';
import {Clock, DefaultClock, OprClient, StatusError} from '../coreapi';
import {OfferProducer, OfferSetUpdate} from './offerproducer';
import {log, Logger} from '../util/loglevel';

export class OprFeedProducer implements OfferProducer {
  private client: OprClient;
  private organizationUrl: string;
  private clock: Clock;
  private pollFrequencyMillis: number;
  private logger: Logger;
  readonly id: string;

  constructor(
    client: OprClient,
    organizationUrl: string,
    pollFrequencyMillis = 10 * 60 * 1000 /* 10 minutes */,
    clock = new DefaultClock(),
    logger = log.getLogger(`feed:${organizationUrl}`)
  ) {
    this.client = client;
    this.organizationUrl = organizationUrl;
    this.id = 'feed:' + organizationUrl;
    this.clock = clock;
    this.pollFrequencyMillis = pollFrequencyMillis;
    this.logger = logger;
  }

  async produceOffers(request: ListOffersPayload): Promise<OfferSetUpdate> {
    // TODO: Implement paging on the response.
    let offers, diff, result;
    let pageToken;
    do {
      this.logger.info('Calling list/ of', this.organizationUrl);
      result = await this.client.list(this.organizationUrl, {
        ...request,
        pageToken: pageToken,
      });
      if ((result.offers && diff) || (result.diff && offers)) {
        throw new StatusError(
          'Illegal producer response, ' +
            'paged response was answered in multiple formats',
          'PRODUCER_ILLEGAL_RESPONSE_PAGES_INCONSISTENT',
          500
        );
      }
      if (result.offers) {
        if (!offers) {
          offers = [];
        }
        offers.push(...result.offers);
      }
      if (result.diff) {
        if (!diff) {
          diff = [];
        }
        diff.push(...result.diff);
      }
      pageToken = result.nextPageToken;
    } while (pageToken);
    const now = this.clock.now();
    const updateResult = {
      offers: result.offers,
      sourceOrgUrl: this.organizationUrl,
      delta: result.diff,
      diffStartTimeUTC: request.diffStartTimestampUTC,
      updateCurrentAsOfTimestampUTC: result.resultsTimestampUTC,
      earliestNextRequestUTC: now + this.pollFrequencyMillis,
    };
    this.logger.info('Returning update result', updateResult);
    return updateResult;
  }
}
