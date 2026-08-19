# npm Root-Cause Analysis — v1.3.3

Date: 2026-08-19

## Executive conclusion

The v1.3.3 npm verification had several distinct, sequential issues. They were not one single bug:

1. The first execution environment had DNS resolution failure for `registry.npmjs.org`.
2. The verification script had a Windows path-resolution bug.
3. The verification script needed Windows-safe npm invocation.
4. The user's Node runtime was initially `20.15.0`, below Vite 7's supported range.
5. The initial `package-lock.json` was incomplete and failed strict `npm ci` synchronization.
6. After these repairs, the lockfile was regenerated on the user's network-capable machine and the complete npm gate passed.

The final authoritative machine run is **PASS: 9 | FAIL: 0 | SKIP: 0**.

## Evidence and repairs

### A. DNS/network failure

Initial `npm ping` failed with `EAI_AGAIN`. Registry configuration was correct, proxy settings were null, and npm cache verification passed. Host resolution and direct HTTPS access also failed.

**Repair:** move the authoritative npm verification to a network-capable machine. The user's machine subsequently returned `npm ping` PONG.

### B. Windows path bug

The verifier produced an invalid path with a duplicated drive prefix and encoded spaces.

**Repair:** `scripts/verify.mjs` now uses `fileURLToPath(import.meta.url)` to resolve the project root correctly on Windows.

### C. Windows npm spawn bug

The verifier initially called `spawnSync('npm.cmd', ...)` directly and the user's Node/Windows combination returned `EINVAL`.

**Repair:** on Windows, the verifier invokes `npm.cmd` through `ComSpec`/`cmd.exe`.

### D. Unsupported Node runtime

The user's initial Node version was `v20.15.0`.

**Repair:** the runtime was upgraded to a Vite-7-supported Node release. The verifier now fails closed unless Node is `20.19+` or `22.12+`.

### E. Incomplete lockfile

After the environment was network-capable, direct `npm ci` exposed an incomplete lockfile with many missing transitive entries, including `esbuild`, `rollup`, `postcss`, and Vitest dependencies.

**Repair:** the user ran:

`npm install --package-lock-only`

which completed successfully, then:

`npm ci`

which completed successfully with 54 packages installed and 55 audited.

### F. Final verification

The user ran `npm run verify` after the repairs.

Result:

```text
[PASS] npm available
[PASS] package-lock.json present
[PASS] Node runtime supported
[PASS] npm registry reachable
[PASS] npm cache verify
[PASS] npm ci
[PASS] typecheck
[PASS] test
[PASS] build

FINAL RESULT: PASS
PASS: 9 | FAIL: 0 | SKIP: 0
```

## Security remediation

The first fully verified dependency tree reported two npm audit findings: Vite 7.0.0–7.3.3 (HIGH) and Vitest <3.2.6 (CRITICAL). The user updated the direct development dependencies to Vite `^7.3.6` and Vitest `^3.2.7`. A subsequent `npm audit` reported **0 vulnerabilities**, and a second complete `npm run verify` remained **9 PASS | 0 FAIL | 0 SKIP**.

npm also reported an install-script approval warning for `esbuild@0.28.2`; this is documented separately and is not an npm audit vulnerability.

## Status

**NPM VERIFICATION: FULL PASS ON USER WINDOWS MACHINE**

The release is not described as vulnerability-free. The npm verification PASS means the installation, typecheck, test, and production build gates all completed successfully.
