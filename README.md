# Lightweight IMS

**V1.3.2 — Testing & Bug Fix**

Offline-first inventory and simple sales tracker for small sari-sari stores.

### V1.3.2
- Auditable inventory service layer
- Sale / stock-in / adjustment / stock count / compensating undo
- Negative-stock prevention
- Required adjustment reasons
- Versioned `.store` migration (V1 → V2)
- Safe CSV export helpers
- Automated regression tests and CI support
- Persistent project/session change logs for cross-session continuation
- Security and production-readiness documentation

Run: `npm install && npm test && npm run typecheck && npm run build`

Status: **production-hardening / production-candidate foundation**. Complete real-device, accessibility, offline, storage-failure, and deployment acceptance before public launch.
