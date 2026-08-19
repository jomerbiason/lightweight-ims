## 1.3.3 — Security Remediation & Final Release Closure
- Remediated the Vite HIGH and Vitest CRITICAL npm audit findings by updating the development dependencies.
- Final dependency declarations: Vite `^7.3.6`, Vitest `^3.2.7`, TypeScript `^5.8.3`.
- Confirmed `npm audit` reports **0 vulnerabilities**.
- Re-ran the complete npm verification gate after remediation: **9 PASS, 0 FAIL, 0 SKIP**.
- Added `docs/SECURITY-REMEDIATION-v1.3.3.md` and updated the repair, stabilization, project, QA, and final-verification records.
- Final release ZIP excludes generated `node_modules`, `dist`, and `.vite` artifacts while retaining the synchronized `package-lock.json`.

## 1.3.3 — Final npm Verification Closure
- Completed the full `npm run verify` gate on the user's Windows machine: 9 PASS, 0 FAIL, 0 SKIP.
- Regenerated `package-lock.json` from the final `package.json` and confirmed strict `npm ci` succeeds.
- Documented and repaired the DNS-blocked verification environment, Windows path resolution, Windows npm spawn, unsupported Node runtime, and incomplete lockfile issues.
- Added `docs/VERIFICATION-REPAIR-LOG-v1.3.3.md` with the complete troubleshooting chronology and evidence.
- Updated QA, final verification, root-cause, project, and stabilization logs to reflect the authoritative PASS.
- Recorded 2 npm audit vulnerabilities (1 high, 1 critical) as a separate security follow-up; no dependency-changing audit fix was applied.

## 1.3.3 — Verification Gate Fix
- Fixed the cross-platform `npm run verify` project-root resolution on Windows by using `fileURLToPath(import.meta.url)` instead of URL pathname handling.
- Tightened Node.js validation to require Node 20.19+ or Node 22.12+, matching Vite 7 runtime requirements.
- Verification remains fail-closed: registry, install, typecheck, test, and build failures cannot be recorded as PASS.
- Verification output continues to be written incrementally to `docs/NPM-VERIFY-LOG.md`.

# Changelog

## 1.3.2 — Testing & Bug Fix
- Fixed the stale V1.3 regression test suite to use the current inventory service API.
- Added regression coverage for zero-variance stock counts, duplicate reversals, and typed reversal transactions.
- Corrected `.store` format version handling: V1 files migrate to V2, while V2 files are packed and validated consistently.
- Fixed CSV formula protection so formula-looking strings are escaped without prefixing negative numeric values.
- Bumped application, package, UI, migration, store-file, and service-worker metadata to `1.3.2`.
- Added service-worker cache cleanup so old application caches do not remain active after upgrades.
- Added persistent project/session logs and a handoff document so future user sessions can continue from the exact project state.
- Source-only strict TypeScript verification passes; full dependency-based tests/build remain pending because this environment could not complete dependency installation.

## 1.3.1 — Production Hardening Patch
- Fixed the inventory service API used by the application and automated tests.
- Added centralized inventory-change, stock-count, reversal, shopping-suggestion, and date helpers.
- Added transaction-returning inventory operations for reliable audit references.
- Preserved strict quantity, negative-stock, adjustment-reason, and CSV formula-safety rules.
- Fixed application, package, store-file, migration, UI, and service-worker version metadata to `1.3.1`.
- Added V1.3.1 release notes.

## 1.3.0 — Production Hardening
- Centralized inventory service layer for sale, stock-in, adjustment, stock count, and compensating undo.
- Strict quantity and negative-stock validation.
- Mandatory adjustment reasons.
- Versioned `.store` migration framework.
- CSV product/sales/movement export helpers with spreadsheet formula protection.
- All-or-nothing CSV validation helper.
- Added security, contributing, code-of-conduct, and production-readiness docs.
- Expanded automated tests.

## 1.2.0 — MVP Expansion
- MVP feature expansion and hardening.

## 1.1.0 — MVP Completion & Data Integrity
- `.store` validation, safety snapshots, inventory integrity improvements, CSV import, and CI foundation.

## 1.0.0
- Official V1 baseline.

## 1.3.3 — Data Integrity & Reporting Fix
- Stabilization pass: centralized migration behavior, tightened category/transaction validation, added sale snapshot CSV fields, and added regression coverage. Full dependency-based verification remains pending and is explicitly logged.
- Fixed timezone-aware daily sales grouping using the configured store timezone.
- Added immutable sale price/cost snapshots for new SALE transactions and updated reporting/export fallback behavior.
- Fixed CSV import handling for quoted and multiline values.
- Hardened `.store` migration and expanded validation for metadata, settings, shopping items, sessions, sale snapshots, and transaction stock arithmetic.
- Fixed reversal lookup so archived products can still have their existing transactions reversed safely.
- Added regression coverage for timezone keys, historical sale snapshots, archived-product reversals, and inconsistent transaction math.
- Kept the portable `.store` format at version 2 for backward compatibility.
- Full dependency-based test/build verification remains pending because npm dependency installation timed out in this environment.

## v1.3.3 — Verification audit update (2026-08-19)
- Added an explicit QA results record with actual PASS/BLOCKED outcomes.
- Verified package SHA-256 audit manifest successfully.
- Verified strict TypeScript compilation for all production source files successfully.
- Documented that dependency-based Vitest/typecheck/build checks remain blocked rather than marking them as passed.

## v1.3.3 — Final verification stabilization (2026-08-19)
- Fixed legacy V1 `.store` migration so required store metadata is normalized before V2 validation.
- Corrected stale regression expectations that still identified migrated files as application version 1.3.2.
- Re-ran production-source TypeScript compilation successfully after the migration fix.
- Recorded dependency-blocked Vitest/Vite verification status transparently in `docs/FINAL-VERIFICATION-v1.3.3.md`.

## Verification infrastructure diagnosis — 2026-08-19
- Isolated the blocked npm installation to DNS resolution failure in the verification environment.
- Added `docs/NPM-ROOT-CAUSE-v1.3.3.md` with reproducible evidence and remaining verification steps.

## 1.3.3 — npm verification repair

- Added `package-lock.json` with pinned direct dependency metadata and integrity hashes.
- Updated CI to Node 22 for Vite 7 compatibility.
- CI dependency installation remains `npm install --no-audit --no-fund` so a network-capable runner can complete/normalize the lockfile before verification.
- Local dependency-backed verification remains environment-blocked by DNS resolution of `registry.npmjs.org`.
