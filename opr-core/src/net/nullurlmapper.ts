/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {UrlMapper} from './urlmapper';

export class NullUrlMapper implements UrlMapper {
  map(url: string): string {
    return url;
  }
}
