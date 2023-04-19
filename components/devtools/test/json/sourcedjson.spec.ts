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
import {expect} from 'chai';
import * as path from 'path';
import {
  assertIsArray,
  assertIsObject,
  parsePathSync,
  SourcedJsonValue,
} from '../../src/json/sourcedjson';

describe('SourcedJson', () => {
  it('should load', () => {
    const parsedJson: SourcedJsonValue = parsePathSync(
      path.resolve(__dirname, 'testdata/person.json')
    );
    parsedJson.assertIsObject();
    const json = parsedJson.toJson();
    expect(json.name).to.equal('John');
    assertIsObject(json.oldAddress);
    expect(json.oldAddress.$.loc.start.line).to.equal(3);
    expect(json.oldAddress.state).to.equal('USVI');
    expect(json.oldAddress.$.getLoc('state')?.start.line).to.equal(6);
    expect(json.oldAddress.$.getLoc('state')?.isGuess).to.be.not.ok;
    // Assign a value from code
    json.oldAddress.state = 'CA';
    expect(json.oldAddress.state).to.equal('CA');
    expect(json.oldAddress.$.getLoc('state')?.isGuess).to.equal(true);
    expect(json.oldAddress.$.getLoc('state')?.start.line).to.equal(3);

    assertIsObject(json.newAddress);
    // Assign a primitive from source, but in a way that will lose primitive
    // info
    json.oldAddress.state = json.newAddress.state;
    expect(json.oldAddress.state).to.equal('CO');
    expect(json.oldAddress.$.getLoc('state')?.isGuess).to.equal(true);
    expect(json.oldAddress.$.getLoc('state')?.start.line).to.equal(3);

    // Assign a primitive from source with safe primitives
    const safeAddressJson = json.newAddress.$.toJson(true);
    json.oldAddress.state = safeAddressJson.state;
    expect(json.oldAddress.state).to.equal('CO');
    expect(json.oldAddress.$.getLoc('state')?.start.line).to.equal(12);

    assertIsArray(json.friends);
    // Manipulate array safely
    const safeFriendsJson = json.friends.$.toJson(true);
    safeFriendsJson.sort((a: any, b: any) =>
      a.value.localeCompare(b.value.localeCompare)
    );
    expect(json.friends).to.deep.equal(['Alex', 'Cesar', 'Kevin']);
    expect(json.friends.$.getLoc(0)?.isGuess).to.be.not.ok;
    expect(json.friends.$.getLoc(0)?.start.line).to.equal(16);
    expect(json.friends.$.getLoc(1)?.start.line).to.equal(16);
    expect(json.friends.$.getLoc(2)?.start.line).to.equal(16);

    // Manipulate array unsafely
    json.friends.sort((a: any, b: any) => b.localeCompare(a.localeCompare));
    expect(json.friends).to.deep.equal(['Kevin', 'Cesar', 'Alex']);
    expect(json.friends.$.loc?.isGuess).to.be.not.ok;
    expect(json.friends.$.getLoc(0)?.isGuess).to.equal(true);
    expect(json.friends.$.getLoc(0)?.start.line).to.equal(16);
    expect(json.friends.$.getLoc(1)?.start.line).to.equal(16);
    expect(json.friends.$.getLoc(2)?.start.line).to.equal(16);
  });
  it('should execute complex primitive protection logic', () => {
    const parsedJson = parsePathSync(
      path.resolve(__dirname, 'testdata/person.json')
    );
    const json = parsedJson.toJson(path => {
      return path.length >= 2 && path[path.length - 1].key === 'state';
    });
    assertIsObject(json);
    expect(json).to.deep.equal({
      name: 'John',
      oldAddress: {
        street: '100 Easy Street',
        city: 'Christiansted',
        state: {value: 'USVI'},
        zip: '00808',
      },
      newAddress: {
        street: '100 Hippie Way',
        city: 'Boulder',
        state: {value: 'CO'},
        zip: '80303',
      },
      state: 'anxious',
      friends: ['Cesar', 'Alex', 'Kevin'],
    });
  });
});
