import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { HistoryItem } from '../types';

interface BingeKitDB extends DBSchema {
  history: {
    key: string;
    value: HistoryItem;
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<BingeKitDB>>;

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB<BingeKitDB>('BingeKitDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('history')) {
          const store = db.createObjectStore('history', { keyPath: 'id' });
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

// Ensure the db is initialized in the background on import
initDB().catch(console.error);
