# QA Results — v1.3.3

## Verification date
2026-08-19

## Final automated verification

The user's Windows PowerShell environment successfully executed the authoritative gate:

```text
npm run verify
```

Result:

```text
FINAL RESULT: PASS
PASS: 9 | FAIL: 0 | SKIP: 0
```

| Check | Result | Evidence |
|---|---|---|
| npm available | PASS | npm 11.17.0 reported by verifier |
| package-lock.json present | PASS | Lockfile detected |
| Node runtime supported | PASS | Vite 7-supported Node runtime |
| npm registry reachable | PASS | Registry responded |
| npm cache verify | PASS | Cache verified |
| npm ci | PASS | 54 packages installed successfully |
| Typecheck | PASS | `npm run typecheck` exited 0 |
| Vitest suite | PASS | `npm test` exited 0 |
| Vite production build | PASS | `npm run build` exited 0 |

## Earlier failures that were repaired

- Initial registry DNS resolution failure (`EAI_AGAIN`) in the first verification environment.
- Windows verifier path construction bug.
- Windows `npm.cmd` spawn `EINVAL` issue.
- Unsupported Node 20.15.0 runtime.
- Incomplete lockfile rejected by strict `npm ci` with `EUSAGE`.

See `docs/VERIFICATION-REPAIR-LOG-v1.3.3.md` for the complete chronology and exact repairs.

## Security status

The first dependency tree reported 2 npm audit vulnerabilities (1 high, 1 critical). They were remediated by updating Vite and Vitest. The final `npm audit` reports **0 vulnerabilities**. The remaining esbuild install-script approval warning is documented separately and is not an audit vulnerability.

## Release status

**FULLY VERIFIED — npm verification PASS on the user's Windows machine.**

## Security remediation verification

- Initial `npm audit`: 2 vulnerabilities (1 high, 1 critical).
- Remediation: updated Vite and Vitest development dependencies.
- Final `npm audit`: **0 vulnerabilities**.
- Post-remediation `npm run verify`: **9 PASS | 0 FAIL | 0 SKIP**.
- npm still reports an `esbuild@0.28.2` install-script approval warning; this is documented separately and does not constitute an audit vulnerability.
