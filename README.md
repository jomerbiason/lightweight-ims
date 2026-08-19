# Lightweight IMS

**V1.3.3 — Verified Release**

Offline-first inventory and simple sales tracker for small sari-sari stores.

## V1.3.3

- Auditable inventory service layer
- Sale / stock-in / adjustment / stock count / compensating undo
- Negative-stock prevention
- Required adjustment reasons
- Versioned `.store` migration (V1 → V2)
- Safe CSV export helpers
- Automated regression tests and CI support
- Persistent project/session change logs
- Production verification gate with explicit PASS / FAIL / SKIP results
- Windows-safe npm verification handling
- Security dependency remediation for Vite and Vitest
- Final dependency audit verified with `npm audit`
- Final project verification verified with `npm run verify`

## Verified release status

The v1.3.3 release baseline was verified on Windows with:

```text
npm ci                         PASS
npm audit                      0 vulnerabilities
npm run typecheck              PASS
npm test                       PASS
npm run build                  PASS
npm run verify                 FINAL RESULT: PASS
                               PASS: 9 | FAIL: 0 | SKIP: 0
```

The verification gate records every check and does not record PASS unless the underlying command succeeds.

## Install and verify

```bash
npm ci
npm audit
npm run typecheck
npm test
npm run build
npm run verify
```

For a clean verification, use `npm ci` rather than relying on an existing `node_modules` directory.

## Node / tooling

Vite 7 requires a supported Node.js runtime. The verified v1.3.3 environment used a supported Node 20/22 line.

The release includes a `package-lock.json` and it must remain synchronized with `package.json`. When dependencies change, regenerate the lockfile with npm and re-run verification.

## Security

The release initially exposed audit findings in older Vite and Vitest versions. These were remediated by updating the development dependencies.

Final verified versions:

- Vite `^7.3.6`
- Vitest `^3.2.7`
- TypeScript `^5.8.3`

Final audit result:

```text
found 0 vulnerabilities
```

See the security and verification documents under `docs/` for the complete remediation and verification trail.

## Deployment

The application is designed for static hosting after `npm run build`. The generated `dist/` directory is the deployment output.

The verified v1.3.3 baseline is maintained in GitHub and hosted through Cloudflare as the foundation for subsequent feature development.

## Release hygiene

The source release package intentionally excludes generated/local-only content:

```text
node_modules/
dist/
.vite/
.env
.env.local
```

These files/directories should not be committed to the public repository.

## Documentation

Important release records are maintained in:

- `docs/NPM-VERIFY-LOG.md`
- `docs/NPM-ROOT-CAUSE-v1.3.3.md`
- `docs/VERIFICATION-REPAIR-LOG-v1.3.3.md`
- `docs/SECURITY-REMEDIATION-v1.3.3.md`
- `docs/FINAL-VERIFICATION-v1.3.3.md`
- `docs/QA-RESULTS-v1.3.3.md`
- `docs/STABILIZATION-LOG-v1.3.3.md`
- `docs/PROJECT-LOG.md`
- `docs/SESSION-HANDOFF.md`
- `CHANGELOG.md`

## Status

**v1.3.3 — verified stable baseline / production-candidate foundation.**

Further real-device, accessibility, offline-storage-failure, and deployment acceptance testing should still be performed as appropriate before treating a deployment as fully production-ready.
