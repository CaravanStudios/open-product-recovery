/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
