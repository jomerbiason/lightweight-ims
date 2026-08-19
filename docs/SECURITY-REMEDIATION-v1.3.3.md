# Security Remediation — v1.3.3

Date: 2026-08-19

## Initial audit finding

The first authoritative `npm audit` on the verified dependency tree reported:

- `vite` 7.0.0–7.3.3 — **HIGH** severity
- `vitest` <3.2.6 — **CRITICAL** severity
- Total: **2 vulnerabilities**

## Remediation

The direct development dependencies were upgraded with npm:

```text
npm install -D vite@^7.3.4 vitest@^3.2.6
```

The resulting project dependency declarations are:

- Vite: `^7.3.6`
- Vitest: `^3.2.7`
- TypeScript: `^5.8.3`

npm regenerated/synchronized the lockfile as part of the update.

## Security verification

The authoritative machine subsequently reported:

```text
npm audit
found 0 vulnerabilities
```

The same dependency tree then passed the complete release gate:

```text
FINAL RESULT: PASS
PASS: 9 | FAIL: 0 | SKIP: 0
```

## Install-script warning

npm reported that `esbuild@0.28.2` has an install script not yet covered by npm's `allowScripts` approval policy. This is a package install-script policy warning, not an npm audit vulnerability and not a failed verification check.

The project was not modified with `npm approve-scripts` during this release closure. The existing `npm ci`, typecheck, test, and build commands completed successfully.

## Security conclusion

The previously reported two npm audit vulnerabilities are remediated in the final v1.3.3 dependency tree, with `npm audit` reporting **0 vulnerabilities**.

The install-script warning remains documented for operational review and does not invalidate the automated verification result.
