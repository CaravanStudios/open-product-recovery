/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OrgConfig {
  name: string;
  organizationURL: string;
  enrollmentURL?: string;
  listProductsEndpointURL?: string;
  acceptProductsEndpointURL?: string;
  reserveProductsEndpointURL?: string;
  rejectProductsEndpointURL?: string;
  acceptHistoryEndpointURL?: string;
  jwksURL?: string;
  scopesSupported?: boolean;
}
