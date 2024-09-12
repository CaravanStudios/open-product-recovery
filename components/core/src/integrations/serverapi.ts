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

import {Destroyable} from './destroyable';
import {CustomRequestHandler} from '../server/customrequesthandler';
import {IRouter} from 'express';

/**
 * An API used by OPR integrations to set up handlers and get information about
 * the current server.
 */
export interface ServerApi extends Destroyable {
  /**
   * Returns the Express server running OPR. This can be used to install custom
   * middleware or perform other bare-metal customizations to the server. You
   * can easily break an OPR node by messing with the underlying server, so
   * only touch this if you really know what you're doing.
   */
  getExpressRouter(): IRouter;

  installCustomHandler(path: string, handler: CustomRequestHandler): void;
}
