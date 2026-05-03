import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'maternacare_db';
const DB_VERSION = 3;

export async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains('patients')) {
          db.createObjectStore('patients', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('admissions')) {
          db.createObjectStore('admissions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('partograph_entries')) {
          db.createObjectStore('partograph_entries', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('clinical_alerts')) {
          db.createObjectStore('clinical_alerts', { keyPath: 'id' });
        }
      }
      
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('audit_logs')) {
          db.createObjectStore('audit_logs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('deliveries')) {
          db.createObjectStore('deliveries', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('infants')) {
          db.createObjectStore('infants', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('referrals')) {
          db.createObjectStore('referrals', { keyPath: 'id' });
        }
      }

      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains('handover_logs')) {
          db.createObjectStore('handover_logs', { keyPath: 'id' });
        }
      }
    },
  });
}

export async function updateInLocal(storeName: string, data: any) {
  const db = await getDB();
  return db.put(storeName, data);
}

export async function saveToLocal(storeName: string, data: any) {
  const db = await getDB();
  return db.put(storeName, data);
}

export async function getFromLocal(storeName: string, id: string) {
  const db = await getDB();
  return db.get(storeName, id);
}

export async function getQueryFromLocal(storeName: string, indexName: string, value: any) {
  const db = await getDB();
  const all = await db.getAll(storeName);
  return all.filter((item: any) => item[indexName] === value);
}

export async function getAllFromLocal(storeName: string) {
  const db = await getDB();
  return db.getAll(storeName);
}

export async function deleteFromLocal(storeName: string, id: string) {
  const db = await getDB();
  return db.delete(storeName, id);
}

export async function addToSyncQueue(item: any) {
  const db = await getDB();
  return db.add('sync_queue', {
    ...item,
    id: crypto.randomUUID(),
    status: 'pending',
    retryCount: 0,
    localTimestamp: new Date().toISOString(),
  });
}
