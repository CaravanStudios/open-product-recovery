/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {FrontendConfig} from './frontendconfig';
import {OrgConfig} from './orgconfig';
import {URL} from 'url';

function pathToUrl(f: FrontendConfig, path?: string): string | undefined {
  if (path === undefined) {
    return undefined;
  }
  const baseUrl = new URL('./', f.organizationURL);
  return new URL(path, baseUrl).toString();
}

function getJwksUrl(f: FrontendConfig): string | undefined {
  if (!f.jwksURL) {
    return undefined;
  }
  const testUrl = new URL(f.jwksURL, 'http://localhost');
  if (testUrl.hostname === 'localhost') {
    return pathToUrl(f, testUrl.pathname);
  }
  return f.jwksURL;
}

export function frontendConfigToOrgConfig(f: FrontendConfig): OrgConfig {
  const orgConfig = {
    name: f.name,
    organizationURL: f.organizationURL,
    enrollmentURL: f.enrollmentURL,
    listProductsEndpointURL: pathToUrl(f, f.listProductsPath),
    acceptProductsEndpointURL: pathToUrl(f, f.acceptProductPath),
    reserveProductsEndpointURL: pathToUrl(f, f.reserveProductPath),
    rejectProductsEndpointURL: pathToUrl(f, f.rejectProductPath),
    acceptHistoryEndpointURL: pathToUrl(f, f.historyPath),
    jwksURL: getJwksUrl(f),
    scopesSupported: !f.scopesDisabled,
  };
  return orgConfig;
}
