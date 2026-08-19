# Final Verification — Lightweight IMS v1.3.3

Date: 2026-08-19

## Final package status

**FULLY VERIFIED — npm gate PASS on the user's Windows machine**

Authoritative command:

```text
npm run verify
```

Final result:

```text
FINAL RESULT: PASS
PASS: 9 | FAIL: 0 | SKIP: 0
```

## Authoritative npm verification

| Check | Result |
|---|---|
| npm available | PASS |
| package-lock.json present | PASS |
| Node runtime supported | PASS |
| npm registry reachable | PASS |
| npm cache verify | PASS |
| npm ci | PASS |
| typecheck | PASS |
| test | PASS |
| build | PASS |

Detailed evidence: `docs/NPM-VERIFY-LOG.md`.

## Security verification

Initial audit findings were:

- Vite 7.0.0–7.3.3 — HIGH
- Vitest <3.2.6 — CRITICAL

They were remediated by updating the development dependencies. The final machine audit reported:

```text
npm audit
found 0 vulnerabilities
```

The final dependency tree uses Vite `^7.3.6` and Vitest `^3.2.7`.

npm also reported an install-script approval warning for `esbuild@0.28.2`. This is documented separately in `docs/SECURITY-REMEDIATION-v1.3.3.md`; it is not an npm audit vulnerability and did not prevent `npm ci`, typecheck, tests, or build from succeeding.

## Bugs discovered and fixed during verification

1. Initial DNS failure (`EAI_AGAIN`) in the first execution environment.
2. Windows project-root path resolution bug in `scripts/verify.mjs`.
3. Windows `npm.cmd` `spawnSync` `EINVAL` issue in the verifier.
4. Unsupported Node `20.15.0` runtime for Vite 7.
5. Incomplete `package-lock.json` causing strict `npm ci` `EUSAGE`.
6. Lockfile synchronized on the user's network-capable machine.
7. Vite and Vitest security vulnerabilities remediated; final `npm audit` reports 0 vulnerabilities.

## Earlier application stabilization fixes

The v1.3.3 stabilization pass includes timezone-aware day grouping, quoted/multiline CSV parsing, immutable sale price/cost snapshots, hardened `.store` migration and validation, archived-product reversal lookup, transaction/category validation, migration compatibility consolidation, and regression coverage for the above behaviors.

## Release evidence

- `docs/NPM-VERIFY-LOG.md` — authoritative successful verification run.
- `docs/VERIFICATION-REPAIR-LOG-v1.3.3.md` — complete failure/repair chronology.
- `docs/NPM-ROOT-CAUSE-v1.3.3.md` — root-cause analysis.
- `docs/SECURITY-REMEDIATION-v1.3.3.md` — security findings and remediation.
- `docs/PROJECT-LOG.md` — persistent project history.
- `docs/STABILIZATION-LOG-v1.3.3.md` — application stabilization history.
- `CHANGELOG.md` — release-facing change history.
- `AUDIT-MANIFEST.sha256` — static package integrity manifest.

## Release conclusion

**v1.3.3 passes the npm verification gate with 9 PASS, 0 FAIL, 0 SKIP, and the final npm audit reports 0 vulnerabilities.**
