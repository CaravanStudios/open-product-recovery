# Open Product Recovery

This is the monorepo for the reference implementation of the Open Product
Recovery standards. Open Product Recovery is a collection of standards and
implementations designed to facilitate sharing of excess products with
charitable (and secondary market) organizations.

## What is Open Product Recovery (OPR)?

Open Product Recovery is a specification for describing and communicating
about excess food (and other donatable products). OPR servers can publish offers
of donatable products to other OPR servers, and every OPR server hosts a public
REST API to allow other organizations to accept those offers.

## Is OPR useful for my organization?

Yes! If:

1. Your organization generates enough donatable products that you need a way to
   automatically tell charitable organizations that you have donations for them.
2. Or, your charitable organization needs to receive enough donatable products
   that you need a way to automatically discover donations.

Ideally, your organization already has an inventory system that tracks the
donations you work with. OPR has a flexible plugin system that allows it to
read and write offers to and from just about any storage system with an API.

## What is in this repository?

This repository contains a number of nodejs projects that work together to
implement the OPR specification. Please read the README file in each of the
subdirectories to find out more about the libraries in each component.

## How do I get started?

### Install deps and build

First, install the node dependencies and run npm build on each package. You can do this manually, but there are dependencies between the packages, so it has to be done in a particular order. The easiest way to install all the dependencies and build the packages is to run:

```
./setup.sh
```

from the root directory.

### Run the unit tests

Run

```
./test.sh
```

from the root directory to run all the unit tests. If you want to run the Postgres tests in opr-sql-database, you need to have a working installation of Postgres and the `initdb`, `postgres` and `psql` commands must be in your `PATH` environment variable. If those commands aren't available, the Postgres tests will be skipped.

### Start configuring your own OPR server

The examples in `opr-example-server` are a great place to start.
