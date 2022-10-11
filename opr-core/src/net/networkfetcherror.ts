/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {StatusError} from '../util/statuserror';

export class NetworkFetchError extends StatusError {
  public responseText?: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(fetchUrl: string, cause?: any, errorText?: string) {
    super(
      'Failed to fetch ' + fetchUrl + (errorText ? '\n' + errorText : ''),
      'NETWORK_FETCH_ERROR',
      500,
      cause
    );
    this.responseText = errorText;
  }
}
