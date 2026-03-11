# The Masters Scripts — Copilot Instructions

## Project Overview

Tournament management system for "The Masters" — a Tetris competition. Manages player registration, bracket/qualifier tournaments, live broadcast overlays with OCR scoring, OBS scene control, and Google Sheets export.

**Language:** TypeScript (Deno runtime, no Node.js)
**Primary language for comments/UI:** Japanese

## Architecture

Monorepo with independent Deno projects sharing `common/` types:

| Module | Port(s) | Role |
|--------|---------|------|
| **backend** | 8518 | RPC API server — competition logic, player/stage management |
| **broadcast** | 8514 (HTTP), 8515 (WS), 8517 (WS OCR), 8519 (HTTP user) | DenoCG-based dashboard + live broadcast overlays |
| **user-controller** | 8520 | Player registration web app (ngrok tunneled) |
| **common** | — | Shared types and utilities |
| **spreadsheet-exporter** | Apps Script | Google Sheets export |
| **fallback-timer** | Apps Script | Backup timer via Google Sheets |
| **launcher** | — | Orchestrates builds and spawns all servers |

## Build & Run

```sh
# Full stack (builds everything, spawns all servers)
launch.bat
# or: deno task start  (from launcher/)

# Individual modules
deno task dev          # backend, broadcast, user-controller (watch mode)
deno task start        # backend, broadcast, user-controller (production)
deno task build        # broadcast, user-controller (esbuild bundles)
deno task test         # backend, common (Deno.test)
deno task check        # type checking (all modules)

# Apps Script deployment
deno task deploy       # spreadsheet-exporter, fallback-timer
```

## Code Conventions

### Naming
- Public API functions: `masters*` prefix (e.g., `mastersSetupCompetition`)
- Data stores: `*Store` suffix with injection key export
- Configuration types: `*Metadata`; runtime state: `*Data`
- Private fields: `#` prefix (true private fields)

### Patterns
- **Dependency Injection:** TC39 decorators via `inject.ts` — `@injectCtor([...keys])`, `register()`, `resolve()`. All stores are singletons resolved lazily.
- **Serialization:** Pluggable `Serializer<T>` — `FileSerializerManager` for production, `InMemorySerializerManager` for tests.
- **API style:** JSON-RPC over HTTP — `{ functionName, args }` → `{ body }` or `{ error }`.
- **Broadcast state:** DenoCG replicants (WebSocket-synced state) + messages + requests.
- **Client UI:** Lit 3 web components + Fluent UI Web Components.
- **Build:** esbuild with `@luca/esbuild-deno-loader` — `deno.json` imports are the bundler config.

### Imports
- Use `deno.json` import maps for external deps (`@std/`, `npm:`, `jsr:`).
- Cross-module imports use relative paths with `.ts` extension.

### Error Handling
- Throw `Error` with descriptive messages (Japanese for domain errors).
- Server catches all errors → returns JSON `{ error: message }`.
- Serializer returns `undefined` on read failure (with `console.warn`).

### Testing
- Framework: `Deno.test()` with nested `t.step()`.
- Test setup: `configureInject()` + `modifyInjectInMemory()` for isolated in-memory tests.
- Run: `deno task test` from backend/ or common/.

## Domain Terminology

| Term | Meaning |
|------|---------|
| **Round** (ラウンド) | Tournament bracket level: 1回戦, 敗者復活, 決勝 |
| **Group** (組) | Division within round: A組, Heat1, etc. |
| **Stage** (ステージ) | Single 8-player race (identified by Round + Group) |
| **Qualifier** (予選) | Points-based preliminary scoring format |
| **Wildcard** (ワイルドカード) | Tie-breaker additional qualifying slot |
| **Supplement Comparison** | Tie-breaking performance data for wildcards |
| **Grade** | Player skill level: 9 → S9 → GM (19 levels) |
| **Handicap** | Time offset based on player strength and bracket position |

## Key Files

- [backend/competition.ts](backend/competition.ts) — Core tournament logic (setup, scoring, advancement)
- [backend/api.ts](backend/api.ts) — All API endpoints
- [backend/inject.ts](backend/inject.ts) — DI container
- [common/common_types.ts](common/common_types.ts) — Shared domain types
- [broadcast/server/ocr_server.ts](broadcast/server/ocr_server.ts) — Live OCR score ingestion
- [broadcast/client/dashboard.ts](broadcast/client/dashboard.ts) — Admin control panel

## What NOT to Do

- Do not use Node.js APIs — this is a Deno project.
- Do not add `package.json` or `node_modules`.
- Do not remove `#` private fields in favor of TypeScript `private` keyword.
- Do not change the RPC API shape without updating `ApiFunctions` in `common_types.ts`.
- Do not hardcode ports — they are defined per-module in `deno.json` tasks.
