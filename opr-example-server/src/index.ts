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

/**
 * An example (fake) server.
 *
 * This uses server uses an in-memory database and is designed to create fake
 * offers, on request. It is useful for getting a feel for an OPR server's main
 * components, and can be used as a "partner" node for local development.
 */
import {
  generateKeys,
  LocalJwksProvider,
  LocalKeySigner,
  log,
  OprServer,
  OrgConfigProvider,
  RegexpUrlMapper,
  StaticFeedConfigProvider,
  UniversalAcceptListingPolicy,
  StaticServerAccessControlList,
  FakeOfferProducer,
  OfferChange,
  CustomRequestHandler,
} from 'opr-core';
log.setLevel('WARN');
import {SqlOprDatabase} from 'opr-sql-database';

// Let's start by setting up some varaibles for how the server will work. You
// can change these either here in the code or by setting them as env variables.

const HOST_PORT = process.env.HOST_PORT ?? 5000;
const HOST_ORG_URL = process.env.HOST_ORG_URL ?? `http://localhost:${HOST_PORT}/org.json`

// We need a main method because we want to use the "await" keyword,
// and it's not allowed in top-level script code. But we can declare an
// async main method and immediately call it.

async function main() {
  // Let's put together all the pieces of a working server.

  // If we want to redirect remote requests to another URL, we can use a URL
  // mapper. This mapper redirects requests to our public URL to our local debug
  // servers. Obviously don't do this in production.
  const urlMapper = new RegexpUrlMapper([
    {
      input: /https:\/\/opr.examplehost.org\/(.*)/,
      replacement: 'http://localhost:' + HOST_PORT + '/$1',
    },
  ]);

  // Create an org config provider with the url mapper we configured above. This
  // way, org configuration information will be fetched from local servers
  // instead of the public org url.
  const orgConfigProvider = new OrgConfigProvider({
    // TODO: Remove this in production.
    urlMapper: urlMapper,
  });

  // Create a frontend configuration. This tells the server how to create the
  // organization config file, and how to map its contents to server endpoints.
  const frontendConfig = {
    // Replace with your organization name
    name: 'ExampleServer',
    // Replace with your organization's public org descriptor URL
    organizationURL: HOST_ORG_URL,
    orgFilePath: '/org.json',
    jwksURL: '/jwks.json',
    listProductsPath: '/api/list',
    acceptProductPath: '/api/accept',
    rejectProductPath: '/api/list',
    reserveProductPath: '/api/list',
    historyPath: '/api/list',
  };

  // Create an access control list that allows us to control which organizations
  // can talk to this server. For now, we'll add a single 'wildcard' entry with
  // '*', this tells the server that it should show offers to everyone.
  // YOU ALMOST CERTAINLY DON'T WANT A WILDCARD IN A PRODUCTION SERVER!
  const accessControlList = new StaticServerAccessControlList([
    // Replace this with a list of servers that can actually talk to your
    // OPR server
    // 'https://opr.otherexamplehost.org/org.json',
    '*' // This is the 'wildcard' option - it makes offers public to everyone!
  ]);
  // Deal with encryption keys. For this toy server, we're generating new keys
  // every time the server starts. In production, they should be loaded from
  // stable storage, like a cloud provider storage system. But this works fine
  // for local testing.
  const pair = await generateKeys('RS256');
  const PRIVATE_KEY = pair.privateKey;
  const PUBLIC_KEY = [pair.publicKey];
  // Create a public keyset provider to return the public keys.
  const jwksProvider = new LocalJwksProvider(async () => {
    return PUBLIC_KEY;
  });

  // Create a Signer that can use the private keys to create tokens.
  const signer = new LocalKeySigner(
    frontendConfig.organizationURL,
    PRIVATE_KEY
  );
  // Create a feed config provider so we can fetch a list of feed configurations
  const feedConfigProvider = new StaticFeedConfigProvider([
    // Uncomment below to read from other servers.
    // {
    //   organizationUrl: 'https://opr.yetanotherexamplehost.org/org.json',
    //   maxUpdateFrequencyMillis: 1000,
    // },
  ]);
  // Create a listing policy so that we know how to list ingested offers to
  // other servers. For now, we'll add a single 'wildcard' entry with '*', this
  // tells the server that it should show offers to everyone.
  const listingPolicy = new UniversalAcceptListingPolicy([
    // 'https://opr.otherexamplehost.org/org.json', // Example "real" entry
    '*' // This is the 'wildcard' option - it makes offers public to everyone!
  ]);
  // Start a local in memory server to track offers.
  // Build a database. Note you can use many different database types here.
  const database = new SqlOprDatabase({
    dsOptions: {
      type: 'sqlite',
      database: ':memory:',
      // DON'T USE THE NEXT TWO OPTIONS IN PROD!!!
      // This option forces the database to rewrite table schemas to match the
      // entity descriptions in code.
      synchronize: true,
      // This option drops all TypeOrm tables when the database starts up.
      dropSchema: true,
    },
    listingPolicy: listingPolicy,
    signer: signer,
    hostOrgUrl: frontendConfig.organizationURL,
    enableInternalChecks: true,
  });

  // We create a fake offer producer. Replace this with an offer producer that
  // reads from your inventory system to publish new offers.
  const fakeOfferProducer = new FakeOfferProducer({
    sourceOrgUrl: frontendConfig.organizationURL,
    database: database,
    updateFrequencyMillis: 3000,
    newItemFrequencyMillis: 10000,
  });

  // Create a custom endpoint that will call server.ingest() to pull in any
  // new offers, and return any changes that occurred.
  // NOTE: For a real server, you probably want to require some authentication
  // to call this endpoint. Otherwise bad guys might hammer your server with
  // ingest() requests.

  // Here, we are only using one OfferProducer, the "FakeOfferProducer".
  // in this example, ingest() will call the FakeOfferProducer and generate fake
  // offers for testing/demo use.
  const ingestEndpoint = {
    method: ['GET', 'POST'],
    handle: async () => {
      const changes = [] as Array<OfferChange>;
      const changeHandler = database.registerChangeHandler(async change => {
        changes.push(change);
      });
      await s.ingest();
      changeHandler.remove();
      return changes;
    },
  } as CustomRequestHandler;

  // Create a custom debug endpoint that will return the list of ALL offers on
  // this server.
  // ADD AUTHENTICATION TO AN ENDPOINT LIKE THIS! This is exposing all offers
  // on your server to anyone that calls this endpoint. For a real server,
  // only admins and developers should be able to see this information.
  // Organizations should only see offers that are listed for them.
  const allOffersEndpoint = {
    method: ['GET', 'POST'],
    handle: async () => {
      return await database.getAllOffers();
    },
  } as CustomRequestHandler;

  // Now we have all the pieces to start our server.
  const s = new OprServer({
    frontendConfig: frontendConfig,
    orgConfigProvider: orgConfigProvider,
    database: database,
    jwksProvider: jwksProvider,
    signer: signer,
    client: urlMapper,
    accessControlList: accessControlList,
    feedConfigProvider: feedConfigProvider,
    producers: [fakeOfferProducer],
    customHandlers: {
      ingest: ingestEndpoint,
      allOffers: allOffersEndpoint,
    },
  });
  s.start(5000);
}
main();
