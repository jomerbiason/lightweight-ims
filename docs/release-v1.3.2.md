# V1.3.2 Release Notes

V1.3.2 is the stabilization release following V1.3.1. The focus is regression testing, store-file compatibility, upgrade safety, and cross-session project continuity.

## Fixed

- Replaced stale V1.3 tests that referenced removed service APIs.
- Added regression coverage for physical stock counts, zero variance, reversals, and duplicate reversal protection.
- Added a typed `REVERSAL` transaction instead of labeling every undo as `SALE_REVERSAL`.
- Standardized `.store` format handling at V2 and preserved migration support for V1 files.
- Fixed CSV formula-safety handling so numeric negative values remain numeric text while formula-looking strings are escaped.
- Added service-worker cache cleanup and immediate activation for upgrades.
- Updated release metadata to V1.3.2.

## Verification

- **Passed:** strict TypeScript source check with the project's compiler settings, excluding tests because Vitest dependencies are not installed in the build environment.
- **Blocked in this environment:** `npm test` and `npm run build`, because dependency installation could not complete before the environment timeout.
- **CI:** uses `npm install` instead of `npm ci` because the repository intentionally does not yet contain a lockfile.

## Cross-session rule

Before changing the project in a future session, read `docs/PROJECT-LOG.md` and `docs/SESSION-HANDOFF.md`. After every change, append a dated entry to `docs/PROJECT-LOG.md` and update the handoff status.
