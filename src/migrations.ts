import type { StoreData } from './domain';
import { migrate } from './storefile';

/** Compatibility entry point. Store-file migration is centralized in storefile.ts. */
export const CURRENT_STORE_VERSION = 2;
export function migrateStore(raw: unknown): StoreData {
  return migrate(raw);
}
