import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { HistoryItem, CredentialItem } from '../types';

export interface ClosedTabItem {
  id: string;
  url: string;
  title?: string;
  timestamp: number;
}

interface BingeKitDB extends DBSchema {
  history: {
    key: string;
    value: HistoryItem;
    indexes: { 'by-timestamp': number };
  };
  credentials: {
    key: string;
    value: CredentialItem;
    indexes: { 'by-domain': string };
  };
  closed_tabs: {
    key: string;
    value: ClosedTabItem;
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<BingeKitDB>>;

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB<BingeKitDB>('BingeKitDB', 3, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains('history')) {
          const store = db.createObjectStore('history', { keyPath: 'id' });
          store.createIndex('by-timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains('credentials')) {
          const store = db.createObjectStore('credentials', { keyPath: 'id' });
          store.createIndex('by-domain', 'domain');
        }
        if (!db.objectStoreNames.contains('closed_tabs')) {
          const store = db.createObjectStore('closed_tabs', { keyPath: 'id' });
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

export async function addHistoryItem(item: HistoryItem) {
  const db = await initDB();
  await db.put('history', item);
}

export async function bulkAddHistory(items: HistoryItem[]) {
  const db = await initDB();
  const tx = db.transaction('history', 'readwrite');
  for (const item of items) {
    tx.store.put(item);
  }
  await tx.done;
}

export async function getHistory(limit = 1000): Promise<HistoryItem[]> {
  const db = await initDB();
  const tx = db.transaction('history', 'readonly');
  const index = tx.store.index('by-timestamp');
  
  let cursor = await index.openCursor(null, 'prev'); // descending timestamp
  const results: HistoryItem[] = [];
  
  while (cursor && results.length < limit) {
    results.push(cursor.value);
    cursor = await cursor.continue();
  }
  
  return results;
}

export async function clearHistoryDB() {
  const db = await initDB();
  await db.clear('history');
}

export async function clearBrowsedHistoryDB() {
  const db = await initDB();
  const tx = db.transaction('history', 'readwrite');
  const store = tx.store;
  let cursor = await store.openCursor();
  while (cursor) {
    if (cursor.value.type === 'browse') {
      await cursor.delete();
    }
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function deleteHistoryItemDB(id: string) {
  const db = await initDB();
  await db.delete('history', id);
}

export async function getCredentialsDB(): Promise<CredentialItem[]> {
  const db = await initDB();
  return db.getAll('credentials');
}

export async function addCredentialDB(item: CredentialItem) {
  const db = await initDB();
  await db.put('credentials', item);
}

export async function deleteCredentialDB(id: string) {
  const db = await initDB();
  await db.delete('credentials', id);
}

export async function addClosedTabDB(item: ClosedTabItem) {
  const db = await initDB();
  await db.put('closed_tabs', item);
  
  // limit to 20
  const tx = db.transaction('closed_tabs', 'readwrite');
  const index = tx.store.index('by-timestamp');
  let cursor = await index.openCursor(null, 'prev');
  let count = 0;
  while (cursor) {
    count++;
    if (count > 20) {
      await cursor.delete();
    }
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function popClosedTabDB(): Promise<ClosedTabItem | null> {
  const db = await initDB();
  const tx = db.transaction('closed_tabs', 'readwrite');
  const index = tx.store.index('by-timestamp');
  
  const cursor = await index.openCursor(null, 'prev'); // get newest
  if (cursor) {
    const item = cursor.value;
    await cursor.delete();
    await tx.done;
    return item;
  }
  return null;
}

// Ensure the db is initialized in the background on import
initDB().catch(console.error);
