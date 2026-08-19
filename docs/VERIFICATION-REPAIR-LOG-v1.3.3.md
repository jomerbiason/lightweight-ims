# Verification Repair Log — v1.3.3

Date: 2026-08-19

## Purpose

This log records the complete npm verification failure/recovery sequence for the v1.3.3 release. The final PASS was produced by `npm run verify` on the user's Windows PowerShell machine and was not manually inserted.

## Failure and repair timeline

### 1. Initial npm verification was blocked by DNS

The first verification environment could not resolve `registry.npmjs.org`.

Evidence:
- `npm config get registry` → `https://registry.npmjs.org/`
- proxy settings → `null`
- `npm cache verify` → PASS
- `npm ping --loglevel verbose` → `EAI_AGAIN`
- DNS lookup → no address
- curl → `Could not resolve host: registry.npmjs.org`

**Diagnosis:** environment DNS/network failure. No dependency conflict was proven at that stage.

### 2. Added a deterministic lockfile

The release initially had no `package-lock.json`. A lockfile was added so `npm ci` could be used for reproducible installation.

The first generated lockfile was incomplete. This was later detected correctly by `npm ci`, which reported missing transitive packages such as `esbuild`, `rollup`, `postcss`, and Vitest dependencies.

### 3. Fixed the Windows verification runner

The verifier initially resolved its project path incorrectly on Windows, producing paths such as:

`D:\D:\...`

with `%20` encoded spaces.

`scripts/verify.mjs` was repaired to resolve the project root through `fileURLToPath(import.meta.url)`. Windows npm execution was also changed to invoke `npm.cmd` through `cmd.exe`, preventing the observed `spawnSync npm.cmd EINVAL` failure.

### 4. Corrected the Node runtime requirement

The machine initially reported Node `v20.15.0`. The verifier correctly rejected it because Vite 7 requires Node `20.19+` or `22.12+`.

The machine was updated to a supported Node runtime. The final verification run reported a supported runtime.

### 5. Regenerated the lockfile correctly

On the network-capable Windows machine:

`npm install --package-lock-only`

completed successfully and synchronized `package.json` with `package-lock.json`.

Then:

`npm ci`

completed successfully:

`added 54 packages, and audited 55 packages in 8s`

This eliminated the `EUSAGE` lockfile mismatch.

### 6. Final authoritative verification

The user ran:

`npm run verify`

The verifier produced:

- npm available — PASS
- package-lock.json present — PASS
- Node runtime supported — PASS
- npm registry reachable — PASS
- npm cache verify — PASS
- npm ci — PASS
- typecheck — PASS
- test — PASS
- build — PASS

Final result:

`PASS: 9 | FAIL: 0 | SKIP: 0`

## Security note — superseded by remediation

The first successful `npm ci` reported 2 dependency vulnerabilities (1 high, 1 critical) and an npm install-script approval warning for `esbuild@0.25.12`. The vulnerability findings were subsequently remediated by updating Vite and Vitest. The final `npm audit` reports 0 vulnerabilities. The later install-script warning for `esbuild@0.28.2` remains documented separately.

## Verification policy

`npm run verify` is authoritative for the npm release gate. It is fail-closed:
- PASS only when the command exits with code 0.
- Failed prerequisites cause dependent checks to be SKIP.
- Any FAIL or SKIP makes the overall result FAIL.
- Verification output is recorded incrementally in `docs/NPM-VERIFY-LOG.md`.

### 7. Security remediation after the first full PASS

The first fully verified dependency tree still reported two npm audit findings:
- Vite 7.0.0–7.3.3 — HIGH
- Vitest <3.2.6 — CRITICAL

The user updated the direct development dependencies with:

`npm install -D vite@^7.3.4 vitest@^3.2.6`

npm completed successfully and then reported:

`found 0 vulnerabilities`

A second full `npm run verify` also completed with:

`PASS: 9 | FAIL: 0 | SKIP: 0`

The final dependency tree recorded by the project is Vite `^7.3.6` and Vitest `^3.2.7`.

### 8. Final release closure

The release documentation and audit manifest were updated after the security remediation. Generated `node_modules`, `dist`, and `.vite` artifacts are excluded from the release ZIP; dependencies remain reproducible through `package-lock.json` and `npm ci`.
