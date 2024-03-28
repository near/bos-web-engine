import { DBSchema, IDBPDatabase, openDB } from 'idb';

import { ComponentCacheRecord } from './types';

export const BOS_INDEX_DB = 'bosIndexedDB';
const BOS_INDEX_DB_VERSION = 1;
const COMPONENT_TREES_CACHE_STORE_NAME = 'componentTreesCache';

interface BOSIndexDB extends DBSchema {
  [COMPONENT_TREES_CACHE_STORE_NAME]: {
    key: string;
    value: ComponentCacheRecord;
    indexes: { by_key: string };
  };
}

export async function initializeDB(): Promise<IDBPDatabase<BOSIndexDB>> {
  const db = await openDB<BOSIndexDB>(BOS_INDEX_DB, BOS_INDEX_DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore(COMPONENT_TREES_CACHE_STORE_NAME, {
        keyPath: 'key',
      });
      store.createIndex('by_key', 'key', { unique: true });
    },
  });

  return db;
}

export async function cacheComponentTreeDetails(
  data: ComponentCacheRecord
): Promise<void> {
  const db = await initializeDB();
  await db.put(COMPONENT_TREES_CACHE_STORE_NAME, data);
}

export async function retrieveComponentTreeDetailFromCache(
  componentPath: string
): Promise<ComponentCacheRecord | undefined> {
  const db = await initializeDB();
  return db.get(COMPONENT_TREES_CACHE_STORE_NAME, componentPath);
}
