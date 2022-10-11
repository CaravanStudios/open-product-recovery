/**
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A fake example server.
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
} from 'opr-core';
log.setLevel('WARN');
import {PostgresTestingLauncher, SqlOprDatabase} from 'opr-sql-database';
import {FakeOfferProducer} from './fakeoffers';

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
      replacement: 'http://localhost:5000/$1',
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
    organizationURL: 'https://opr.examplehost.org/org.json',
    orgFilePath: '/org.json',
    jwksURL: '/jwks.json',
    listProductsPath: '/api/list',
    acceptProductPath: '/api/accept',
    rejectProductPath: '/api/list',
    reserveProductPath: '/api/list',
    historyPath: '/api/list',
  };

  // We create a fake offer producer. Replace this with an offer producer that
  // reads from your inventory system to publish new offers.
  const offerProducer = new FakeOfferProducer(frontendConfig.organizationURL);

  // Create an access control list that allows us to control which organizations
  // can talk to this server.
  const accessControlList = new StaticServerAccessControlList([
    // Replace this with a list of servers that can actually talk to your
    // OPR server
    'https://opr.otherexamplehost.org/org.json',
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
  // other servers.
  const listingPolicy = new UniversalAcceptListingPolicy([
    // Replace with URLs of servers you'd like to share to.
    'https://opr.otherexamplehost.org/org.json',
  ]);
  // Start a local postgres database that we'll throw away on shutdown.
  const pg = new PostgresTestingLauncher();
  await pg.start();
  // Build a database. This implementation is the in-memory database version
  // used for unit testing.
  const database = new SqlOprDatabase({
    dsOptions: {
      type: 'postgres',
      host: 'localhost',
      database: 'oprtest',
      port: pg.getPort(),
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
  database.registerChangeHandler(async change => {
    log.warn(
      'New database contents',
      await database.list('https://opr.otherexamplehost.org/org.json', {})
    );
  });

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
    producers: [offerProducer],
  });
  s.start(5000);

  // Make a request to ingest new offers every 3 seconds.
  setInterval(async () => {
    try {
      await s.ingest();
    } catch (e) {
      console.log('Ingestion failed', e);
    }
  }, 3 * 1000);
}
main();
