# The Open Product Recovery Integrations Guide

## Overview

This guide explains how to build integrations for an Open Product Recovery Server. If you want to extend an OPR Server in any way, from pulling offers from your inventory system, to saving data in a new datastore, to building a text-message interface for an OPR organization, integrations are usually the way to do it.

## How to Use This Guide

If this is your first time through, we strongly recommend you read [Background - How an OPR Server Works](#background---how-an-opr-server-works) to help you understand the concepts involved in using and building integrations.

If you know what you're doing and simply want guidance on how to accomplish a particular task, check the table of contents or browse  [Common Patterns](#common-patterns).

## Table of Contents
* [The Open Product Recovery Integrations Guide](#the-open-product-recovery-integrations-guide)
  * [Overview](#overview)
  * [How to Use This Guide](#how-to-use-this-guide)
  * [Table of Contents](#table-of-contents)
  * [Common Patterns](#common-patterns)
    * [Sending Notifications](#sending-notifications)
    * [Reading Offers from an Inventory System](#reading-offers-from-an-inventory-system)
    * [Supporting a New Cloud Infrastructure](#supporting-a-new-cloud-infrastructure)
    * [Using Integrations](#using-integrations)
    * [Publishing Integrations](#publishing-integrations)
    * [Working with PluggableFactory Params](#working-with-pluggablefactory-params)
    * [Using the Tenant Node URL in a PluggableFactory](#using-the-tenant-node-url-in-a-pluggablefactory)
  * [Background - How an OPR Server Works](#background---how-an-opr-server-works)
    * [One Server, Many Tenants](#one-server-many-tenants)
    * [Lifecycle of an OPR Request](#lifecycle-of-an-opr-request)
      * [Startup](#startup)
      * [Handling a Request](#handling-a-request)
      * [TLDR; Implications of this Model for Admins and Integration Developers](#tldr-implications-of-this-model-for-admins-and-integration-developers)
  * [PluggableFactories and Pluggables](#pluggablefactories-and-pluggables)
    * [Global Server Pluggables](#global-server-pluggables)
    * [Tenant Node Pluggables](#tenant-node-pluggables)


## Common Patterns

### Sending Notifications

Once of the most common integrations involves sending some sort of electronic notification when a significant event happens. This is done via the [`IntegrationApi`](https://github.com/google/open-product-recovery/blob/main/components/core/src/integrations/integrationapi.ts) method `registerChangeHandler`.

A simple notification system might look like this:

```typescript
export const NotificationIntegrations {
  ConsoleNotifications: {
    async construct() {
      return {
        type: 'integrationInstaller',

        async install(handlerRegistry: HandlerRegistry) {
          api.registerChangeHandler(async change => {
            console.log(
              'An offer changed:',
              change.type,
              'oldValue:',
              JSON.stringify(change.oldValue),
              'newValue:',
              JSON.stringify(change.newValue)
            );
          });
        },
      };
    },
  }
}
```

The possible event types are:

- `ADD` - A new offer (either from this node or from another node) has been created.
- `DELETE` - An offer (either from this node or another node) has been deleted.
- `UPDATE` - An offer (either from this node or another node) has been modified.
- `ACCEPT` - An offer from this node has been accepted.
- `REMOTE_ACCEPT` - An offer was accepted BY this node.
- `REMOTE_REJECT` - An offer was rejected BY this node.
- `REMOTE_RESERVE` - An offer was reserved BY this node.

Note that these events only fire on the server instance where the event was initiated, and all of these events are initiated by some method on an `IntegrationApi`. For example, the `ADD` event will be fired on the server instance that called `IntegrationApi.ingest()` to discover the new offer. The `REMOTE_ACCEPT` event will only fire on the server instance that called `IntegrationApi.accept()` to accept the offer. This is handy, because this means you do not need to worry about handling redundant events in environments where there may be multiple instances of the server running.

### Reading Offers from an Inventory System

Often, an OPR server needs to be able to ingest offers from some system that has a different API from OPR. This is done via an `OfferProducer`.

An OfferProducer always has the same general form:

```typescript
export class MyOfferProducer implements OfferProducer {
  readonly type: 'offerProducer';

  // The sourceOrgUrl of the organization/node that will appear in the
  // offeredBy field of this offer.
  readonly id: string;

  // Some options object that, at the very least, specifies the
  // org url of this node so the id field can be set.
  constructor(options: MyOfferProducerOptions) {
    ...
  }

  async produceOffers(payload: ListOffersPayload): Promise<OfferSetUpdate> {
    const offers: Offer[] = [];
    // The hard part: Look stuff up in the inventory system, convert
    // them to OPR offers, add them to the offers list.
    ...
    // The return statement almost always looks the same:
    return {
      // Package the offers as an async iterable.
      offers: iterableToAsync(offers),
      // Indicate that these offers are up to date as of the current moment.
      updateCurrentAsOfTimestampUTC: Date.now(),
      // Indicate the next timestamp at which this offer
      // producer can be called again.
      earliestNextRequestUTC:
        Date.now() + Math.min(MAX_UPDATE_FREQUENCY_MILLIS),
      // Set the source org URL to the id of the offer producer.
      sourceOrgUrl: this.id,
    };
  }
}
```

Offer producers should deviate from this form if:

- They can return offers asynchronously as they are read from the underlying system. Very useful for producing a large number of offers.
- The underlying system is log-based, and it is convenient for the OfferProducer to return a list of changes since it was last called rather than a list of offers.

In these cases, consult the [`OfferProducer`](https://github.com/google/open-product-recovery/blob/main/components/core/src/offerproducer/offerproducer.ts) interface for datamodel details.

### Supporting a New Cloud Infrastructure

The main OPR team works at Google and is most familiar with the Google Cloud stack, we always start with Google Cloud Platform for our cloud platform-based implementations. But there are many other options (Azure, AWS, Digital Ocean, etc). If you need support for one of these, and we haven't built it, and you're the heroic sort, you might need to build that support yourself.

This is a big topic, but in general, this tends to be simpler than it seems. Most integrations with a new cloud infrastructure actually come down to two problems: how to store data, and how to handle encryption keys.

When building an integration with a new cloud infrastructure, we suggest the following process:

1. Learn the NoSQL storage system used by the cloud infrastructure (because that tends to be the cheapest, easiest-to-use option on most platforms)
2. Learn about the Cloud Key Management system available on the cloud infrastructure, because that's almost always the best way to deal with encryption keys and digital signatures.

Then:

1. Build an implementation of [`PersistentStorage`](https://github.com/google/open-product-recovery/blob/main/components/core/src/database/persistentstorage.ts) based on the NoSQL system (use [`SqlOprPersistentStorage`](https://github.com/google/open-product-recovery/blob/main/integrations/sql-database/src/sqloprpersistentstorage.ts) as a reference)
2. Build an implementation of [`TenantNodeConfigProvider`](https://github.com/google/open-product-recovery/blob/main/components/core/src/config/tenantnodeconfigprovider.ts) that reads tenant node configurations from the NoSQL system
3. Write implementations of [`Signer`](https://github.com/google/open-product-recovery/blob/main/components/core/src/auth/signer.ts) and [`JwksProvider`](https://github.com/google/open-product-recovery/blob/main/components/core/src/auth/jwksprovider.ts) that can generate signatures and read a JWKS per tenant from the Cloud Key Management System.
4. (Optional) Write implementations for other policy storage interfaces like `ServerAccessControlList` or `OfferListingPolicy`. This is optional, because server admins can always use the pre-existing static implementations of these interfaces from `opr-core` and store the settings right in the Tenant Node JSON config.

You may notice that, at present, this is **not** the approach used in opr-google-cloud. Instead, opr-google-cloud is almost entirely based on Cloud Storage, Google's cloud filesystem, and Google Cloud SQL. However, this was a cheap shortcut to get us started quickly. We will soon backfill our Google Cloud integration to follow the guidelines above.

### Using Integrations

You use integrations by building a PluggableFactorySet of all the PluggableFactories you want to be available to your server and tenant nodes. Then, you pass that PluggableFactorySet to your server's constructor. The pattern tends to look like this:

```typescript
// Import PluggableFactorySets from packages you want.
import {CoreIntegrations} from 'opr-core';
import {SqlIntegrations} from 'opr-sql-database';
import {LocalIntegrations} from './localintegrations';
import {GcsIntegrations} from 'opr-google-cloud';

// Construct your server
const s = new OprServer(
  {
    // A bunch of configuration stuff goes here
  },
  // Use the ... spread operator to munge all the
  // PluggableFactorySets together into one new object.
  {
    ...CoreIntegrations,
    ...SqlIntegrations,
    ...GcsIntegrations,
    ...LocalIntegrations,
  }
);
```

If you build your server this way, Typescript will use your munged-together PluggableFactorySet to constrain the types in your JSON configuration. Auto-complete will work to fill in moduleName fields and params objects, and your life will be much easier.

We strongly recommend you do NOT do something like this:

```typescript
// OH NO THIS IS A BAD IDEA!
const integrations: PluggableFactorySet = {
  ...CoreIntegrations,
  ...SqlIntegrations,
  ...GcsIntegrations,
  ...LocalIntegrations,
};

const s = new OprServer(
  {
    // A bunch of configuration stuff goes here
  },
  integrations
);
```

The problem above is that you've shoved all the integrations into a coarsely-typed PluggableFactorySet variable and destroyed the subtle mapping information Typescript needs to figure out which module names go with which param types. If you need to store your munged-together PluggableFactorySet in a variable, let Typescript infer the type:

```typescript
// This is just fine.
const integrations = {
  ...CoreIntegrations,
  ...SqlIntegrations,
  ...GcsIntegrations,
  ...LocalIntegrations,
};

const s = new OprServer(
  {
    // A bunch of configuration stuff goes here
  },
  integrations
);
```

In some cases, you may not want to take all the PluggableFactories in an integration. Let's say you want your tenant nodes to be able to use `StaticAccessControlList`, but none of the other integrations from `CoreIntegrations`. You could do it this way:

```typescript
const s = new OprServer(
  {
    // A bunch of configuration stuff goes here
  },
  {
  StaticAccessControlList: CoreIntegrations.StaticAccessControlList
  ...SqlIntegrations,
  ...GcsIntegrations,
  ...LocalIntegrations,
  }
);
```

That works great, and Typescript won't complain at all.

In some cases, this Typescript cleverness might get in your way. Maybe you've written a clever startup wrapper around your server that requires you to dynamically import all your libraries, so there's no way to build a typed map of module names to pluggable factories.

In those cases, you can always use the nuclear option:

```typescript
// The <any> below effectively disables type checking on your
// server config.
const s = new OprServer<any>(
  {
    // A bunch of configuration stuff goes here
  },
  someCrazyHandcraftedPluggableFactorySet
);
```

Only do this if you're absolutely certain _why_ you have to do it. Most of the time, compilation errors around your server config indicate a serious mistake in configuring your server or writing your integrations, and it's much better to actually figure out what the problem is.

### Publishing Integrations

All integrations in a module should be published from a single `PluggableFactorySet` (basically a `Record<string, PluggableFactory>`). See [`core/integrations.ts`](https://github.com/google/open-product-recovery/blob/main/components/core/src/integrations.ts) and [`sql-database/integrations.ts`](https://github.com/google/open-product-recovery/blob/main/integrations/sql-database/src/integrations.ts) for examples.

### Working with PluggableFactory Params

Most of the time, the simplest and clearest way to write a PluggableFactory is to do it with a minimum of explict type declarations on your factory, like so:

```typescript
export interface HelloWorldPluggableFactoryParams {
  greeting?: string;
}

export const HelloWorldPluggableFactory = {
  async construct(params?: HelloWorldFactoryParams) {
    return {
      type: 'integrationInstaller',

      async install(handlerRegistry: HandlerRegistry) {
        api.installCustomHandler('greet', {
          method: ['GET', 'POST'],
          handle: async () => {
            const greeting = params?.greeting ?? 'Hello world.';
            return greeting + ' from ' + api.hostOrgUrl;
          },
        });
      },
    };
  },
};
```

You can provide whatever type you like for the first parameter of your `construct()` method (or omit the parameter entirely), and the compiler will do all the right inferences to figure out the generic type parameters of your PluggableFactory.

If you need to declare the type of your PluggableFactory, see the [`PluggableFactory`](https://github.com/google/open-product-recovery/blob/main/components/core/src/integrations/pluggablefactory.ts) source code for details of how to declare the generic type parameters of the interface.

### Using the Tenant Node URL in a PluggableFactory

Many integrations can get the tenant node org URL from the `IntegrationApi` object. But some integrations need that information in `PluggableFactory.construct()` while they're building the `Pluggable` object. In those cases, you need the rarely-used second agurment to `PluggableFactory.construct`: the context argument.

The context argument contains information relevant to the context in which the factory is being called. Today, this is always information about the current tenant node, and it always has the type [`TenantNodeIntegrationContext`](https://github.com/google/open-product-recovery/blob/main/components/core/src/config/tenantnodeintegrationcontext.ts).

For example, [`LocalKeySignerIntegration`](https://github.com/google/open-product-recovery/blob/main/components/core/src/auth/local/localkeysigner.ts) needs to know the current tenant node org url in order to build a `LocalKeySigner` object. Its code looks like this:

```typescript
export const LocalKeySignerIntegration = {
  async construct(
    json: LocalKeySignerIntegrationOptions,
    context: TenantNodeIntegrationContext
  ) {
    // Omitted: A bunch of code to double check that the host org url
    // and private key parameters are valid.
    return new LocalKeySigner(context.hostOrgUrl, json.privateKey);
  },
};
```

## Background - How an OPR Server Works

### One Server, Many Tenants

As of version 0.7.0, OPR is a multi-tenant system, meaning that every OPR server, no matter how humble, can act as a virtual server for multiple "tenants". Each "tenant" is an OPR organization that "lives" on that server.

Each organization in a multi-tenant server is totally independent. Although their data is stored in a common location (and some behind-the-scenes optimizations may occur to ensure that identical offer snapshots are shared between organizations that can see them), each organization in a multi-tenant server has its own encryption keys, its own list of offers, its own policies, and, crucially, it's own integration configuration. You can run a server where one tenant sends out new offer notifications via Google Cloud PubSub, and another sends out notifications via Microsoft Teams.

Thus, there are two kinds of settings in an OPR server. There are _global settings_, which applies to the server as a whole, and _per-tenant settings_, which apply to a single organization on the server. When you're setting up a server, configuration an organization on a server, or building a new integration, it's essential to understand which settings are global and which settings are per-tenant.

### Lifecycle of an OPR Request

#### Startup

Every OPR server is started by constructing an instance of the [OprServer](https://github.com/google/open-product-recovery/blob/main/components/core/src/server/oprserver.ts) class. This class requires two arguments: the server configuration JSON, and an _integration map_. Many fields in the JSON configuration allow the server admin to specify a PluggableFactory - that is, some external library that builds an object the server needs to start up. The PluggableFactory name, and all the information needed to configure it, is specified in the JSON configuration file. The set of available PluggableFactories is specified in the integration map.

The server's configuration JSON specifies all the server's _global settings_. Those settings are fixed for the lifetime of the server, and they require the server to be restarted to change these settings.

The server simply stores the JSON configuration and the integration map until the start() method is called. At that point, the server configuration is _resolved_. Any PluggableFactories named in the configuration JSON are looked up in the integration map, and the PluggableFactory's construct() method is called to build the Pluggable object the server needs. If the configuration JSON specifies a PluggableFactory that isn't in the integration map, the server throws an exception and dies.

#### Handling a Request

When the server receives any HTTP request, it runs the URL through its TenantIdExtractor (which was itself loaded in the global server configuration). If the tenant id extractor returns a string, it means that the request needs to be directed to the server's tenant with the given id. If the tenant id extractor returns undefined, it means the request needs to be routed to some global server endpoint (see Global Endpoints).

If a tenant id was extracted from the URL, the server uses its TenantNodeConfigProvider (also specified in the global server configuration) to load the Tenant Node JSON configuration for that tenant. If the tenant id is valid, the TenantNodeConfigProvider will a JSON object that explains how to configure the tenant to handle the request.

Just like the server configuration, the tenant node configuration JSON contains many fields that specify a PluggableFactory. As soon as the tenant configuration JSON is loaded, it is resolved against the server's integration map. If the host configuration JSON specifies PluggableFactories that aren't in the integration map, the request fails (but the server stays up).

The resolved host configuration is used to construct an OprTenantNode. The OprTenantNode runs any TenantNodeIntegrationInstallers that were specified in the configuration, handles the request, _uninstalls_ the integrations that were just installed, and the tenant node is destroyed. Well, the server might decide to cache a tenant node for a little while, but developers should assume that a tenant node is constructed and completely torn down on every request.

#### TLDR; Implications of this Model for Admins and Integration Developers

1. The server needs to know the complete set of all plugins that the server _or any of its tenants_ will use when it starts up.
2. The server will fail catastrophically if a bad plugin is specified in the global configuration.
3. The server can recover if a bad plugin is specified in a tenant configuration, but the tenant node is effectively dead until its configuration is fixed.
4. Global configuration is loaded once, on server startup, and will not be reloaded until the server is rebooted.
5. Tenant configuration is loaded on every single request (subject to caching).

## PluggableFactories and Pluggables

OPR servers and tenants are configured by specifying the name and parameters of various PluggableFactories. As you might guess, a PluggableFactory knows how to use JSON parameters to construct some Pluggable object. For example, a server configuration might look like this:

```javascript
    {
      storage: {
        moduleName: 'SqlStorage',
        params: getDbOptions(),
      },
      tenantMapping: {
        moduleName: 'TemplateHostIds',
        params: {
          urlTemplate: hostname + '/orgs/$',
        },
      },
      tenantSetup: {
        moduleName: 'GcsMultitenant',
        params: {
          bucket: gcsHostFileBucket,
        },
      },
      hostName: hostname,
    },
```

Note that the `storage`, `tenantMapping` and `tenantSetup` fields all have the same structure. This is the format for specifying a PluggableFactory. The `moduleName` field tells OPR where to find the PluggableFactory in the server's integration map, and the `params` field tells OPR what parameters to pass to the PluggableFactory when constructing the Pluggable.

A Pluggable is some object that the server or tenant uses for some aspect of its behavior. The [Pluggable interface](https://github.com/google/open-product-recovery/blob/main/components/core/src/integrations/pluggable.ts) has very little behavior of its own - every pluggable has just one required field: `type`. The Pluggable type field describes what kind of object this Pluggable is, and where it can be used in a server configuration.

[`pluggable.ts`](https://github.com/google/open-product-recovery/blob/main/components/core/src/integrations/pluggable.ts) describes in detail what pluggable types exist, what they're used for, and what interfaces implement each type of pluggable.

### Global Server Pluggables

The following pluggables are used to configure global server behavior:

- `storage` - Implemented by the PersistentStorage interface. Used for storing and retrieving all Offers (and related information) for all hosts on the server.
- `tenantMapping` - Implemented by the TenantIdExtractor interface. Used to map URLs to tenant ids.
- `tenantSetup` - Implemented by the TenantNodeConfigProvider interface. Uused to load JSON configuration information for each tenant on a server.

### Tenant Node Pluggables

The following pluggables are used to configure tenant node behavior:

- `listingPolicy` - Implemented by the OfferListingPolicy interface. Used for determining how to list offers to other organizations.
- `signer`: Implemented by the Signer interface. Used for signing authenticated requests to other organizations.
- `jwksProvider`: Implemented by the JwksProvider interface. Used for serving public keys for this organization.
- `verifier`: Implemented by the Verifier interface. Used for verifying whether requests from external organizations are authentic. Most organizations use the default Verifier implementation and do not configure this Pluggable.
- `accessControlList`: Implemented by the ServerAccessControlList interface. Used to determine what organizations can make requests to this organization.
- `offerProducer`: Implemented by the OfferProducer interface. Used to read or generate new offers from some source outside of OPR.
- `integrationInstaller`: Implemented by the TenantNodeIntegrationInstaller interface. Used to install endpoints and listeners during TenantNode startup. Any integration that sends notifications for new offers, accepted offers, or otherwise needs to observe the state of offers on a server will implement a TenantNodeIntegrationInstaller.
