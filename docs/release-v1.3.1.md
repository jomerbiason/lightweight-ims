# V1.3.1 Release Notes

V1.3.1 is a patch release for the production-hardening baseline. It focuses on making the application code, automated tests, and release metadata consistent.

## Fixes

- Restored the inventory service API expected by the application and test suite.
- Centralized inventory changes through `applyInventoryChange` with negative-stock protection.
- Added transaction-returning `recordSale`, `stockIn`, and stock-count operations for reliable audit history.
- Added transaction reversal with `referenceId` protection against duplicate undo operations.
- Added shopping-list suggestions and a local `todayKey` helper used by the dashboard.
- Kept CSV exports and formula-injection protection intact.
- Updated package, UI, `.store` metadata, migration metadata, service-worker cache, and release files to `1.3.1`.

## Verification

- TypeScript source check passes with strict compiler settings.
- Full `npm test` / `npm run build` verification requires the project dependencies to be installed.
