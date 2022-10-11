/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// This test is meant to be run manually by datadriventest.spec.ts
import 'mocha';
import {expect} from 'chai';
import {DataDrivenTest} from '../../../src/test/datadriventest';
import {ToyConfig} from '../toytestconfig';

const driver = new DataDrivenTest(new ToyConfig(__dirname));
driver.initialize();
