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

import 'mocha';
import {DataDrivenTest} from 'opr-devtools';
import {OfferModelTestConfig} from 'opr-core-testutil';
import {SqlOfferModel} from '../src/sqloffermodel';

// Uncomment to enable detailed logging during tests
//log.setLevel('TRACE');

const driver = new DataDrivenTest(
  new OfferModelTestConfig(
    async (context, listingPolicy, clock, signer, hostOrgUrl) => {
      return new SqlOfferModel({
        listingPolicy: listingPolicy,
        clock: clock,
        signer: signer,
        hostOrgUrl: hostOrgUrl,
        dsOptions: {
          type: 'sqlite',
          database: ':memory:',
          synchronize: true,
          dropSchema: true,
        },
      });
    },
    'SQLite SQL Tests'
  )
);
driver.initialize();
