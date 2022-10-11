/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export class StatusError extends Error {
  public readonly errorCode: string;
  public readonly httpStatus: number;
  public readonly parentError?: Error;
  public readonly otherFields: Record<string, unknown>;
  constructor(
    msg: string,
    errorCode = 'INTERNAL_ERROR',
    httpStatus = 500,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cause?: any,
    otherFields: Record<string, unknown> = {}
  ) {
    super(msg, {
      cause: cause,
    });
    if (cause instanceof Error) {
      this.parentError = cause;
    }
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
    this.otherFields = otherFields;
  }

  getCauseChainCodes(): Array<string> {
    const parentCauseCodes =
      this.parentError instanceof StatusError
        ? (this.parentError as StatusError).getCauseChainCodes()
        : [];
    return [this.errorCode, ...parentCauseCodes];
  }
}
