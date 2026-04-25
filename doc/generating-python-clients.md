# Generating Python API Clients

Python clients are generated from the OpenAPI specs in [`rest/`](../rest/) using [openapi-python-client](https://github.com/openapi-generators/openapi-python-client). Each spec produces a standalone, installable Python package under `rest-gen-py/`.

## Prerequisites

- [uv](https://docs.astral.sh/uv/) installed
- `openapi-python-client` CLI available via uv tools

```bash
uv tool install openapi-python-client
```

## Running the Generator

From the repo root:

```bash
uv run scripts/generate_python_clients.py
```

`uv run` automatically resolves the script's inline dependencies (declared via PEP 723) — no manual `pip install` needed.

This reads every `.yaml` / `.json` file from `rest/`, generates a typed Python package for each, and writes the output to `rest-gen-py/`.

## Output Structure

```
rest-gen-py/
├── read-service-api/        # Generated from rest/read-service-api.yaml
│   ├── pyproject.toml
│   ├── README.md
│   └── read_service_api/
│       ├── __init__.py
│       ├── client.py
│       ├── models/
│       └── api/
└── write-service-api/       # Generated from rest/write-service-api.yaml
    ├── pyproject.toml
    ├── README.md
    └── write_service_api/
        ├── __init__.py
        ├── client.py
        ├── models/
        └── api/
```

The package version is automatically synced from the `info.version` field in each OpenAPI spec.

## Using a Generated Client in Another Project

Install directly from GitHub Packages:

```bash
uv add chauhaidang-read-service-api --index https://pypi.pkg.github.com/chauhaidang/
```

Or install locally during development:

```bash
uv add ./path/to/rest-gen-py/read-service-api
```

Basic usage:

```python
from read_service_api import AuthenticatedClient
from read_service_api.api.muscle_groups import get_muscle_groups

client = AuthenticatedClient(base_url="http://localhost:3000/api/v1", token="your-token")

with client as c:
    muscle_groups = get_muscle_groups.sync(client=c)
```

## CI / Publishing

The workflow [`.github/workflows/publish-python-clients.yml`](../.github/workflows/publish-python-clients.yml) runs automatically on pushes to `main` that affect `rest/` or the generator script. It:

1. Generates all clients
2. Builds wheel and sdist distributions via `uv build`
3. Publishes to GitHub Packages using `twine`

To trigger manually, use the **workflow_dispatch** option in the Actions tab.

## Adding a New API Spec

Drop a new `.yaml` or `.json` OpenAPI file into `rest/`. The generator and CI workflow will pick it up automatically — no script changes needed.
