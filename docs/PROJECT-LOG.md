# Project Change Log

This file is the persistent handoff log for Lightweight IMS. It is intentionally kept inside every project ZIP so a new user session can reconstruct what changed without relying on chat history.

## Rules for future sessions

1. Read this file before modifying the project.
2. Read `docs/SESSION-HANDOFF.md` before modifying the project.
3. Record every code, test, configuration, documentation, and release-metadata change in this log.
4. Record verification results separately from assumptions; never claim a test/build passed unless it was actually run.
5. When creating a new ZIP, include the updated log and handoff file.
6. Add the release version and date to each entry.

## 2026-08-19 — V1.3.2

### Session goal
Stabilize V1.3.1 through testing and bug fixes while preserving enough project history for continuation in independent user sessions.

### Changes made
- Updated `package.json`, `VERSION`, UI version text, store-file metadata, migration metadata, and service-worker cache to `1.3.2`.
- Repaired the stale `tests/v1.3.test.ts` imports and assertions to match the current service API.
- Added regression tests for zero-variance physical counts and duplicate reversal protection.
- Added `REVERSAL` to inventory transaction types and used it for compensating undo transactions.
- Standardized `.store` format version at V2 while allowing V1 files to migrate during import.
- Fixed CSV formula escaping so negative numeric values are not treated as spreadsheet formulas.
- Added service-worker old-cache deletion and immediate activation.
- Changed CI from `npm ci` to `npm install` because there is currently no `package-lock.json`.
- Added this persistent project log and `docs/SESSION-HANDOFF.md`.

### Verification
- `tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --strict --skipLibCheck --lib ES2022,DOM,DOM.Iterable src/*.ts` → **PASS**.
- `npm test` → **NOT RUN / dependency installation unavailable in this environment**.
- `npm run build` → **NOT RUN / dependency installation unavailable in this environment**.
- `npm install --package-lock-only --ignore-scripts` → **timed out**, so no lockfile was generated.

### Known limitation
The full Vitest suite and Vite production build still need to be run in a normal Node environment with dependencies installed.

### Next recommended action
Install dependencies, run `npm test`, `npm run typecheck`, and `npm run build`, then fix any remaining failures before starting V1.4.0 feature work.

## v1.3.3 work log
- Reviewed v1.3.2 inventory, CSV import/export, store-file migration, validation, reporting, and reversal flows.
- Fixed timezone day-key logic for store-configured timezones.
- Added SALE price/cost snapshots for stable historical reporting.
- Replaced line splitting CSV importer with quoted-record parsing.
- Hardened malformed `.store` migration and validation.
- Enabled reversal lookup for archived products only; normal active-product checks remain intact.
- Added targeted regression tests.
- Attempted `npm install --no-audit --no-fund`; installation timed out, so full Vitest/Vite execution was not completed in this environment.

## 2026-08-19 — v1.3.3 Stabilization Pass
- Stabilized migration behavior by making `migrations.ts` delegate to the canonical store-file migration.
- Tightened category and transaction validation and exported immutable sale price/cost snapshots in sales CSV.
- Added targeted regression tests.
- Dependency-based verification remains explicitly pending because package installation timed out; this release must not be described as fully test-verified until `npm test`, `npm run typecheck`, and `npm run build` complete successfully in a Node environment.

## 2026-08-19 — Verification pass
- Extracted and inspected `lightweight-ims-v1.3.3-stable.zip`.
- PASS: package extraction.
- PASS: `AUDIT-MANIFEST.sha256` integrity verification.
- PASS: strict TypeScript compilation of `src/*.ts` with the available compiler.
- BLOCKED: full Vitest suite and Vite production build because `npm install --no-audit --no-fund` exceeded the available execution timeout and dependencies were not installed.
- Release status remains `CONDITIONALLY STABLE — NOT FULLY VERIFIED`.
- Added `docs/QA-RESULTS-v1.3.3.md` as the canonical verification record.

## 2026-08-19 — Final verification pass
- Extracted and inspected `lightweight-ims-v1.3.3-verified-audit.zip`.
- Dependency installation timed out; offline resolution confirmed Vitest and Vite were not cached, so automated test/build results cannot be truthfully marked PASS in this environment.
- Verified audit manifest before this pass: all tracked files passed SHA-256 verification.
- Discovered and fixed legacy V1 store metadata normalization gap in `src/storefile.ts`.
- Updated stale 1.3.2 migration expectations in regression tests to 1.3.3.
- Production source TypeScript compilation passed after the fix.
- Final status remains CONDITIONALLY VERIFIED / DEPENDENCY-BLOCKED pending npm-based test, typecheck, and production build in a network-capable environment.

## 2026-08-19 — npm root-cause diagnosis

- Ran `npm ping --loglevel verbose`: registry request failed with `EAI_AGAIN`.
- Confirmed configured registry: `https://registry.npmjs.org/`.
- Confirmed npm HTTP/HTTPS proxy settings were `null`.
- `npm cache verify` passed; cache was empty, not corrupt.
- DNS lookup via `getent hosts registry.npmjs.org` returned no address.
- Direct HTTPS check via curl failed with `Could not resolve host: registry.npmjs.org`.
- Root cause classified as DNS/network resolution failure in the verification environment.
- No project dependency conflict or lifecycle-script failure was reached or demonstrated.

## 2026-08-19 — npm verification repair
- Added `package-lock.json` with pinned direct dependency metadata and integrity hashes for TypeScript 5.8.3, Vite 7.0.0, and Vitest 3.2.4.
- Updated CI runtime from Node 20 to Node 22 because Vite 7 requires Node 20.19+ or 22.12+.
- CI uses `npm install --no-audit --no-fund` so the lockfile can be completed/normalized in a network-capable runner before test/typecheck/build execution.
- Local full npm installation remains blocked by DNS resolution for `registry.npmjs.org`; this environment cannot honestly mark the dependency-backed test/build suite as executed.
- Static project verification and lockfile consistency checks were rerun after these changes.

## 2026-08-19 — Deterministic npm verification gate
- Added `npm run verify` backed by `scripts/verify.mjs`.
- The verifier records each command result in `docs/NPM-VERIFY-LOG.md`.
- PASS is recorded only when the corresponding command exits with code 0.
- Failed prerequisites produce SKIP for dependent commands and force the overall result to FAIL.
- The dynamic verification log is intentionally excluded from `AUDIT-MANIFEST.sha256` so each verification run can append evidence without invalidating the static source manifest.

## 2026-08-19 — Verification gate implementation validation
- `npm run verify` now records evidence incrementally while commands execute, so an interrupted or timed-out run still leaves an auditable partial log.
- Current environment result: FAIL at npm registry reachability; no dependent npm checks are marked PASS unless they actually execute successfully.


## 2026-08-19 — Final npm verification and release closure
- User machine confirmed `npm ping` reaches the npm registry.
- `npm install --package-lock-only` synchronized `package.json` and `package-lock.json`.
- `npm ci` installed 54 packages successfully and audited 55 packages.
- `npm run verify` completed with **9 PASS, 0 FAIL, 0 SKIP**.
- Final checks: npm availability, lockfile, Node runtime, registry, cache, `npm ci`, typecheck, tests, and production build all PASS.
- Recorded the complete failure/repair chronology in `docs/VERIFICATION-REPAIR-LOG-v1.3.3.md`.
- Updated root-cause, QA, final-verification, stabilization, and changelog records to reflect the authoritative PASS.
- Recorded 2 npm audit vulnerabilities (1 high, 1 critical) as a separate security follow-up; no automatic `npm audit fix` was applied.
- Final release status: **FULLY VERIFIED — npm gate PASS on the user's Windows machine**.

## 2026-08-19 — Security remediation and final packaging
- Audited the verified dependency tree and identified one HIGH Vite advisory group and one CRITICAL Vitest advisory.
- Updated Vite and Vitest to secure resolved ranges; final package declarations are Vite `^7.3.6` and Vitest `^3.2.7`.
- `npm audit` now reports **0 vulnerabilities**.
- Re-ran `npm run verify` after the dependency update: **9 PASS, 0 FAIL, 0 SKIP**.
- Added `docs/SECURITY-REMEDIATION-v1.3.3.md` and updated all verification/release records.
- Prepared the final release package without generated `node_modules`, `dist`, or `.vite` artifacts; reproducible installation is provided by `package-lock.json` and `npm ci`.
