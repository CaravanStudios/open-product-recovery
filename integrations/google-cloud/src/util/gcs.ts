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

import {Storage} from '@google-cloud/storage';
import {StatusError} from 'opr-core';
import {File} from '@google-cloud/storage';

export interface GcsFileSpec {
  bucket: string;
  path: string;
}

const PATH_REGEXP = /^gs:\/\/([a-z0-9_\-.]+)\/(.+)?$/;

function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : '/' + path;
}

export function fromPath(gcsPath: string | GcsFileSpec): GcsFileSpec {
  if (typeof gcsPath !== 'string') {
    return gcsPath;
  }
  const result = gcsPath.match(PATH_REGEXP);
  if (!result || result.length < 3) {
    throw new StatusError('Bad gcs path: ' + gcsPath, 'BAD_GCS_PATH', 500);
  }
  return {
    bucket: result[1],
    path: result[2],
  };
}

export function toPath(fileSpec: GcsFileSpec) {
  return 'gs://' + fileSpec.bucket + ensureLeadingSlash(fileSpec.path);
}

export function toFile(
  specOrPath: GcsFileSpec | string,
  storage = new Storage()
) {
  const fileSpec = fromPath(specOrPath);
  return storage.bucket(fileSpec.bucket).file(fileSpec.path);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getGcsJsonFromFile(file: File): Promise<any> {
  return JSON.parse(await getGcsTextFromFile(file));
}

export async function getGcsJson(
  fileSpec: GcsFileSpec | string,
  storage = new Storage()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  return getGcsJsonFromFile(toFile(fileSpec, storage));
}

export async function getGcsTextFromFile(file: File): Promise<string> {
  const downloadResult = await file.download();
  return downloadResult[0].toString();
}

export async function getGcsText(
  fileSpec: GcsFileSpec | string,
  storage = new Storage()
) {
  return getGcsTextFromFile(toFile(fileSpec, storage));
}

export async function listDir(
  specOrPath: GcsFileSpec | string,
  storage = new Storage()
): Promise<Array<File>> {
  const fileSpec = fromPath(specOrPath);
  const files = await storage.bucket(fileSpec.bucket).getFiles({
    prefix: fileSpec.path,
    delimiter: '/',
  });
  return files[0].filter(x => x.name !== fileSpec.path);
}
