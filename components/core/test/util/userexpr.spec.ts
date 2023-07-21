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
import {
  compileUserExprUnsafe,
  evalUserExprUnsafe,
} from '../../src/util/userexpr';

describe('UserFilter', () => {
  describe('compileUserFilterUnsafe', () => {
    context('with params from dynamic struct', () => {
      const map = {
        monkey: [1, 2, 3, 4, 5],
        mul: 6,
      };
      const compiledFn = compileUserExprUnsafe('monkey.map(x => x * mul)', map);
      it('should work on correct inputs', () => {
        expect(compiledFn(map)).to.deep.equal([6, 12, 18, 24, 30]);
      });
    });
    context('with bad expression', () => {
      const map = {
        monkey: [1, 2, 3, 4, 5],
        mul: 6,
      };
      it('should fail to compile with bad expression', () => {
        expect(() => compileUserExprUnsafe('monkey map', map)).to.throw;
      });
    });
    context('with bad call', () => {
      const map = {
        monkey: [1, 2, 3, 4, 5],
        mul: 6,
      };
      const compiledFn = compileUserExprUnsafe('monkey.map(x => x * mul)', map);
      it('should fail on call with bad parameters', () => {
        // Note the intentionally broken cast
        expect(() =>
          compiledFn({monkey: undefined as unknown as Array<number>, mul: 6})
        ).to.throw;
      });
    });
    context('with array param def and interface values', () => {
      interface MyContext {
        monkey: Array<number>;
        mul: number;
      }
      const map = {
        monkey: [1, 2, 3, 4, 5],
        mul: 6,
      };
      const compiledFn = compileUserExprUnsafe<Array<number>, MyContext>(
        'monkey.map(x => x * mul)',
        ['monkey', 'mul']
      );
      it('should work on correct inputs', () => {
        expect(compiledFn(map)).to.deep.equal([6, 12, 18, 24, 30]);
      });
    });
    context('with record values', () => {
      const map: Record<string, unknown> = {
        monkey: [1, 2, 3, 4, 5],
        mul: 6,
      };
      const compiledFn = compileUserExprUnsafe('monkey.map(x => x * mul)', map);
      it('should work on correct inputs', () => {
        expect(compiledFn(map)).to.deep.equal([6, 12, 18, 24, 30]);
      });
    });
  });
  describe('evalUserExprUnsafe', () => {
    context('with params from dynamic struct', () => {
      const map = {
        monkey: [1, 2, 3, 4, 5],
        mul: 6,
      };
      const result = evalUserExprUnsafe('monkey.map(x => x * mul)', map);
      it('should work on correct inputs', () => {
        expect(result).to.deep.equal([6, 12, 18, 24, 30]);
      });
    });
    context('with interface values', () => {
      interface MyContext {
        monkey: Array<number>;
        mul: number;
      }
      const map = {
        monkey: [5, 4, 3, 2, 1],
        mul: 6,
      };
      const result = evalUserExprUnsafe<Array<number>, MyContext>(
        'monkey.map(x => x * mul)',
        map
      );
      it('should work on correct inputs', () => {
        expect(result).to.deep.equal([30, 24, 18, 12, 6]);
      });
    });
    context('with record values', () => {
      const map: Record<string, unknown> = {
        monkey: [1, 4, 3, 2, 5],
        mul: 6,
      };
      const result = evalUserExprUnsafe('monkey.map(x => x * mul)', map);
      it('should work on correct inputs', () => {
        expect(result).to.deep.equal([6, 24, 18, 12, 30]);
      });
    });
  });
});
