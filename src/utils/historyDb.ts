import { SavedInvoiceRecord } from '../types';

const INVOICE_HISTORY_KEY = 'tk_invoice_history_records_v1';

/**
 * Load all saved invoices from localStorage
 */
export function loadInvoiceHistory(): SavedInvoiceRecord[] {
  try {
    const raw = localStorage.getItem(INVOICE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Sort newest saved first
      return parsed.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    }
  } catch (err) {
    console.error('Failed to load invoice history from localStorage', err);
  }
  return [];
}

/**
 * Save an invoice to history (adds new or updates existing record for the same invoiceNo)
 */
export function saveInvoiceToHistory(
  payload: Omit<SavedInvoiceRecord, 'id' | 'savedAt'> & { id?: string }
): { record: SavedInvoiceRecord; isNew: boolean; records: SavedInvoiceRecord[] } {
  const currentList = loadInvoiceHistory();
  const now = new Date().toISOString();

  // Check if a record already exists with the same invoiceNo or id
  const existingIndex = currentList.findIndex(
    (item) => (payload.id && item.id === payload.id) || (payload.invoiceNo && item.invoiceNo.trim() === payload.invoiceNo.trim())
  );

  let updatedRecord: SavedInvoiceRecord;
  let isNew = false;
  let updatedList: SavedInvoiceRecord[];

  if (existingIndex >= 0) {
    // Update existing record
    updatedRecord = {
      ...payload,
      id: currentList[existingIndex].id,
      savedAt: now,
    };
    updatedList = [...currentList];
    updatedList[existingIndex] = updatedRecord;
  } else {
    // Insert new record at beginning
    isNew = true;
    updatedRecord = {
      ...payload,
      id: payload.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      savedAt: now,
    };
    updatedList = [updatedRecord, ...currentList];
  }

  try {
    localStorage.setItem(INVOICE_HISTORY_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Failed to save invoice to localStorage', err);
  }

  return {
    record: updatedRecord,
    isNew,
    records: updatedList,
  };
}

/**
 * Delete a specific record from history by ID
 */
export function deleteInvoiceFromHistory(id: string): SavedInvoiceRecord[] {
  const currentList = loadInvoiceHistory();
  const filtered = currentList.filter((item) => item.id !== id);
  try {
    localStorage.setItem(INVOICE_HISTORY_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete invoice from localStorage', err);
  }
  return filtered;
}

/**
 * Clear all history
 */
export function clearAllInvoiceHistory(): void {
  try {
    localStorage.removeItem(INVOICE_HISTORY_KEY);
  } catch (err) {
    console.error('Failed to clear invoice history', err);
  }
}

/**
 * Helper to format date and time in Thai format
 * e.g. "11 ก.ย. 2569 12:35 น."
 */
export function formatDateTimeThai(isoString: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const months = [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear() + 543;
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year} ${hours}:${minutes} น.`;
  } catch {
    return isoString;
  }
}
