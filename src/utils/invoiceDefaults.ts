import { IssuerInfo, CustomerInfo, InvoiceMeta, InvoiceItem, VatMode, CalculationResult } from '../types';
import { getTodayISODate, getBEYear2Digit, formatThaiDate } from './dateFormatter';
import { numberToThaiBahtText } from './thaiBahtText';

export const DEFAULT_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="tkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="16" fill="url(#tkGrad)"/>
  <circle cx="60" cy="60" r="48" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.4"/>
  <path d="M 36 36 L 84 36 M 60 36 L 60 84" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
  <circle cx="78" cy="74" r="7" fill="#ffffff"/>
</svg>
`)}`;

export const DEFAULT_ISSUER: IssuerInfo = {
  name: 'บริษัท ทีเค กราฟิก แอนด์ พริ้นติ้ง จำกัด',
  address: '88/19 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพมหานคร 10310',
  taxId: '0105562014892',
  branch: 'สำนักงานใหญ่',
  phone: '02-719-8999, 089-123-4567',
  facebook: 'TK Printing & Design',
  logoUrl: DEFAULT_LOGO_SVG,
};

export const SAMPLE_CUSTOMER: CustomerInfo = {
  name: 'บริษัท สยาม ฟู้ดส์ แอนด์ เบเวอเรจ จำกัด',
  contact: 'คุณวิภาวรรณ ศิริชัยพาณิชย์ (แผนกจัดซื้อ)',
  address: '142/5 ถนนสาทรใต้ แขวงยานนาวา เขตสาทร กรุงเทพฯ 10120',
  taxId: '0105558091234',
  branch: 'สำนักงานใหญ่',
  deliveryDate: getTodayISODate(),
};

export const INITIAL_CUSTOMER: CustomerInfo = {
  alias: '',
  name: '',
  contact: '',
  phone: '',
  address: '',
  taxId: '',
  branch: 'สำนักงานใหญ่',
  deliveryDate: getTodayISODate(),
};

export function generateInvoiceNumber(sequence = 21): string {
  const beYear = getBEYear2Digit();
  const seqStr = String(sequence).padStart(3, '0');
  return `TK${beYear} ${seqStr}`;
}

export const INITIAL_META: InvoiceMeta = {
  docType: 'ORIGINAL',
  invoiceNo: generateInvoiceNumber(21),
  poNo: '',
  jobName: '',
  docDate: getTodayISODate(),
  receiverName: '',
  receiverDate: formatThaiDate(getTodayISODate()),
  cashierName: 'สมใจ จิตรเพียร',
  cashierDate: formatThaiDate(getTodayISODate()),
};

export const INITIAL_ITEMS: InvoiceItem[] = [
  {
    id: '1',
    description: '',
    quantity: 0,
    unitPrice: 0,
    amount: 0,
  },
];

export const SAMPLE_ITEMS: InvoiceItem[] = [
  {
    id: '1',
    description: 'พิมพ์สติ๊กเกอร์ PP ขาวด้าน ไดคัท 100% กันน้ำ ขนาด 5x5 ซม. (500 ดวง/ม้วน)',
    quantity: 10,
    unitPrice: 280.0,
    amount: 2800.0,
  },
  {
    id: '2',
    description: 'งานออกแบบและจัดทำไฟล์สำหรับพิมพ์บรรจุภัณฑ์กล่องลูกฟูก (Artwork Master)',
    quantity: 1,
    unitPrice: 1500.0,
    amount: 1500.0,
  },
  {
    id: '3',
    description: 'พิมพ์โบรชัวร์แนะนำสินค้าพรีเมียม 4 สี 2 หน้า กระดาษอาร์ตการ์ด 260 แกรม',
    quantity: 500,
    unitPrice: 4.5,
    amount: 2250.0,
  },
  {
    id: '4',
    description: 'บริการจัดส่งสินค้าด่วนโดยพนักงานจัดส่ง (Delivery Service)',
    quantity: 1,
    unitPrice: 150.0,
    amount: 150.0,
  },
];

const LOCAL_STORAGE_ISSUER_KEY = 'tk_invoice_default_issuer_v1';
const LOCAL_STORAGE_COUNTER_KEY = 'tk_invoice_counter_v1';
export const LOCAL_STORAGE_INVOICE_SETTINGS_KEY = 'tk_invoice_number_settings_v1';
export const LOCAL_STORAGE_LAST_SAVED_PRINTED_KEY = 'tk_invoice_last_saved_or_printed_v1';
export const LOCAL_STORAGE_LAST_USER_INVOICE_NO_KEY = 'tk_invoice_last_user_invoice_no_v1';

export function getLastUserInvoiceNo(): string | null {
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_LAST_USER_INVOICE_NO_KEY);
    return val && val.trim() ? val.trim() : null;
  } catch {
    return null;
  }
}

export function saveLastUserInvoiceNo(invoiceNo: string): void {
  try {
    if (invoiceNo && invoiceNo.trim()) {
      localStorage.setItem(LOCAL_STORAGE_LAST_USER_INVOICE_NO_KEY, invoiceNo.trim());
    }
  } catch {
    // ignore
  }
}

export interface InvoiceNumberSettings {
  prefix: string; // e.g. "TK"
  autoBEYear: boolean; // if true, adds 2-digit Buddhist year e.g. "69 "
  startingNumber: number; // e.g. 21
  paddingDigits: number; // e.g. 3 -> "021"
  customTemplate?: string; // custom full invoice number e.g. "TK69 021"
}

export const DEFAULT_INVOICE_SETTINGS: InvoiceNumberSettings = {
  prefix: 'TK',
  autoBEYear: true,
  startingNumber: 21,
  paddingDigits: 3,
  customTemplate: 'TK69 021',
};

export function loadInvoiceNumberSettings(): InvoiceNumberSettings {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_INVOICE_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_INVOICE_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_INVOICE_SETTINGS;
}

export function saveInvoiceNumberSettings(settings: InvoiceNumberSettings): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_INVOICE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save invoice number settings to localStorage', err);
  }
}

export function formatInvoiceNumberFromSettings(settings: InvoiceNumberSettings, seq?: number): string {
  if (settings.customTemplate && settings.customTemplate.trim()) {
    return settings.customTemplate.trim();
  }
  const sequence = seq ?? settings.startingNumber;
  const seqStr = String(sequence).padStart(settings.paddingDigits, '0');
  if (settings.autoBEYear) {
    const beYear = getBEYear2Digit();
    return `${settings.prefix}${beYear} ${seqStr}`;
  }
  return `${settings.prefix}${seqStr}`;
}

export function getDefaultInvoiceNumber(): string {
  const lastUserNo = getLastUserInvoiceNo();
  if (lastUserNo) {
    return lastUserNo;
  }
  const lastSavedOrPrinted = getLastSavedOrPrintedInvoiceNo();
  if (lastSavedOrPrinted) {
    return lastSavedOrPrinted;
  }
  const settings = loadInvoiceNumberSettings();
  return formatInvoiceNumberFromSettings(settings);
}

/**
 * Increment invoice number by +1 regardless of custom format.
 * Examples:
 *   "TK69 021" -> "TK69 022"
 *   "INV-2569/009" -> "INV-2569/010"
 *   "A-001" -> "A-002"
 */
export function incrementInvoiceNumber(current: string): string {
  if (!current || !current.trim()) {
    return getDefaultInvoiceNumber();
  }

  const trimmed = current.trim();

  // Match trailing sequence of digits
  const match = trimmed.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const digits = match[2];
    const nextNum = parseInt(digits, 10) + 1;
    // preserve padding length of the matched digits
    const padded = String(nextNum).padStart(digits.length, '0');
    return `${prefix}${padded}`;
  }

  // If ends with a space-separated number
  const tokens = trimmed.split(' ');
  const lastToken = tokens[tokens.length - 1];
  if (/^\d+$/.test(lastToken)) {
    const nextNum = parseInt(lastToken, 10) + 1;
    tokens[tokens.length - 1] = String(nextNum).padStart(lastToken.length, '0');
    return tokens.join(' ');
  }

  // Fallback
  return `${trimmed} 001`;
}

export function getLastSavedOrPrintedInvoiceNo(): string | null {
  try {
    return localStorage.getItem(LOCAL_STORAGE_LAST_SAVED_PRINTED_KEY);
  } catch {
    return null;
  }
}

export function setLastSavedOrPrintedInvoiceNo(invoiceNo: string): void {
  try {
    if (invoiceNo && invoiceNo.trim()) {
      localStorage.setItem(LOCAL_STORAGE_LAST_SAVED_PRINTED_KEY, invoiceNo.trim());
    }
  } catch {
    // ignore
  }
}

export function loadSavedIssuer(): IssuerInfo {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ISSUER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_ISSUER, ...parsed };
    }
  } catch {
    // fallback
  }
  return DEFAULT_ISSUER;
}

export function saveIssuerAsDefault(issuer: IssuerInfo): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_ISSUER_KEY, JSON.stringify(issuer));
  } catch (err) {
    console.error('Failed to save issuer info to localStorage', err);
  }
}

export function getNextInvoiceNumber(): string {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_COUNTER_KEY);
    const count = raw ? parseInt(raw, 10) + 1 : 22;
    localStorage.setItem(LOCAL_STORAGE_COUNTER_KEY, String(count));
    return generateInvoiceNumber(count);
  } catch {
    return generateInvoiceNumber(22);
  }
}

/**
 * Calculates totals according to user rules:
 * Mode 1: "NO_VAT":
 *   VAT = 0, Net Total = subtotal
 * Mode 2: "+VAT" (Price in table does not include tax):
 *   VAT = subtotal * 7%
 *   Net Total = subtotal + VAT
 * Mode 3: "-VAT" (Price in table already includes tax):
 *   Pre-tax subtotal = subtotal / 1.07
 *   VAT = subtotal - pre-tax subtotal
 *   Net Total = subtotal (same as table sum)
 */
export function calculateInvoice(items: InvoiceItem[], vatMode: VatMode): CalculationResult {
  const rawSubtotal = items.reduce((sum, item) => {
    const lineAmount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    return sum + lineAmount;
  }, 0);

  const subtotal = Math.round(rawSubtotal * 100) / 100;
  let vatAmount = 0;
  let netTotal = subtotal;
  let preTaxSubtotal = subtotal;

  if (vatMode === 'NO_VAT') {
    vatAmount = 0;
    netTotal = subtotal;
    preTaxSubtotal = subtotal;
  } else if (vatMode === 'ADD_VAT') {
    vatAmount = Math.round(subtotal * 0.07 * 100) / 100;
    netTotal = Math.round((subtotal + vatAmount) * 100) / 100;
    preTaxSubtotal = subtotal;
  } else if (vatMode === 'INC_VAT') {
    // "-VAT" mode: Table prices already include VAT
    // pre-tax subtotal = subtotal / 1.07
    preTaxSubtotal = Math.round((subtotal / 1.07) * 100) / 100;
    vatAmount = Math.round((subtotal - preTaxSubtotal) * 100) / 100;
    netTotal = subtotal; // Remains unchanged
  }

  const thaiBahtText = numberToThaiBahtText(netTotal);

  return {
    subtotal,
    vatRate: 7,
    vatAmount,
    netTotal,
    preTaxSubtotal,
    thaiBahtText,
  };
}
