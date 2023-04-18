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
export interface HandlerRegistry {
  /**
   * Registers a change handler.
   */
  registerChangeHandler(
    handlerFn: (change: OfferChange) => Promise<void>
  ): HandlerRegistration;

  installCustomHandler(path: string, handler: CustomRequestHandler): void;
}
