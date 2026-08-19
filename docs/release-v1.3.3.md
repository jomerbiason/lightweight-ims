# Lightweight IMS v1.3.3 — Data Integrity & Reporting Fixes

## Bug fixes
- Fixed daily sales grouping to use the configured store timezone instead of UTC date slicing.
- Added sale price and cost snapshots to new SALE transactions so historical sales and gross-profit estimates remain stable after product prices change.
- Updated sales CSV export to prefer the historical sale price snapshot.
- Replaced line-based CSV import parsing with a record parser that supports quoted commas, escaped quotes, and multiline quoted fields.
- Hardened `.store` migration so malformed or incomplete store metadata produces validation errors instead of crashing during product migration.
- Expanded `.store` validation for store metadata, settings, products, transactions, shopping-list items, sessions, sale snapshots, and transaction arithmetic consistency.
- Allowed transaction reversal to locate archived products while keeping normal inventory operations restricted to active products.

## Compatibility
- `.store` format remains version 2; no forced backup format migration is required.
- Existing SALE transactions without price/cost snapshots remain supported and fall back to product values. New sales store immutable snapshots.

## Verification
- `npm audit` reports **0 vulnerabilities** after the Vite/Vitest security remediation.
- `npm run verify` on the user's Windows machine reports **9 PASS, 0 FAIL, 0 SKIP**.
- `npm ci`, typecheck, tests, and production build all completed successfully.
- See `docs/NPM-VERIFY-LOG.md`, `docs/SECURITY-REMEDIATION-v1.3.3.md`, and `docs/FINAL-VERIFICATION-v1.3.3.md` for evidence.
