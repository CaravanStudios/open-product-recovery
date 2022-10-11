/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Validator} from 'opr-models';
import {StatusError} from '../../util/statuserror';
import {JWTPayload} from 'jose';
import {OprDatabase} from '../../database/oprdatabase';

export abstract class AuthenticatedRequestHandler<RequestType, ResponseType> {
  public readonly scopes: Readonly<Array<string>>;
  private requestSchemaId: string;
  private responseSchemaId: string;
  protected readonly database: OprDatabase;

  constructor(
    database: OprDatabase,
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
