import {
  asyncIterableToArray,
  FakeOfferProducer,
  OfferChange,
  ProviderIntegration,
} from 'opr-core';
import {HostIntegrationInstallFn} from 'opr-core/build/integrations/hostintegration';

// The general pattern for building your own custom integration for your server.
// First, export a map named "integrations". This is used by the module loader
// to find the integrations you've published.
export const integrations = {
  // The default integration is named "default". This is the integration that
  // is used if there is no integration name specified in the "moduleName"
  // field of the JSON config.
  default: {
    // Integrations have a "construct" method that tells the module loader how
    // to build the object you're providing. In this case, we're constructing
    // a HostIntegrationInstallFn, the most common way of installing an
    // integration. However, if you need to build a custom listing policy, or
    // some other custom object, you would create a "construct" method that
    // returns whatever kind of custom object you need.
    async construct(json) {
      // We return our HostIntegrationInstallFn, which is just an async function
      // that takes an IntegrationApi as its first parameter.
      return async api => {
        // Now, we can use the api to install anything we want.
        console.log('Running local integration installer');
        // Here's a custom handler that tells the host to ingest new offers.
        // In a real server, you definitely want to add authentication to an
        // endpoint like this.
        api.installCustomHandler('ingest', {
          method: ['GET', 'POST'],
          handle: async () => {
            const changes = [] as Array<OfferChange>;
            const changeHandler = api.registerChangeHandler(async change => {
              changes.push(change);
            });
            await api.ingestOffers();
            changeHandler.remove();
            return changes;
          },
        });

        // Create a custom debug endpoint that will return the list of offers
        // made by this server.
        // ADD AUTHENTICATION TO AN ENDPOINT LIKE THIS! This is exposing offers
        // on your server to anyone that calls this endpoint. For a real server,
        // only admins and developers should be able to see this information.
        // Organizations should only see offers that are listed for them.
        api.installCustomHandler('myOffers', {
          method: ['GET', 'POST'],
          handle: async () => {
            return await asyncIterableToArray(api.getOffersFromThisHost());
          },
        });

        // Create a custom debug endpoint that will return the list of offers
        // this host can accept
        // ADD AUTHENTICATION TO AN ENDPOINT LIKE THIS! This is exposing offers
        // on your server to anyone that calls this endpoint. For a real server,
        // only admins and developers should be able to see this information.
        // Organizations should only see offers that are listed for them.
        api.installCustomHandler('theirOffers', {
          method: ['GET', 'POST'],
          handle: async () => {
            return await asyncIterableToArray(
              api.getListedOffers(api.hostOrgUrl)
            );
          },
        });

        // Here, we are only using one OfferProducer, the "FakeOfferProducer".
        // In this example, ingest() will call the FakeOfferProducer and
        // generate fake offers for testing/demo use.
        api.installOfferProducer(
          new FakeOfferProducer({
            sourceOrgUrl: api.hostOrgUrl,
            integrationApi: api,
          })
        );
      };
    },
  } as ProviderIntegration<HostIntegrationInstallFn>,
  // You can create named integrations too.
  helloworld: {
    async construct() {
      return async api => {
        api.installCustomHandler('helloworld', {
          method: ['GET', 'POST'],
          handle: async () => {
            return 'Hello world. From ' + api.hostOrgUrl;
          },
        });
      };
    },
  } as ProviderIntegration<HostIntegrationInstallFn>,
  howdyworld: {
    async construct() {
      return async api => {
        api.installCustomHandler('howdyworld', {
          method: ['GET', 'POST'],
          handle: async () => {
            return 'Howdy world! From ' + api.hostOrgUrl;
          },
        });
      };
    },
  } as ProviderIntegration<HostIntegrationInstallFn>,
};
