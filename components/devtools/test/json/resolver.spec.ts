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
import {expect} from 'chai';

import * as path from 'path';
import {Resolver} from '../../src/json/resolver';
import {parseSource, SourcedJsonValue} from '../../src/json/sourcedjson';

describe('resolver', () => {
  it('should import', async () => {
    const exampleSource = JSON.stringify(
      {
        cakeIsALie: false,
        $import: './testdata/nes.json',
        fruits: ['apple', 'cake', 'orange'],
      },
      undefined,
      2
    );
    const parsed = parseSource(
      exampleSource,
      path.resolve(__dirname, 'fakepath.json')
    );
    const resolver = new Resolver();
    const result: SourcedJsonValue = await resolver.resolve(parsed);
    result.assertIsObject();
    const resultJson = result.toJson();
    expect(resultJson.$import).to.be.undefined;
    expect(resultJson.cakeIsALie).to.be.undefined;
    expect(resultJson.name).to.equal('Nintendo Entertainment System');
    expect(resultJson.processor).to.equal('Ricoh 2A03');
    expect(resultJson.fruits).to.deep.equal(['apple', 'cake', 'orange']);
  });
  it('should replace', async () => {
    const exampleSource = JSON.stringify(
      {
        cakeIsALie: {
          $replace: true,
        },
        fruits: [
          'apple',
          'cake',
          {
            $replace: 'orange',
          },
        ],
      },
      undefined,
      2
    );
    const parsed = parseSource(
      exampleSource,
      path.resolve(__dirname, 'fakepath.json')
    );
    const resolver = new Resolver();
    const result: SourcedJsonValue = await resolver.resolve(parsed);
    result.assertIsObject();
    const resultJson = result.toJson();
    expect(resultJson.$replace).to.be.undefined;
    expect(resultJson.cakeIsALie).to.equal(true);
    expect(resultJson.fruits).to.deep.equal(['apple', 'cake', 'orange']);
  });
  it('should patch', async () => {
    const exampleSource = JSON.stringify(
      {
        cakeIsALie: false,
        fruits: ['apple', 'cake', 'orange'],
        $patch: [
          {
            op: 'remove',
            path: '/fruits/1',
          },
          {
            op: 'replace',
            path: '/cakeIsALie',
            value: true,
          },
        ],
      },
      undefined,
      2
    );
    const parsed = parseSource(
      exampleSource,
      path.resolve(__dirname, 'fakepath.json')
    );
    const resolver = new Resolver();
    const result: SourcedJsonValue = await resolver.resolve(parsed);
    result.assertIsObject();
    const resultJson = result.toJson();
    expect(resultJson.$patch).to.be.undefined;
    expect(resultJson.cakeIsALie).to.equal(true);
    expect(resultJson.$.propAsBoolean('cakeIsALie').reqSourced().loc.isGuess).to
      .be.not.ok;
    expect(resultJson.fruits).to.deep.equal(['apple', 'orange']);
  });
  it('should apply', async () => {
    const exampleSource = JSON.stringify(
      {
        cakeIsALie: false,
        fruits: ['apple', 'cake', 'orange'],
        $apply: [
          {
            name: '$patch',
            value: [
              {
                op: 'add',
                path: '/fruits/1',
                value: 'fish',
              },
            ],
          },
          {
            name: 'cakeIsALie',
            value: true,
          },
          {
            name: '$patch',
            value: [
              {
                op: 'remove',
                path: '/fruits/0',
              },
            ],
          },
        ],
      },
      undefined,
      2
    );
    const parsed = parseSource(
      exampleSource,
      path.resolve(__dirname, 'fakepath.json')
    );
    const resolver = new Resolver();
    const result: SourcedJsonValue = await resolver.resolve(parsed);
    result.assertIsObject();
    const resultJson = result.toJson();
    expect(resultJson.$apply).to.be.undefined;
    expect(resultJson.cakeIsALie).to.equal(true);
    expect(resultJson.fruits).to.deep.equal(['fish', 'cake', 'orange']);
  });
});
