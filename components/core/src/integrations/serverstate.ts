/**
 * Copyright 2022 Google LLC
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

import {Offer, OfferHistory} from 'opr-models';
import {HandlerRegistration} from '../model/handlerregistration';
import {Interval} from '../model/interval';
import {OfferChange} from '../model/offerchange';
import {OfferId} from '../model/offerid';
import {TimelineEntry} from '../model/timelineentry';
import {CustomRequestHandler} from '../server/customrequesthandler';
import {IRouter} from 'express';
import {JsonValue} from '../util/jsonvalue';
import {OfferProducer} from '../offerproducer/offerproducer';

/**
 * An API used by OPR integrations. This API is passed to custom startup
 * routines and custom handlers.
 */
export interface ServerState {
  readonly hostOrgUrl: string;

  /**
   * Stores a key-value pair. If a value already exists at the given key, it
   * will be replaced and the old value returned.
   */
  storeValue(key: string, value: JsonValue): Promise<JsonValue | undefined>;

  /**
   * Deletes all values stored with the given key prefix. Returns the number of
   * keys deleted if supported by the storage driver.
   */
  clearAllValues(keyPrefix: string): Promise<number | undefined>;

  /**
   * Returns all values for the given host where the key starts with the given
   * prefix.
   */
  getValues(keyPrefix: string): AsyncIterable<JsonValue>;

  /**
   * Returns the Express server running OPR. This can be used to install custom
   * middleware or perform other bare-metal customizations to the server. You
   * can easily break an OPR node by messing with the underlying server, so
   * only touch this if you really know what you're doing.
   */
  getExpressRouter(): IRouter;
}
