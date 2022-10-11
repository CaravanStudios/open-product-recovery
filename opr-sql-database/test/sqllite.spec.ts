/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import 'mocha';
import {expect} from 'chai';
import {DataDrivenTest} from 'opr-devtools';
import {SqlDatabaseTestConfig} from './sqldatabasetestconfig';

const driver = new DataDrivenTest(
  new SqlDatabaseTestConfig(
    __dirname,
    {
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      dropSchema: true,
    },
    'SQLite SQL Tests'
  )
);
driver.initialize();
