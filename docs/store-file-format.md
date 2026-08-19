# `.store` File Format v1

The portable store format is JSON with the `.store` extension.

## Metadata

- `format`: `open-store`
- `formatVersion`: `1`
- `applicationVersion`
- `exportedAt`
- `store.id`, `store.name`, `store.createdAt`, `store.updatedAt`
- `store.snapshotVersion`, `store.snapshotId`

## Data collections

`categories`, `products`, `transactions`, `shoppingList`, `sessions`, and `settings`.

Product records support category, optional SKU/barcode/cost/expiration, price, stock, reorder level, target stock, unit, and active status.

## Validation

Imports reject unsupported formats/versions, missing collections, duplicate IDs, missing product/category references, invalid quantities, invalid dates, and files over 10 MiB. Imported strings are never trusted as executable HTML.

## Migration and compatibility

The application preserves format version 1 while migrating compatible legacy records to the current application schema. Migration occurs in memory before validation and persistence. A failed migration never replaces local data.

## Restore safety

If local data exists, the application creates a local safety snapshot before restore. Same-store files with an older snapshot version produce a stale-file warning. Restore requires explicit confirmation.

## Security

Treat `.store` files as untrusted input. Do not execute file contents. Keep backups outside the browser as well; there is no automatic cloud backup.
