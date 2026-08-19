# Security

- `.store` imports are untrusted and validated/migrated before use.
- CSV output protects spreadsheet-leading formulas.
- User/imported strings must be rendered as text, never trusted HTML.
- Local-first data remains in browser storage unless exported by the user.
