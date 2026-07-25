# Consumer context — xq-contracts

Hub-facing context for agents working from
[`xq-context-hub`](https://github.com/chauhaidang/xq-context-hub).

## Identity

| Field | Value |
| --- | --- |
| Repo | `xq-contracts` |
| Org | `chauhaidang` |
| Domain | `platform` |
| Default branch | `main` |
| Hub catalogue | `xq-context-hub` `org/catalogue.md` |

## Purpose

Shared contracts

## Boundary

**Owns:**

- Responsibilities described by the purpose above (see also hub domain
  `domains/platform/CONTEXT.md`)

**Does not own:**

- Org-wide conventions (see hub `org/conventions.md`)
- Other product repos’ implementation details

## Stack

- See this repository’s README and package manifests after checkout
- Published packages (if any) use the `@chauhaidang` GitHub Packages scope

## Agent entry

- Prefer this file for hub consumers
- Local agent instructions: `AGENTS.md` when present
- Domain glossary (hub): `xq-context-hub/domains/platform/CONTEXT.md`
- Org conventions (hub): `xq-context-hub/org/conventions.md`

## Verification

Run the verification commands documented in this repo’s README / `AGENTS.md`
before claiming done. If none exist yet, run the minimal smoke checks available
(`npm test`, `make test`, or language-equivalent) and report gaps.

## Hub pointer

Multi-repo plans and fan-out are orchestrated from
https://github.com/chauhaidang/xq-context-hub
(`CONTEXT-MAP.md` → `domains/platform/CONTEXT.md` → this checkout).
