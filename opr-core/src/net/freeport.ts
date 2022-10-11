/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import net from 'net';

export async function getFreePort(): Promise<number> {
  return new Promise((res, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const address = srv.address();
      if (!address) {
        reject('No address assigned for test server');
        return;
      }
      if (typeof address === 'string') {
        reject('Cannot extract port from ' + address);
        return;
      }
      const port = address.port;
      srv.close(err => res(port));
    });
  });
}
