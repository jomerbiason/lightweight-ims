# Architecture

UI → application/domain services → IndexedDB repository.

- `src/main.ts`: lightweight UI and event wiring
- `src/services.ts`: inventory operations and business rules, testable without DOM
- `src/db.ts`: IndexedDB persistence and local safety snapshots
- `src/storefile.ts`: portable `.store` validation, migration, import/export
- `src/domain.ts`: entities, IDs, stock status, simple estimates
- `public/sw.js`: PWA cache/offline shell

No backend database is required. Cloudflare serves static/PWA assets. The local browser remains the working copy.
