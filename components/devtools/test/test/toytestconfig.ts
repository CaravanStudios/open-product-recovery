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

import {SourcedJsonObject} from '../../src/json/sourcedjson';
import {TestConfig} from '../../src/test/datadriventest';

export class ToyMathClass {
  private value: number;

  constructor(initialValue: number) {
    this.value = initialValue;
  }

  add(value: number): void {
    this.value += value;
  }

  subtract(value: number): void {
    this.value -= value;
  }

  divide(value: number): void {
    if (value === 0) {
      throw new Error('Divide by zero');
    }
    this.value /= value;
  }

  isNegative(): boolean {
    return this.value < 0;
  }

  getValue(): number {
    return this.value;
  }
}

export class ToyConfig implements TestConfig<ToyMathClass> {
  readonly cwd: string;
  readonly name = 'Toy test';
  readonly pathGlob?: string | Array<string>;

  constructor(cwd: string, pathGlob?: string | Array<string>) {
    this.pathGlob = pathGlob;
    this.cwd = cwd;
  }

  async buildTestObject(testContext: SourcedJsonObject): Promise<ToyMathClass> {
    const initialValue = testContext
      .propAsNumber('initialValue')
      .getOrDefault(0);
    return new ToyMathClass(initialValue);
  }

  async applyOperation(
    testObject: ToyMathClass,
    operation: SourcedJsonObject
  ): Promise<Record<string, unknown>> {
    const op = operation.propAsString('op').req();
    switch (op) {
      case 'add': {
        const value = operation.propAsNumber('value').req();
        testObject.add(value);
        return {};
      }
      case 'subtract': {
        const value = operation.propAsNumber('value').req();
        testObject.subtract(value);
        return {};
      }
      case 'divide': {
        const value = operation.propAsNumber('value').req();
        testObject.divide(value);
        return {};
      }
      case 'getValue': {
        const isOppositeDay = operation
          .propAsBoolean('isOppositeDay')
          .getOrDefault(false);
        return {
          value: (isOppositeDay ? -1 : 1) * testObject.getValue(),
        };
      }
      case 'isNegative': {
        const isOppositeDay = operation
          .propAsBoolean('isOppositeDay')
          .getOrDefault(false);
        const result = testObject.isNegative();
        return {
          result: isOppositeDay ? !result : result,
        };
      }
      default:
        throw new Error(`Unknown operation ${op}`);
    }
  }
}
