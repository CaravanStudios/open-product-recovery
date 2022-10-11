/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ServerAccessControlList {
  isAllowed(organizationURL: string): Promise<boolean>;
}

export class StaticServerAccessControlList implements ServerAccessControlList {
  private accessControlList: Record<string, boolean>;

  constructor(accessControlList: Array<string>) {
    this.accessControlList = {};
    for (const entry of accessControlList) {
      this.accessControlList[entry] = true;
    }
  }

  async isAllowed(organizationURL: string): Promise<boolean> {
    return this.accessControlList[organizationURL] === true;
  }
}
