# xq-contracts

OpenAPI specs, protobuf definitions, and database schema for the XQ Fitness platform. Generated API clients for TypeScript and Python are published automatically from this repository.

## Contents

| Directory | Description |
|---|---|
| `rest/` | OpenAPI 3.0 specs for the read and write services |
| `proto/` | Protobuf definitions |
| `database/` | Prisma schema |
| `scripts/` | Client generation scripts |
| `rest-gen/` | Generated TypeScript clients (git-ignored) |
| `rest-gen-py/` | Generated Python clients (git-ignored) |

## API Specs

- **Read Service** — `rest/read-service-api.yaml` — query endpoints for workout data, muscle groups, and routines
- **Write Service** — `rest/write-service-api.yaml` — create, update, and delete operations

## Generating Clients

| Language | Guide |
|---|---|
| TypeScript | Run `node scripts/publish-clients.js` — publishes to GitHub Packages as `@chauhaidang/<spec-name>` |
| Python | See [doc/generating-python-clients.md](doc/generating-python-clients.md) |

## CI

Both TypeScript and Python clients are built and published automatically on pushes to `main` that affect `rest/`.

- [`.github/workflows/publish-clients.yml`](.github/workflows/publish-clients.yml) — TypeScript
- [`.github/workflows/publish-python-clients.yml`](.github/workflows/publish-python-clients.yml) — Python

## License

Apache-2.0
