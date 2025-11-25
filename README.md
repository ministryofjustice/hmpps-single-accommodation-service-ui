# HMPPS Single Accommodation Service (SAS UI)

[![Ministry of Justice Repository Compliance Badge](https://github-community.service.justice.gov.uk/repository-standards/api/hmpps-single-accommodation-service-ui/badge?style=flat)](https://github-community.service.justice.gov.uk/repository-standards/hmpps-single-accommodation-service-ui)
[![Docker Repository on ghcr](https://img.shields.io/badge/ghcr.io-repository-2496ED.svg?logo=docker)](https://ghcr.io/ministryofjustice/hmpps-single-accommodation-service-ui)

Repository for the UI for the Single Accommodation Service (SAS).

## Requirements

- [Node.js](https://nodejs.org/en/) version 24
- [Docker](https://www.docker.com/) (if running against a containerised local stack)

## Install dependencies

```shell
npm install
```

## Running the application

To run the SAS service locally, first copy the `.env.template` file to `.env`. The default variables should be sufficient for local development against a containerised local stack:

```shell
cp .env.template .env
```

### Running against a containerised local stack

First, bring up the local stack:

```shell
docker compose up --scale=app=0
```

You can then start the SAS UI service: 

```shell
npm run start:dev
```

The service will be available at http://localhost:3000. You can login with the following credentials:

- username: `AUTH_USER`
- password: `password123456`

### Running against the dev stack

You can also run the local service against the dev external service (HMPPS Auth and SAS API). Get the `.env` file from the CAS vault of the [MoJ 1Password](https://ministryofjustice.1password.eu/signin) account.

You can then start the SAS UI service: 

```shell
npm run start:dev
```

The service will be available at http://localhost:3000. You can then login using any of the CAS test credentials available in the CAS vault in 1Password.

## Local development

Commit hooks have been set up to run linters, typecheck and unit tests on commit. You can also run these manually.

### Running linter

- `npm run lint` runs `eslint`.
- `npm run typecheck` runs the TypeScript compiler `tsc`.

### Running unit tests

`npm run test`

### Running integration tests

For local running, start a wiremock instance by:

`docker compose -f docker-compose-test.yml up`

Then run the server in test mode by:

`npm run start-feature` (or `npm run start-feature:dev` to run with auto-restart on changes)

After first install ensure playwright is initialised: 

`npm run int-test-init`

And then either, run tests in headless mode with:

`npm run int-test`

Or run tests with the UI:

`npm run int-test-ui`

## Change log

A changelog for the service is available [here](./CHANGELOG.md)
