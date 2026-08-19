# Lightweight IMS

**V1.3.3 — Verified Release**

Offline-first inventory and simple sales tracker for small sari-sari stores.

---

## Release Status

- **Version:** `1.3.3`
- **Verification:** PASS
- **npm audit:** 0 vulnerabilities
- **Verification Result:** 9 PASS / 0 FAIL / 0 SKIP

This release has been verified locally using the project's authoritative verification gate:

```text
npm run verify

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

---

## Features

- Offline-first inventory management
- Inventory stock-in
- Sales tracking
- Stock adjustments
- Stock counting
- Compensating undo operations
- Negative-stock prevention
- Required adjustment reasons
- Versioned store migration
- Safe CSV export helpers
- Automated regression tests
- TypeScript type checking
- Production build verification
- Persistent project/session change logs
- Security and production-readiness documentation

---

## Technology

- TypeScript
- Vite `^7.3.6`
- Vitest `^3.2.7`
- Node.js
- npm

---

## Requirements

Use a supported Node.js version for Vite 7:
- **Node:** `20.19+` or `22.12+`
- **npm** is required.

---

## Development & Usage

### Installation

Clone or download the repository, then run:

```bash
npm ci
```

> **Note:** Using `npm ci` ensures that the dependency tree is installed from the committed `package-lock.json`.

### Development

Start the development server:

```bash
npm run dev
```

### Testing

Run the automated tests:

```bash
npm test
```

### Type Checking

Run TypeScript validation:

```bash
npm run typecheck
```

### Production Build

Create the production build:

```bash
npm run build
```

The production output is generated in: `dist/`

---

## Full Verification

The recommended verification command is:

```bash
npm run verify
```

**The verification gate checks:**
- npm availability
- `package-lock.json`
- Node.js compatibility
- npm registry connectivity
- npm cache integrity
- clean `npm ci` installation
- TypeScript type checking
- automated tests
- production build

A successful release verification must report:

```text
FINAL RESULT: PASS
PASS: 9 | FAIL: 0 | SKIP: 0
```

*The verification script does not record a PASS when a required command fails or is skipped.*

Verification logs are stored in: `docs/NPM-VERIFY-LOG.md`

---

## Security

The v1.3.3 dependency tree was checked with:

```bash
npm audit
```

**Current result:** `0 vulnerabilities`

During release hardening, vulnerabilities affecting older Vite and Vitest versions were identified and remediated by updating the development dependencies.

**Current versions:**
- `vite`: `^7.3.6`
- `vitest`: `^3.2.7`

Security remediation details are documented in `docs/SECURITY-REMEDIATION-v1.3.3.md`. See also `SECURITY.md`.

---

## Verification and Repair History

The project includes documentation of the issues encountered and how they were resolved.

**Important records:**
- `docs/NPM-VERIFY-LOG.md`
- `docs/VERIFICATION-REPAIR-LOG-v1.3.3.md`
- `docs/NPM-ROOT-CAUSE-v1.3.3.md`
- `docs/SECURITY-REMEDIATION-v1.3.3.md`
- `docs/FINAL-VERIFICATION-v1.3.3.md`
- `docs/QA-RESULTS-v1.3.3.md`
- `docs/PROJECT-LOG.md`
- `docs/STABILIZATION-LOG-v1.3.3.md`
- `docs/release-v1.3.3.md`

These records document the verification failures, dependency/lockfile repair, Windows-specific npm issues, Node.js compatibility correction, security remediation, and final successful verification.

---

## Release Integrity

The repository includes `AUDIT-MANIFEST.sha256` to record SHA-256 checksums for release files.

The release artifact intentionally excludes generated/local dependency directories such as:
- `node_modules/`
- `dist/`
- `.vite/`
- `.env`
- `.env.local`

Dependencies should be installed from the committed lockfile using `npm ci`.

---

## Project Structure

```text
.
├── .github/
├── docs/
├── public/
├── scripts/
├── src/
├── tests/
├── AUDIT-MANIFEST.sha256
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md
├── VERSION
├── icon.svg
├── index.html
├── manifest.webmanifest
├── package-lock.json
├── package.json
└── tsconfig.json
```

---

## Production Readiness

The v1.3.3 codebase has passed the automated npm verification gate and has no reported npm audit vulnerabilities at release time.

Before deploying to a public production environment, perform deployment-specific acceptance testing, including:
- Real-device testing
- Browser compatibility testing
- Accessibility checks
- Offline behavior verification
- Storage failure/recovery testing
- Production deployment verification
- Cloudflare deployment/runtime checks

*Automated verification passing does not replace application-level manual acceptance testing.*

---

## Documentation & Governance

- **License:** See `LICENSE`.
- **Contributing:** See `CONTRIBUTING.md`.
- **Security Reporting:** See `SECURITY.md` for guidance.
