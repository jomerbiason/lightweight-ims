# v1.3.3 Stabilization Audit Log

## Scope
Stabilize the v1.3.3 release without adding unrelated product features. Every code or documentation change in this pass is recorded here.

## Changes
- Centralized the legacy `migrateStore()` compatibility entry point on the canonical migration in `src/storefile.ts`, removing divergent migration behavior.
- Added validation for transaction type values, transaction IDs/product IDs, and category structure.
- Added immutable sale price and cost snapshot fields to the sales CSV export.
- Added regression tests for malformed categories/transaction types and sale snapshot CSV export.
- Reviewed existing v1.3.3 fixes: timezone-aware day grouping, quoted/multiline CSV parsing, transaction stock arithmetic validation, historical sale snapshots, and archived-product reversal.

## Verification status
- Source review: PASS.
- Regression tests added: PASS (static review).
- Full `npm install`, `npm test`, `npm run typecheck`, and `npm run build`: NOT VERIFIED in this execution environment because dependency installation exceeded the available execution time.
- No claim is made that dependency-based checks passed.

## Audit rule
Future changes must append an entry to `CHANGELOG.md`, `docs/PROJECT-LOG.md`, and this stabilization log (or its successor) before the ZIP is finalized.

## 2026-08-19 Verification execution
- ZIP extraction: PASS.
- Audit manifest (`sha256sum -c AUDIT-MANIFEST.sha256`): PASS.
- Source-only strict TypeScript compilation: PASS.
- Full project typecheck: BLOCKED because Vitest type declarations require the uninstalled dependencies.
- Vitest regression suite: BLOCKED; dependency installation timed out.
- Vite production build: BLOCKED; dependency installation timed out.
- Final status: CONDITIONALLY STABLE — NOT FULLY VERIFIED.


## 2026-08-19 — Final dependency verification
- The user's Windows environment completed `npm ci`, `npm run typecheck`, `npm test`, and `npm run build` successfully.
- The authoritative `npm run verify` result is **PASS: 9 | FAIL: 0 | SKIP: 0**.
- Previous environment-blocked status is superseded by this network-capable machine verification.
- The earlier 2 npm audit vulnerabilities are superseded by the final remediation; `npm audit` now reports 0 vulnerabilities.

## 2026-08-19 — Security remediation and release closure
- Initial `npm audit` reported Vite HIGH and Vitest CRITICAL vulnerabilities.
- Updated direct dev dependencies with `npm install -D vite@^7.3.4 vitest@^3.2.6`.
- Final resolved declarations are Vite `^7.3.6` and Vitest `^3.2.7`.
- `npm audit` now reports **0 vulnerabilities**.
- Re-ran `npm run verify`: **9 PASS, 0 FAIL, 0 SKIP**.
- Documented the remaining esbuild install-script approval warning separately; it is not an audit vulnerability and did not block verification.
- Release status: **FULLY VERIFIED and SECURITY AUDIT CLEAN (0 npm audit vulnerabilities)**.
