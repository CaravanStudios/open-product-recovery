/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import 'mocha';
import {expect} from 'chai';
import {Validator} from '../src/validator';
import JsonRefs from 'json-refs';

describe('Validator', () => {
  describe('getSchema', () => {
    it('should have multiple schemas', () => {
      expect(Validator.getSchemaIds().length).to.be.greaterThan(0);
    });
    it('should have a schema for each id', () => {
      for (const schemaId of Validator.getSchemaIds()) {
        expect(Validator.getSchemaById(schemaId)).to.not.be.null;
      }
    });
  });
  describe('validate', () => {
    context('all examples correct', () => {
      for (const schemaId of Validator.getSchemaIds()) {
        const schema = Validator.getSchemaById(schemaId);
        it(`should have correct examples for ${schemaId}`, async () => {
          const examples = schema.examples as Array<unknown>;
          expect(examples, 'No examples field defined').to.be.not.undefined;
          expect(examples.length, 'No examples provided').to.be.greaterThan(0);
          for (let i = 0; i < examples.length; i++) {
            let exampleResolved;
            if (typeof examples[i] === 'object') {
              const exampleLoc = __dirname + '/../src/' + schemaId;
              const resolveResult = await JsonRefs.resolveRefs(
                examples[i] as object,
                {
                  location: exampleLoc,
                }
              );
              exampleResolved = resolveResult.resolved;
            } else {
              exampleResolved = examples[i];
            }

            const result = Validator.validate(exampleResolved, schemaId);
            expect(
              result.valid,
              `Invalid example at index ${i}: ` + result.toString()
            ).to.be.true;
          }
        });
      }
    });
  });
});
