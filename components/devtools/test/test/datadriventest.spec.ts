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

import MochaEngine from 'mocha';
import {expect} from 'chai';
import {glob} from 'glob';
import * as path from 'path';

interface HasError {
  err?: Error;
}

class SilentReporter extends MochaEngine.reporters.Base {
  constructor(
    hookErrorMap: HookErrorMap,
    reporters: Array<MochaEngine.ReporterConstructor>,
    runner: MochaEngine.Runner,
    options: MochaEngine.MochaOptions
  ) {
    super(runner);
    runner.on('fail', (test: MochaEngine.Test | MochaEngine.Hook) => {
      if (test.type === 'hook') {
        const error = (test as HasError).err;
        if (error) {
          hookErrorMap[test.title] = 'failed';
        }
      }
    });
    for (const reporter of reporters) {
      new reporter(runner, options);
    }
  }

  static buildConstructor(
    hookErrorMap: HookErrorMap,
    ...reporters: Array<MochaEngine.ReporterConstructor>
  ): MochaEngine.ReporterConstructor {
    return SilentReporter.bind(null, hookErrorMap, reporters);
  }
}

type HookErrorMap = Record<string, 'failed'>;
type ResultMap = Record<string, 'failed' | 'passed' | 'pending' | undefined>;

interface TestResults {
  hookErrorMap: HookErrorMap;
  resultMap: ResultMap;
}

function getAllMochaTests(suite: MochaEngine.Suite): Array<MochaEngine.Test> {
  const result = [...suite.tests];
  for (const s of suite.suites) {
    result.push(...getAllMochaTests(s));
  }
  return result;
}

async function runTest(testFile: string): Promise<TestResults> {
  return new Promise(acceptFn => {
    const hookErrorMap = {};
    const mocha = new MochaEngine({
      reporter: SilentReporter.buildConstructor(
        hookErrorMap
        // uncomment below to add full test output for child tests
        // MochaEngine.reporters.Spec
      ),
    });
    mocha.addFile(path.resolve(__dirname, testFile));
    const shortFileName = path.relative(__dirname, testFile);
    try {
      mocha.run(failures => {
        const allTests = getAllMochaTests(mocha.suite);
        const resultMap = {} as ResultMap;
        for (const test of allTests) {
          resultMap[test.title] = test.state;
        }
        acceptFn({
          resultMap: resultMap,
          hookErrorMap: hookErrorMap,
        });
      });
    } catch (e) {
      console.log('Mocha.run failed for', shortFileName, 'with', e);
      acceptFn({
        resultMap: {},
        hookErrorMap: hookErrorMap,
      });
    }
  });
}

async function runTests(globPattern: string): Promise<TestResults> {
  const testFiles = glob.sync(globPattern, {
    cwd: __dirname,
    absolute: true,
  });
  let resultMap = {} as ResultMap;
  let hookErrorMap = {} as HookErrorMap;
  for (const file of testFiles) {
    const result = await runTest(file);
    resultMap = {
      ...resultMap,
      ...result.resultMap,
    };
    hookErrorMap = {
      ...hookErrorMap,
      ...result.hookErrorMap,
    };
  }
  return {
    resultMap: resultMap,
    hookErrorMap: hookErrorMap,
  };
}

describe('DataDrivenTest', () => {
  describe('Successful tests', () => {
    it('should pass all', async () => {
      const result = await runTests('./succeed/**/*.manualspec.ts');
      expect(result.resultMap).to.deep.equal({
        'Error checking': 'passed',
        'Opposite day calls': 'passed',
        'Regular calls with initial value': 'passed',
        'Regular calls with no initial value': 'passed',
        'Special secret values': 'passed',
        'datatests/toytest.test.json should initialize': 'passed',
        'Inherits imported context 1': 'passed',
        'Inherits imported context 2': 'passed',
        'Overrides imported context': 'passed',
      });
      expect(result.hookErrorMap).to.deep.equal({});
    });
  });
  describe('Failed tests', () => {
    it('should fail all', async () => {
      const result = await runTests('./fail/**/*.manualspec.ts');
      expect(result.resultMap).to.deep.equal({
        'Expect error and result': 'failed',
        'Import missing file': undefined,
        'Use illegal op': 'failed',
        'datatests/badconfig.test.json should initialize': 'passed',
        'datatests/badtemplate.test.json should initialize': 'passed',
        'datatests/misplacedimport.test.json should initialize': 'failed',
        'datatests/parserror.test.json should initialize': 'failed',
        'datatests/jsonarray.test.json should initialize': 'failed',
      });
      expect(result.hookErrorMap).to.deep.equal({
        '"before all" hook for "Import missing file"': 'failed',
      });
    });
  });
});
