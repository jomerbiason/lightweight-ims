# Session Handoff — Lightweight IMS

**Current release:** V1.3.2
**Previous release:** V1.3.1
**Purpose:** allow any future user session to continue the project without depending on previous chat context.

## Start here

1. Read `docs/PROJECT-LOG.md`.
2. Read `docs/release-v1.3.2.md`.
3. Inspect `CHANGELOG.md` for release history.
4. Do not overwrite or remove the project log when creating a new version. Append to it.

## Current state

V1.3.2 is a stabilization/testing release. Inventory services are centralized, reversals are auditable, `.store` files use format V2 with V1 migration support, and the project contains regression tests.

## Verification state

- Source TypeScript strict check: **PASS**.
- Full Vitest suite: **PENDING** because dependencies were not installed in the current environment.
- Vite production build: **PENDING** because dependencies were not installed in the current environment.
- CI install command: `npm install` (no lockfile is currently committed).

## Important files

- `src/services.ts` — inventory mutations, sales, stock counts, reversals, CSV helpers.
- `src/storefile.ts` — `.store` validation, V1 → V2 migration, pack/unpack.
- `src/migrations.ts` — store migration helpers.
- `tests/services.test.ts` — inventory service tests.
- `tests/v1.3.test.ts` — compatibility/regression tests.
- `tests/storefile.test.ts` — store-file tests.
- `docs/PROJECT-LOG.md` — mandatory change history.
- `docs/SESSION-HANDOFF.md` — current continuation state.

## Continuation checklist

- [ ] Run `npm install` successfully.
- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] If failures occur, fix them and append every change to `docs/PROJECT-LOG.md`.
- [ ] Update this handoff with actual verification results.
- [ ] Only then consider V1.4.0 feature development.
