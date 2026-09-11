import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SavedInvoiceRecord } from '../types';
import { loadInvoiceHistory } from './historyDb';

interface InvoiceDB extends DBSchema {
  invoices: {
    key: string;
    value: SavedInvoiceRecord;
    indexes: {
      'by-invoiceNo': string;
      'by-synced': number; // 0 for false, 1 for true (IndexedDB indexes work best with numbers/strings)
      'by-savedAt': string;
    };
  };
}

const DB_NAME = 'tk_invoice_pwa_db';
const DB_VERSION = 1;
const STORE_NAME = 'invoices';

let dbPromise: Promise<IDBPDatabase<InvoiceDB>> | null = null;

/**
 * Initialize and open IndexedDB database
 */
export function getDB(): Promise<IDBPDatabase<InvoiceDB>> {
  if (!dbPromise) {
    dbPromise = openDB<InvoiceDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by-invoiceNo', 'invoiceNo', { unique: false });
          // Index synced as boolean/number for fast querying of pending syncs
          store.createIndex('by-synced', 'synced' as unknown as string, { unique: false });
          store.createIndex('by-savedAt', 'savedAt', { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Migrate any records from localStorage into IndexedDB on first startup
 */
export async function migrateFromLocalStorageIfNeeded(): Promise<void> {
  try {
    const db = await getDB();
    const existingCount = await db.count(STORE_NAME);
    if (existingCount === 0) {
      const localRecords = loadInvoiceHistory();
      if (localRecords.length > 0) {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        for (const rec of localRecords) {
          await tx.store.put({
            ...rec,
            synced: rec.synced ?? false,
          });
        }
        await tx.done;
        console.log(`[IndexedDB] Migrated ${localRecords.length} records from localStorage to IndexedDB`);
      }
    }
  } catch (err) {
    console.error('[IndexedDB] Migration from localStorage failed:', err);
  }
}

/**
 * Get all invoices from IndexedDB, sorted by newest first
 */
export async function getAllInvoicesFromIndexedDB(): Promise<SavedInvoiceRecord[]> {
  try {
    await migrateFromLocalStorageIfNeeded();
    const db = await getDB();
    const records = await db.getAll(STORE_NAME);
    return records.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  } catch (err) {
    console.error('[IndexedDB] Failed to get invoices from IndexedDB, falling back to localStorage:', err);
    return loadInvoiceHistory();
  }
}

/**
 * Save or update an invoice in IndexedDB
 */
export async function saveInvoiceToIndexedDB(
  payload: Omit<SavedInvoiceRecord, 'id' | 'savedAt'> & { id?: string }
): Promise<{ record: SavedInvoiceRecord; isNew: boolean; allRecords: SavedInvoiceRecord[] }> {
  const db = await getDB();
  const allCurrent = await db.getAll(STORE_NAME);
  const now = new Date().toISOString();

  // Find if record exists with same ID or invoiceNo
  const existing = allCurrent.find(
    (item) => (payload.id && item.id === payload.id) || (payload.invoiceNo && item.invoiceNo.trim() === payload.invoiceNo.trim())
  );

  let updatedRecord: SavedInvoiceRecord;
  let isNew = false;

  if (existing) {
    updatedRecord = {
      ...payload,
      id: existing.id,
      savedAt: now,
    };
  } else {
    isNew = true;
    updatedRecord = {
      ...payload,
      id: payload.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      savedAt: now,
    };
  }

  // Save to IndexedDB
  await db.put(STORE_NAME, updatedRecord);

  // Also sync to localStorage as redundancy
  try {
    const updatedList = await getAllInvoicesFromIndexedDB();
    localStorage.setItem('tk_invoice_history_records_v1', JSON.stringify(updatedList));
    return {
      record: updatedRecord,
      isNew,
      allRecords: updatedList,
    };
  } catch (err) {
    console.error('[IndexedDB] LocalStorage backup error:', err);
    const updatedList = await getAllInvoicesFromIndexedDB();
    return {
      record: updatedRecord,
      isNew,
      allRecords: updatedList,
    };
  }
}

/**
 * Delete an invoice from IndexedDB
 */
export async function deleteInvoiceFromIndexedDB(id: string): Promise<SavedInvoiceRecord[]> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
  const remaining = await getAllInvoicesFromIndexedDB();
  try {
    localStorage.setItem('tk_invoice_history_records_v1', JSON.stringify(remaining));
  } catch (err) {
    console.error('[IndexedDB] Error updating localStorage after delete:', err);
  }
  return remaining;
}

/**
 * Clear all invoices from IndexedDB
 */
export async function clearAllInvoicesFromIndexedDB(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
  try {
    localStorage.removeItem('tk_invoice_history_records_v1');
  } catch (err) {
    console.error('[IndexedDB] Error clearing localStorage:', err);
  }
}
