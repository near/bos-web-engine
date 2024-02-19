import { openDB, DBSchema, IDBPDatabase } from 'idb';

import { ComponentCacheRecord } from './types';

const BOS_INDEX_DB = 'bosIndexedDB';
const BOS_INDEX_DB_VERSION = 1;
const COMPONENTS_CACHE_STORE_NAME = 'componentsCache';

interface BOSIndexDB extends DBSchema {
  [COMPONENTS_CACHE_STORE_NAME]: {
    key: string;
    value: ComponentCacheRecord;
    indexes: { by_key: string };
  };
}

export async function initializeDB(): Promise<IDBPDatabase<BOSIndexDB>> {
  const db = await openDB<BOSIndexDB>(BOS_INDEX_DB, BOS_INDEX_DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore(COMPONENTS_CACHE_STORE_NAME, {
        keyPath: 'key',
      });
      store.createIndex('by_key', 'key', { unique: true });
    },
  });

  return db;
}

export async function addComponentToCache(
  db: IDBPDatabase<BOSIndexDB>,
  data: ComponentCacheRecord
): Promise<void> {
  await db.put(COMPONENTS_CACHE_STORE_NAME, data);
}

export function retrieveComponentFromCache(
  db: IDBPDatabase<BOSIndexDB>,
  componentName: string
): Promise<ComponentCacheRecord | undefined> {
  return db.get(COMPONENTS_CACHE_STORE_NAME, componentName);
}
