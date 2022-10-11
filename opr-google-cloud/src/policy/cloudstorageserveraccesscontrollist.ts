/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ServerAccessControlList} from 'opr-core';
import {Storage} from '@google-cloud/storage';
import {GcsFileSpec, getGcsText, toFile} from '../util/gcs';

const REGEXP_PATTERN = /^r\/(.+)\/$/;
export class CloudStorageServerAccessControlList
  implements ServerAccessControlList
{
  private storage: Storage;
  private fileSpec: GcsFileSpec | string;

  constructor(fileSpec: GcsFileSpec | string, storage = new Storage()) {
    this.storage = storage;
    this.fileSpec = fileSpec;
  }

  async isAllowed(organizationURL: string): Promise<boolean> {
    const entries = await this.getAccessControlListEntries();
    for (const entry of entries) {
      if (organizationURL.match(entry)) {
        return true;
      }
    }
    return false;
  }

  private async getAccessControlListEntries(): Promise<Array<string | RegExp>> {
    const gcsAclText = await getGcsText(this.fileSpec, this.storage);
    const aclEntries = gcsAclText.split('\n');
    aclEntries.map(x => {
      const rMatch = REGEXP_PATTERN.exec(x);
      const regexpMatch = rMatch?.groups && rMatch.groups[0];
      return regexpMatch ? new RegExp(regexpMatch) : x;
    });
    return aclEntries;
  }
}
