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

import {expect, config} from 'chai';
import {
  Clock,
  diff,
  FakeClock,
  FakeListingPolicy,
  Listing,
  LocalKeySigner,
  OfferChange,
  OfferListingPolicy,
  OfferModel,
  OfferProducerMetadata,
  OfferSetUpdate,
  Signer,
  UniversalAcceptListingPolicy,
} from 'opr-core';
import {ResolverOptions, SourcedJsonObject, TestConfig} from 'opr-devtools';
import {
  DecodedReshareChain,
  HistoryPayload,
  ListOffersPayload,
} from 'opr-models';
import path from 'path';
import {EncodeChainDirective} from '../json/encodechaindirective';
import {ModelDirective} from '../json/modeldirective';

// Show the entire mismatched object on error.
config.truncateThreshold = 0;

interface SqlTestObjects {
  readonly clock: FakeClock;
  readonly signer: LocalKeySigner;
  readonly listingPolicy: FakeListingPolicy;
  readonly model: OfferModel;
}

export type ModelBuilderFn = (
  context: SourcedJsonObject,
  listingPolicy: OfferListingPolicy,
  clock: Clock,
  signer: Signer,
  hostOrgUrl: string
) => Promise<OfferModel>;

export class OfferModelTestConfig implements TestConfig<SqlTestObjects> {
  readonly name: string;
  readonly cwd: string;
  readonly resolverOptions?: ResolverOptions | undefined;
  readonly pathGlob: string;
  private modelBuilderFn: ModelBuilderFn;

  constructor(modelBuilderFn: ModelBuilderFn, name = 'OfferModel Tests') {
    this.cwd = path.resolve(__dirname, '../../datatests');
    this.name = name;
    this.pathGlob = 'offermodel/**.test.json';
    this.modelBuilderFn = modelBuilderFn;
    this.resolverOptions = {
      installDirectives: [new ModelDirective(), new EncodeChainDirective()],
    };
  }

  async teardownTestObject(testObject: SqlTestObjects): Promise<void> {
    await testObject.model.shutdown();
  }

  async buildTestObject(context: SourcedJsonObject): Promise<SqlTestObjects> {
    const hostOrgUrl = context.propAsString('currentOrg').req();
    const listingOrgs = context.propAsArray('listingOrgs').get() || [];
    const clock = new FakeClock();
    clock.setTime(0);
    const signer = new LocalKeySigner(
      'https://www.fakeorg.org/org.json',
      {
        kty: 'EC',
        crv: 'P-256',
        x: 'rSGY_zAh5_OKYo7lQBWsObKb7zFFUDyn35dKIdu-PS4',
        y: 'Nq71ySDD1FfS0ui_cBZcdeqZmVNc-ChKe_KcnmyZvpM',
        d: 'z-gEONqok13ltcWCAcBnb3mRuPOUegpBTyYDkxdhuN0',
        alg: 'ES256',
      },
      clock
    );
    const listingPolicy = new FakeListingPolicy(
      new UniversalAcceptListingPolicy(listingOrgs as Array<string>)
    );
    const model = await this.modelBuilderFn(
      context,
      listingPolicy,
      clock,
      signer,
      hostOrgUrl
    );
    await model.initialize();
    return {
      clock: clock,
      signer: signer,
      listingPolicy: listingPolicy,
      model: model,
    };
  }

  async applyOperation(
    testObject: SqlTestObjects,
    context: SourcedJsonObject
  ): Promise<Record<string, unknown>> {
    const time = context.propAsNumber('time').get();
    if (context.prop('expects').isSet()) {
      throw new Error('Expects is not supported');
    }
    if (time !== undefined) {
      testObject.clock.setTime(time);
    }
    const changes = [] as Array<OfferChange>;
    const handlerReg = testObject.model.registerChangeHandler(async change => {
      changes.push(change);
    });
    const op = context.propAsString('op').req();
    const resultInfo = {} as Record<string, unknown>;
    resultInfo.changes = changes;
    switch (op) {
      case 'UPDATE': {
        const producerId = context.propAsString('producerId').req();
        testObject.listingPolicy.clearListings();
        const listings = context.propAsObject('listings').get();
        if (listings) {
          testObject.listingPolicy.setListings(
            listings as unknown as Record<string, Listing[]>
          );
        }
        const updateParam = context.propAsObject('param').req();
        const result = await testObject.model.processUpdate(
          producerId,
          updateParam as unknown as OfferSetUpdate
        );
        resultInfo.result = result;
        break;
      }
      case 'LIST': {
        const orgUrl = context.propAsString('orgUrl').req();
        const payload: ListOffersPayload = context
          .propAsObject('payload')
          .req();
        const listResult = await testObject.model.list(orgUrl, payload);
        const offers = listResult.offers;
        const offerSet = offers ? diff.toOfferSet(offers) : undefined;
        const expectDiff = context.propAsArray('expectDiff').get();
        if (expectDiff) {
          expect(listResult.diff, 'Expected diff, but no diff in response').to
            .not.be.undefined;
          expect(listResult.diff, 'Unexpected diff contents').to.deep.equal(
            expectDiff
          );
        }
        resultInfo.result = listResult;
        resultInfo.offers = offers;
        resultInfo.offerSet = offerSet;
        break;
      }
      case 'ACCEPT': {
        const offerId = context.propAsString('offerId').req();
        const orgUrl = context.propAsString('orgUrl').req();
        const ifNoNewerThanTimestampUTC = context
          .propAsNumber('ifNoNewerThanTimestampUTC')
          .get();
        const decodedReshareChain: DecodedReshareChain | undefined = context
          .propAsArray('decodedReshareChain')
          .get();
        const result = await testObject.model.accept(
          offerId,
          orgUrl,
          ifNoNewerThanTimestampUTC,
          decodedReshareChain
        );
        resultInfo.result = result;
        break;
      }
      case 'HISTORY': {
        const orgUrl = context.propAsString('orgUrl').req();
        const payload = context.propAsObject('payload').req() as HistoryPayload;
        const result = await testObject.model.getHistory(orgUrl, payload);
        resultInfo.result = result;
        break;
      }
      case 'RESERVE': {
        const orgUrl = context.propAsString('orgUrl').req();
        const offerId = context.propAsString('offerId').req();
        const reservationSecs = context
          .propAsNumber('requestedReservationSecs')
          .req();
        const result = await testObject.model.reserve(
          offerId,
          reservationSecs,
          orgUrl
        );
        resultInfo.result = result;
        break;
      }
      case 'REJECT': {
        const orgUrl = context.propAsString('orgUrl').req();
        const offerId = context.propAsString('offerId').req();
        const offeredByUrl = context.propAsString('offeredByUrl').get();
        const result = await testObject.model.reject(
          orgUrl,
          offerId,
          offeredByUrl
        );
        resultInfo.result = result;
        break;
      }
      case 'READPRODUCERMETADATA': {
        const organizationUrl = context.propAsString('organizationUrl').req();
        const result = await testObject.model.getOfferProducerMetadata(
          organizationUrl
        );
        resultInfo.result = result;
        break;
      }
      case 'WRITEPRODUCERMETADATA': {
        const metadata: OfferProducerMetadata = context
          .propAsObject('metadata')
          .req();
        await testObject.model.writeOfferProducerMetadata(metadata);
        break;
      }
      default: {
        expect.fail('Unknown op ' + op);
      }
    }
    handlerReg.remove();
    return resultInfo;
  }
}
