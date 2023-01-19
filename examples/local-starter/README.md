# OPR Example Server

A very simple example server that shows what needs to be wired up to have
a working OPR node.

## Getting it Running

### With Docker
To run the example server in Docker, you'll need to build the image and then run
it locally.

```console
docker build -f Dockerfile.dev -t example-opr .
docker run -p 5000:5000 example-opr
```

Note you are welcome to change the port used by your local device.

### Without Docker
To run the server locally without docker, consider whether or not you are using
Lerna to do general work on the code base. If so the modules should have already
been built and you can simply run `npm run dev`.

If you are just wanting to try the example server in isolation, be sure to
install the packages first. For that case, use this:

```console
npm install
npm run dev
```

## Using the Server
Once it is running locally, you can reach the server here:

http://localhost:5000

To actually use it, you'll want to create some fake offers. This can be done
using the `/ingest` endpoint for a tenant. Each time you call `/ingest` the server will
(randomly) create or update fake offers. This is helpful for experimenting with
how offers might appear and update on a real OPR node.

Next, visit the `/myoffers` endpoint for a tenant to see all offers available from the
example server.

This example project adds two tenants: `main` and `other`. See the `tenantSetup` section
of [src/index.ts](src/index.ts) for how this is done. The full qualified paths for the
`ingest` and `myoffers` endpoints installed in [src/localintegrations.ts](src/localintegrations.ts)
are:

- http://localhost:5000/<tenant>/integrations/localmain/ingest
- http://localhost:5000/<tenant>/integrations/localmain/myoffers

For example, to create fake offers for the `main` tenant, you can hit 
`http://localhost:5000/main/integrations/localmain/ingest`

By default, the server is setup to allow wildcard requests. This means that any
valid OPR request from a valid node will be honored. So you can use this to test
a second node (such as one you're building!) to see whether you are able to read
and ingest the visible offers from this example server. To do that, add
`http://localhost:5000/main/org.json` into your `StaticServerAccessControlList`.
