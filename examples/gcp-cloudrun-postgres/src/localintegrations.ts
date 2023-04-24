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

import {
  asyncIterableToArray,
  CustomRequestHandler,
  FakeOfferProducer,
  HandlerRegistry,
  OfferChange,
  OfferManager,
  PluggableFactory,
  ServerState,
  StatusError,
  TenantNodeIntegrationInstaller,
} from 'opr-core';

export interface LocalIntegrationOptions {
  serviceAccount?: string;
}

// The general pattern for building your own custom integration for your server.
// First, export a map named "integrations". This is used by the module loader
// to find the integrations you've published.
export const LocalIntegrations = {
  LocalMain: {
    // Integrations have a "construct" method that tells the module loader how
    // to build the object you're providing. In this case, we're constructing
    // a HostIntegrationInstallFn, the most common way of installing an
    // integration. However, if you need to build a custom listing policy, or
    // some other custom object, you would create a "construct" method that
    // returns whatever kind of custom object you need.
    async construct(json: LocalIntegrationOptions) {
      if (!json.serviceAccount) {
        throw new StatusError(
          'Configuration error: A service account must be specified',
          'LOCAL_INTEGRATION_NO_SERVICE_ACCOUNT'
        );
      }
      return {
        // Note the "as const" below. This is essential to getting Typescript to
        // use this name as a type, not a regular name.
        type: 'integrationInstaller' as const,

        async install(handlerRegistry: HandlerRegistry, offerManager: OfferManager, serverState: ServerState): Promise<void> {
          const ingestHandler: CustomRequestHandler = {
            method: ['GET', 'POST'],
            handle: async () => {
              const changes = [] as Array<OfferChange>;
              const changeHandler = handlerRegistry.registerChangeHandler(async change => {
                changes.push(change);
              });
              await offerManager.ingestOffers();
              changeHandler.remove();
              return changes;
            },
          };
          handlerRegistry.installCustomHandler(
            'ingest',
            ingestHandler
            // IamCustomEndpointWrapper.wrap(ingestHandler, {
            //   isAllowed: async (email: string) => {
            //     console.log('Checking service account', email);
            //     return email === json.serviceAccount;
            //   },
            // })
          );

          // Create a custom debug endpoint that will return the list of offers
          // made by this server.
          // ADD AUTHENTICATION TO AN ENDPOINT LIKE THIS! This is exposing
          // offers on your server to anyone that calls this endpoint. For a
          // real server, only admins and developers should be able to see this
          // information. Organizations should only see offers that are listed
          // for them.
          handlerRegistry.installCustomHandler('myOffers', {
            method: ['GET', 'POST'],
            handle: async () => {
              return await asyncIterableToArray(offerManager.getOffersFromThisHost());
            },
          });

          // Create a custom debug endpoint that will return the list of offers
          // this host can accept
          // ADD AUTHENTICATION TO AN ENDPOINT LIKE THIS! This is exposing
          // offers on your server to anyone that calls this endpoint. For a
          // real server, only admins and developers should be able to see this
          // information. Organizations should only see offers that are listed
          // for them.
          handlerRegistry.installCustomHandler('theirOffers', {
            method: ['GET', 'POST'],
            handle: async () => {
              return await asyncIterableToArray(
                offerManager.getListedOffers(offerManagerr.hostOrgUrl)
              );
            },
          });

          // Here, we are only using one OfferProducer, the "FakeOfferProducer".
          // In this example, ingest() will call the FakeOfferProducer and
          // generate fake offers for testing/demo use.
          offerManager.installOfferProducer(
            new FakeOfferProducer({
              sourceOrgUrl: offerManager.hostOrgUrl,
              offerManager: offerManager,
            })
          );
        },
      };
    },
  },
  // You can create as many integrations as you'd like.
  helloworld: {
    async construct() {
      return {
        type: 'integrationInstaller',

        async install(handlerRegistry: HandlerRegistry) {
          handlerRegistry.installCustomHandler('greet', {
            method: ['GET', 'POST'],
            handle: async () => {
              return 'Hello world. From ' + offerManager.hostOrgUrl;
            },
          });
        },
      };
    },
  } as PluggableFactory<TenantNodeIntegrationInstaller>,
  howdyworld: {
    async construct() {
      return {
        type: 'integrationInstaller',

        async install(handlerRegistry: HandlerRegistry) {
          handlerRegistry.installCustomHandler('greet', {
            method: ['GET', 'POST'],
            handle: async () => {
              return 'Howdy world. From ' + offerManager.hostOrgUrl;
            },
          });
        },
      };
    },
  } as PluggableFactory<TenantNodeIntegrationInstaller>,
};
