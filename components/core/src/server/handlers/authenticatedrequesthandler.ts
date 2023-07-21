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

import {Validator} from 'opr-models';
import {StatusError} from '../../util/statuserror';
import {JWTPayload} from 'jose';
import {OfferModel} from '../../model/offermodel';

export abstract class AuthenticatedRequestHandler<RequestType, ResponseType> {
  public readonly scopes: Readonly<Array<string>>;
  private requestSchemaId: string;
  private responseSchemaId: string;
  protected readonly database: OfferModel;

  constructor(
    database: OfferModel,
    scopes: Readonly<Array<string>>,
    requestSchemaId: string,
    responseSchemaId: string
  ) {
    this.database = database;
    this.scopes = scopes;
    this.requestSchemaId = requestSchemaId;
    this.responseSchemaId = responseSchemaId;
  }

  private validate(
    json: unknown,
    schemaId: string,
    errorMessage: string,
    errorCode: string,
    httpStatus: number
  ) {
    const payloadValidationResult = Validator.validate(json, schemaId);
    if (!payloadValidationResult.valid) {
      throw new StatusError(
        errorMessage + ':\n' + payloadValidationResult.getErrorMessage(),
        errorCode,
        httpStatus
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldIgnoreAccessControlList(requestBody: RequestType): boolean {
    return false;
  }

  validateRequest(requestBody: unknown): asserts requestBody is RequestType {
    this.validate(
      requestBody,
      this.requestSchemaId,
      'Malformed request',
      'INVALID_REQUEST',
      400
    );
  }

  validateResponse(
    responseBody: unknown
  ): asserts responseBody is ResponseType {
    this.validate(
      responseBody,
      this.responseSchemaId,
      'Internal error',
      'INTERNAL_ERROR_MALFORMED_RESPONSE',
      500
    );
  }

  abstract handle(
    request: RequestType,
    decodedAuthToken: JWTPayload
  ): Promise<ResponseType>;
}
