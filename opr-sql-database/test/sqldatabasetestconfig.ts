/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {expect} from 'chai';
import {
  diff,
  FakeClock,
  FakeListingPolicy,
  Listing,
  LocalKeySigner,
  OfferChange,
  OfferProducerMetadata,
  OfferSetUpdate,
  UniversalAcceptListingPolicy,
} from 'opr-core';
import {
  $,
  Directive,
  Resolver,
  ResolverOptions,
  SourcedJsonObject,
  SourcedJsonValue,
  TestConfig,
} from 'opr-devtools';
import {DecodedReshareChain, ListOffersPayload} from 'opr-models';
import {DataSourceOptions, SqlOprDatabase} from '../src/sqloprdatabase';
import {examples} from 'opr-models';

interface SqlTestObjects {
  readonly clock: FakeClock;
  readonly signer: LocalKeySigner;
  readonly listingPolicy: FakeListingPolicy;
  readonly db: SqlOprDatabase;
}

class ModelDirective implements Directive {
  accept(key: string): boolean {
    return key === '$model';
  }

  async transform(
    resolver: Resolver,
    obj: SourcedJsonValue,
    key: string,
    value: SourcedJsonValue
  ): Promise<SourcedJsonValue> {
    value.assertIsString();
    const name = value.value;
    return $((examples as Record<string, unknown>)[name]);
  }
}

export class SqlDatabaseTestConfig implements TestConfig<SqlTestObjects> {
  readonly name: string;
  readonly cwd: string;
  private dsOptions: DataSourceOptions;
  readonly resolverOptions?: ResolverOptions | undefined;

  constructor(cwd: string, dsOptions: DataSourceOptions, name = 'SQL Tests') {
    this.cwd = cwd;
    this.name = name;
    this.dsOptions = dsOptions;
    this.resolverOptions = {
      installDirectives: [new ModelDirective()],
    };
  }

  protected getDsOptions(): DataSourceOptions {
    return {...this.dsOptions};
  }

  async teardownTestObject(testObject: SqlTestObjects): Promise<void> {
    await testObject.db.shutdown();
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
    const db = new SqlOprDatabase({
      dsOptions: this.getDsOptions(),
      listingPolicy: listingPolicy,
      clock: clock,
      signer: signer,
      hostOrgUrl: hostOrgUrl,
      enableInternalChecks: true,
    });
    await db.initialize();
    return {
      clock: clock,
      signer: signer,
      listingPolicy: listingPolicy,
      db: db,
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
    const handlerReg = testObject.db.registerChangeHandler(async change => {
      changes.push(change);
    });
    const op = context.propAsString('op').req();
    const resultInfo = {} as Record<string, unknown>;
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
        const result = await testObject.db.processUpdate(
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
        const listResult = await testObject.db.list(orgUrl, payload);
        const offers = listResult.offers;
        const offerSet = offers ? diff.toOfferSet(offers) : undefined;
        const expectDiff = context.propAsArray('expectDiff').get();
        if (expectDiff) {
          expect(listResult.diff, 'Expected diff, but no diff in response').to
            .not.be.undefined;
          expect(listResult.diff).to.deep.equal(expectDiff);
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
        const result = await testObject.db.accept(
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
        const sinceTimestampUTC = context
          .propAsNumber('sinceTimestampUTC')
          .get();
        const result = await testObject.db.getHistory(
          orgUrl,
          sinceTimestampUTC
        );
        resultInfo.result = result;
        break;
      }
      case 'RESERVE': {
        const orgUrl = context.propAsString('orgUrl').req();
        const offerId = context.propAsString('offerId').req();
        const reservationSecs = context
          .propAsNumber('requestedReservationSecs')
          .req();
        const result = await testObject.db.reserve(
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
        const result = await testObject.db.reject(
          orgUrl,
          offerId,
          offeredByUrl
        );
        resultInfo.result = result;
        break;
      }
      case 'LOCK': {
        const producerId = context.propAsString('producerId').req();
        const result = await testObject.db.lockProducer(producerId);
        resultInfo.result = result;
        break;
      }
      case 'UNLOCK': {
        const metadata: OfferProducerMetadata = context
          .propAsObject('metadata')
          .req();
        await testObject.db.unlockProducer(metadata);
        break;
      }
      case 'DUMP': {
        /** Dumps a table contents for debugging. */
        const tablename = context.propAsString('table').req();
        await testObject.db.dumpTable(tablename);
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
