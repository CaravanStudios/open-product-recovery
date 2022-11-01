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

import {expect, config} from 'chai';
import {
  iterableToAsync,
  Interval,
  PersistentStorage,
  TimelineEntry,
} from 'opr-core';
import {ResolverOptions, SourcedJsonObject, TestConfig} from 'opr-devtools';
import {Offer} from 'opr-models';
import {ModelDirective} from '../json/modeldirective';
import {EncodeChainDirective} from '../json/encodechaindirective';
import path = require('path');

// Show the entire mismatched object on error.
config.truncateThreshold = 0;

interface SqlTestObjects {
  readonly db: PersistentStorage;
}

export type DbBuilderFn = (
  context: SourcedJsonObject
) => Promise<PersistentStorage>;

export class PersistentTestConfig implements TestConfig<SqlTestObjects> {
  readonly name: string;
  readonly cwd: string;
  readonly resolverOptions?: ResolverOptions | undefined;
  readonly pathGlob: string;
  private dbBuilderFn: DbBuilderFn;

  constructor(dbBuilderFn: DbBuilderFn, name = 'Persistent Tests') {
    this.cwd = path.resolve(__dirname, '../../datatests');
    this.name = name;
    this.dbBuilderFn = dbBuilderFn;
    this.pathGlob = 'database/**.test.json';
    this.resolverOptions = {
      installDirectives: [new ModelDirective(), new EncodeChainDirective()],
    };
  }

  async teardownTestObject(testObject: SqlTestObjects): Promise<void> {
    await testObject.db.shutdown();
  }

  async buildTestObject(context: SourcedJsonObject): Promise<SqlTestObjects> {
    const db = await this.dbBuilderFn(context);
    await db.initialize();
    return {
      db: db,
    };
  }

  async applyOperation(
    testObject: SqlTestObjects,
    context: SourcedJsonObject
  ): Promise<Record<string, unknown>> {
    const op = context.propAsString('op').req();
    const resultInfo = {
      orgResults: {},
    } as Record<string, unknown>;
    const hostOrgProp = context.prop('hostOrgUrl').get();
    const hostOrgs: string[] = [];
    if (typeof hostOrgProp === 'string') {
      hostOrgs.push(hostOrgProp);
    } else if (Array.isArray(hostOrgProp)) {
      hostOrgs.push(...(hostOrgProp as Array<string>));
    } else {
      throw new Error('Bad value ' + hostOrgProp);
    }
    for (const hostOrgUrl of hostOrgs) {
      const transaction = await testObject.db.createTransaction();
      switch (op) {
        case 'insertOrUpdateOfferInCorpus': {
          const orgUrl = context.propAsString('corpusOrgUrl').req();
          const offer = context.propAsObject('offer').get();
          const result = await testObject.db.insertOrUpdateOfferInCorpus(
            transaction,
            hostOrgUrl,
            orgUrl,
            offer as unknown as Offer
          );
          resultInfo.result = result;
          break;
        }
        case 'deleteOfferInCorpus': {
          const orgUrl = context.propAsString('corpusOrgUrl').req();
          const offerId = context.propAsString('offerId').req();
          const offeringOrgUrl = context.propAsString('postingOrgUrl').req();
          const result = await testObject.db.deleteOfferInCorpus(
            transaction,
            hostOrgUrl,
            orgUrl,
            offerId,
            offeringOrgUrl
          );
          resultInfo.result = result;
          break;
        }
        case 'getCorpusOffers': {
          const orgUrl = context.propAsString('corpusOrgUrl').req();
          const skipCount = context.propAsNumber('skipCount').get();
          const offers: Offer[] = [];
          const offerIterator = testObject.db.getCorpusOffers(
            transaction,
            hostOrgUrl,
            orgUrl,
            skipCount
          );
          for await (const offer of offerIterator) {
            offers.push(offer);
          }
          resultInfo.result = offers;
          break;
        }
        case 'addTimelineEntries': {
          const timelineEntries = context
            .propAsArray('timelineEntries')
            .req() as Array<TimelineEntry>;
          await testObject.db.addTimelineEntries(
            transaction,
            hostOrgUrl,
            iterableToAsync(timelineEntries)
          );
          break;
        }
        case 'getTimelineForOffer': {
          const offerId = context.propAsString('offerId').req();
          const postingOrgUrl = context.propAsString('postingOrgUrl').req();
          const queryInterval = context
            .propAsObject('queryInterval')
            .get() as Interval;
          const targetOrgUrl = context.propAsString('targetOrgUrl').get();
          const timelineEntries: TimelineEntry[] = [];
          const timelineIterator = testObject.db.getTimelineForOffer(
            transaction,
            hostOrgUrl,
            offerId,
            postingOrgUrl,
            queryInterval,
            targetOrgUrl
          );
          for await (const timelineEntry of timelineIterator) {
            timelineEntries.push(timelineEntry);
          }
          resultInfo.result = timelineEntries;
          break;
        }
        case 'truncateFutureTimelineForOffer': {
          const offerId = context.propAsString('offerId').req();
          const postingOrgUrl = context.propAsString('postingOrgUrl').req();
          const timestampUTC = context.propAsNumber('timestampUTC').req();
          await testObject.db.truncateFutureTimelineForOffer(
            transaction,
            hostOrgUrl,
            offerId,
            postingOrgUrl,
            timestampUTC
          );
          break;
        }
        case 'getOffersAtTime': {
          const viewingOrgUrl = context.propAsString('viewingOrgUrl').req();
          const timestampUTC = context.propAsNumber('timestampUTC').req();
          const skipCount = context.propAsNumber('skipCount').get();
          const offerIterator = testObject.db.getOffersAtTime(
            transaction,
            hostOrgUrl,
            viewingOrgUrl,
            timestampUTC,
            skipCount
          );
          const offers: Offer[] = [];
          for await (const offer of offerIterator) {
            offers.push(offer);
          }
          resultInfo.result = offers;
          break;
        }
        case 'getKnownOfferingOrgs': {
          const timestampUTC = context.propAsNumber('sinceTimestampUTC').get();
          const offerIterator = testObject.db.getKnownOfferingOrgs(
            transaction,
            hostOrgUrl,
            timestampUTC
          );
          const orgs: string[] = [];
          for await (const org of offerIterator) {
            orgs.push(org);
          }
          resultInfo.result = orgs;
          break;
        }
        case 'writeReject': {
          const rejectingOrgUrl = context.propAsString('rejectingOrgUrl').req();
          const offerId = context.propAsString('offerId').req();
          const postingOrgUrl = context.propAsString('postingOrgUrl').req();
          const atTimeUTC = context.propAsNumber('atTimeUTC').req();
          resultInfo.result = await testObject.db.writeReject(
            transaction,
            hostOrgUrl,
            rejectingOrgUrl,
            offerId,
            postingOrgUrl,
            atTimeUTC
          );
          break;
        }
        case 'getAllRejections': {
          const offerId = context.propAsString('offerId').req();
          const postingOrgUrl = context.propAsString('postingOrgUrl').req();
          resultInfo.result = await testObject.db.getAllRejections(
            transaction,
            hostOrgUrl,
            offerId,
            postingOrgUrl
          );
          break;
        }
        default: {
          expect.fail('Unknown op ' + op);
        }
      }
      (resultInfo.orgResults as Record<string, unknown>)[hostOrgUrl] =
        resultInfo.result;
      await transaction.commit();
    }
    return resultInfo;
  }
}
