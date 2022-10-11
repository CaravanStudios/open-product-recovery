/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OfferProducerMetadata {
  readonly lastUpdateTimeUTC?: number;
  readonly nextRunTimestampUTC: number;
  readonly producerId: string;
}
