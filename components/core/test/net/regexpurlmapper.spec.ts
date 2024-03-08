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
import {RegexpUrlMapper} from '../../src/net/regexpurlmapper';

describe('RegexpUrlMapper', () => {
  describe('map', () => {
    context('with config from Record<string, string>', () => {
      const mapper = new RegexpUrlMapper();
      mapper.addMappingFromConfig({
        'https://b.example.org(/.*)': 'http://localhost:4000$1',
        'https://a.example.org(/.*)': 'http://localhost:4010$1',
      });
      it('should map matched urls', () => {
        expect(mapper.map('https://b.example.org/opr/org.json')).to.equal(
          'http://localhost:4000/opr/org.json'
        );
        expect(mapper.map('https://a.example.org/opr/api/list')).to.equal(
          'http://localhost:4010/opr/api/list'
        );
      });

      it('should ignore unmatched urls', () => {
        expect(mapper.map('https://c.example.org/opr/org.json')).to.equal(
          'https://c.example.org/opr/org.json'
        );
      });
    });
  });
});
