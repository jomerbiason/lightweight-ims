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

## v1.3.3 Documentation Baseline Cleanup — 2026-08-19

- Updated `README.md` from stale v1.3.2 wording to the verified v1.3.3 release state.
- Documented the final npm verification result: `PASS: 9 | FAIL: 0 | SKIP: 0`.
- Documented the final dependency audit result: `0 vulnerabilities`.
- Documented Vite/Vitest security remediation and final dependency versions.
- Documented GitHub/Cloudflare deployment baseline.
- Documented release-package hygiene and excluded generated/local-only files.
- No application or business logic was changed by this documentation cleanup.

## v1.3.3 UI Personalization Enhancement — 2026-08-19

- Enhanced the UI without changing inventory business logic.
- Added Appearance settings for theme, language, accent color, and store name.
- Added Light / Dark / System theme handling with system preference detection.
- Added color picker and preset accent colors.
- Added safe defaults for existing stores so the new UI settings do not break older `.store` data.
- Added responsive settings layout and improved dark-mode readability.
- Kept `npm run verify` as the release gate; UI changes must still pass typecheck, tests, and build.

## Planned — Monetization (not yet implemented)

- **Decision (2026-08-20):** future monetization will be a **one-time purchase** to unlock Pro features/limits, not Google AdSense and not a recurring subscription.
- **Why:** the app is a private, single-user, offline-first PWA with no backend or accounts. AdSense is a poor fit (requires network, low traffic per user since each install is single-user). A subscription would require a backend, accounts, and online payment verification, which contradicts the zero-setup offline-first design.
- **Direction to implement later:** free tier with some limit/feature gate (e.g. product count cap, or gating barcode scanning / receipts / multi-language), unlocked via a one-time purchase producing a license key (e.g. via Gumroad, PayPal.me, or Buy Me a Coffee) that is entered manually and verified **offline** (e.g. a signed/hashed key check, no backend call required) — keeps the app's offline-first, no-account model intact.
- **Status:** deferred — no code changes made yet. Revisit and define the exact free-vs-Pro feature split before implementation.

## 2026-08-20 — Small-store feature batch (cart, credit, suppliers, cash reconciliation)

Implemented the following SMB-focused features, requested to be done back-to-back:

1. **Multi-item cart checkout** — Sales page reworked into a cart: add multiple products with quantities, then check out as one grouped sale (items share a generated `referenceId`) with a single combined receipt. No schema/version change; reused the existing `referenceId` field on `InventoryTransaction`.
2. **Frequently-sold quick-add** — Sales page shows a chip strip of the top products sold in the last 30 days for one-tap add-to-cart.
3. **Expiring-soon alerts** — Low Stock page now also lists active products expiring soon/expired with a quick Sell action, as a discount-before-it-expires prompt.
4. **Utang/Lista (customer credit tracking)** — New `customers` and `creditLedger` entities. Customers page lists balances; sale checkout can "charge to" a customer instead of cash; Record Payment reduces balance; per-customer ledger history is viewable.
5. **Lightweight supplier registry** — New `suppliers` entity (name/phone/archived) manageable from Store tools; Add Stock can tag a supplier, which is appended to the stock-in reason text (no new transaction field, kept additive).
6. **Cash drawer reconciliation** — `StoreSession` gained optional `openingCash/closingCash/expectedCash/variance` fields. Opening a session prompts for a starting cash float; closing prompts for the actual cash count and computes variance against opening cash + sales recorded during the session (assumes cash-only sales, since the app has no payment-method field — a reasonable approximation for this use case).

**Data model changes:** `.store` `FORMAT_VERSION` bumped 2 → 3 (adds `customers`, `suppliers`, `creditLedger` arrays to `StoreData`); IndexedDB `VER` bumped 3 → 4 (adds matching object stores). Both are additive and migration-safe — `migrate()` backfills empty arrays for older files, and the IDB `onupgradeneeded` handler creates the new object stores in place without touching existing data. Verified locally that an existing v3 IndexedDB store upgrades to v4 with all prior data intact.

**Verification:** `npm run typecheck`, `npm test` (32/32 passing, including new credit-ledger regression tests), and `npm run build` all passed. Manually verified in-browser: multi-item cart → combined receipt → grouped receipt reopened from History; utang charge → customer balance increases → payment recorded → ledger shows both entries; supplier tagging appears in stock-in history reason; session open/close cash reconciliation flow.

### Deferred (not implemented — flagged for a future session)

- **Multi-unit pricing** (e.g. selling both "tingi"/piece and "bulk"/case of the same product at different prices). Deferred because it changes the core stock/pricing model that CSV import/export, reporting, and the sale/stock-in math all depend on — needs a dedicated design pass rather than being bolted on inside this batch, to avoid risking the correctness of existing stock/money math.
- **Per-staff PIN / cashier attribution** (distinct from the existing single device-level PIN lock added earlier). Deferred because it implies a "current staff" concept that would need to thread through every transaction for attribution — a meaningfully larger feature than a simple settings toggle, better scoped on its own.

## 2026-08-24 — Online Mode: multi-device barcode sync + time-tiered license keys

Implemented, superseding the earlier "one-time purchase only" monetization note above.

**Decision revision:** monetization is now **time-tiered license keys** (7-day trial,
1/6/12 months) sold manually by the owner (payment via GCash, outside the app), not a
single one-time unlock. Keys gate the new Online Mode feature specifically.

1. **License system** (`src/license.ts`, `scripts/generate-license.mjs`) — keys are
   ECDSA (P-256) signed payloads `{tier, issuedAt, expiresAt}`, verified fully offline
   in the client using only the embedded *public* key. The private key
   (`license-private.local.json`, gitignored, never committed) stays with the app
   owner; only they can mint valid keys, but verification needs no network/backend
   call. Activated key is stored in `data.settings.license`.
2. **Online Mode / multi-device barcode sync** — new 4th sub-tab under Miscellaneous.
   Two devices pair via a random 6-digit Sync Code (no accounts). One device picks the
   **Scanner** role (continuous camera barcode scanning, pushes each scan to the
   relay) and the other picks **Display** (polls every 2.5s, auto-adds the matched
   product to the Sales cart). Requires an active license.
3. **Backend** — the Cloudflare Worker is no longer static-assets-only. Added
   `worker/index.ts` (serves the built app via the `ASSETS` binding, plus
   `/api/sync/:code/scan` and `/api/sync/:code/ping`) and `wrangler.toml` with a KV
   namespace binding (`SYNC_KV`, free-tier compatible — chosen over Durable Objects
   specifically to avoid requiring a paid Workers plan). Scanned barcodes are held in
   KV for at most 60s and deleted on read (consume-once); rooms auto-expire after 6h
   of inactivity. No store data (products/sales/money) ever passes through this API.

**Deployment change:** the existing Cloudflare dashboard Git-integration build only
publishes static assets and cannot attach a KV binding to a Worker script, so
production deploys now go through `npm run deploy` (`vite build` + `wrangler deploy`)
instead. Full manual setup steps (creating the KV namespace, filling in
`wrangler.toml`, issuing license keys) are documented in
[`docs/ONLINE-MODE-SETUP.md`](ONLINE-MODE-SETUP.md) — this requires the account
owner's Cloudflare dashboard access, which this session did not have, so the KV
namespace itself was not created and production has **not** been deployed with this
feature live yet.

**Verification:** `npm run typecheck`, `npm test` (41/41 passing, including new
license-verification regression tests covering valid/expired/tampered/malformed
keys), and `npm run build` all passed. The full pairing → scan → auto-add-to-cart
flow, license activation, role switching, and "Leave session" were verified
end-to-end locally against a real (locally-emulated) KV store via `wrangler dev`, not
just mocked — confirmed a barcode pushed from a simulated "scanner" device was
received by the "display" device's poll loop and correctly added the matching
product to its cart, and that an unrecognized barcode was safely ignored.

### Deferred / not yet done

- **Production deploy of Online Mode** — requires the account owner to create the KV
  namespace and run `npm run deploy` per `docs/ONLINE-MODE-SETUP.md`; not done by
  this session (no Cloudflare account access here).
- **In-app manual barcode entry fallback for camera-less scanner devices** — not
  built; the Scanner role currently requires a working `BarcodeDetector`-capable
  camera.
