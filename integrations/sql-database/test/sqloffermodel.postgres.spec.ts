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

import 'mocha';
import {DataDrivenTest, SourcedJsonObject} from 'opr-devtools';
import {Clock, OfferListingPolicy, OfferModel, Signer} from 'opr-core';
import {OfferModelTestConfig} from 'opr-core-testutil';
import {PostgresTestingLauncher} from '../src/postgrestestinglauncher';
import {SqlOfferModel} from '../src/sqloffermodel';
import {DataSourceOptions} from 'typeorm';
import {PostgresConnectionOptions} from 'typeorm/driver/postgres/PostgresConnectionOptions';

// Uncomment to enable detailed logging during tests
// log.setLevel('TRACE');

class PostgresTestConfig extends OfferModelTestConfig {
  private psLauncher: PostgresTestingLauncher;
  private dsOptions: DataSourceOptions;

  constructor(
    dsOptions: DataSourceOptions,
    psLauncher: PostgresTestingLauncher
  ) {
    super(
      (context, listingPolicy, clock, signer, hostOrgUrl) =>
        this.createModel(context, listingPolicy, clock, signer, hostOrgUrl),
      'Postgres SQL Tests'
    );
    this.psLauncher = psLauncher;
    this.dsOptions = dsOptions;
  }

  private async createModel(
    context: SourcedJsonObject,
    listingPolicy: OfferListingPolicy,
    clock: Clock,
    signer: Signer,
    hostOrgUrl: string
  ): Promise<OfferModel> {
    return new SqlOfferModel({
      listingPolicy: listingPolicy,
      clock: clock,
      signer: signer,
      hostOrgUrl: hostOrgUrl,
      dsOptions: this.getDsOptions(),
    });
  }

  protected getDsOptions(): PostgresConnectionOptions {
    return {
      ...this.dsOptions,
      port: this.psLauncher.getPort(),
    } as PostgresConnectionOptions;
  }

  async beforeAllTests(): Promise<void> {
    await this.psLauncher.start();
  }

  async afterAllTests(): Promise<void> {
    await this.psLauncher.shutdown();
  }
}
const pg = new PostgresTestingLauncher();
if (!pg.isPostgresAvailable()) {
  describe('Postgres SQL tests', () => {
    it('is skipped because postgres is not installed', () => {});
  });
} else {
  const driver = new DataDrivenTest(
    new PostgresTestConfig(
      {
        type: 'postgres',
        host: 'localhost',
        synchronize: true,
        dropSchema: true,
        database: 'oprtest',
      } as PostgresConnectionOptions,
      pg
    )
  );
  driver.initialize();
}
