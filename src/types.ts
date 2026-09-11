export type VatMode = 'NO_VAT' | 'ADD_VAT' | 'INC_VAT';

export type DocType = 'ORIGINAL' | 'COPY';

export interface CustomerProfile {
  id: string;
  alias: string; // ชื่อเรียก (ดัชนีสำหรับค้นหาและเลือก เช่น "สยามฟู้ดส์", "ซีพี ออลล์")
  companyName: string; // ชื่อบริษัท
  contact?: string; // ผู้ติดต่อ (ถ้ามี)
  phone?: string; // เบอร์โทรศัพท์ลูกค้า
  address: string; // ที่อยู่
  taxId: string; // เลขประจำตัวผู้เสียภาษี 13 หลัก
  branch: string; // สำนักงานใหญ่ หรือ รหัสสาขา เช่น "สำนักงานใหญ่", "00000"
  vatType: VatMode; // ประเภท VAT 3 รูปแบบ
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface IssuerInfo {
  name: string;
  address: string;
  taxId: string;
  branch: string;
  phone: string;
  facebook: string;
  logoUrl: string;
}

export interface CustomerInfo {
  alias?: string; // ชื่อเรียก / ดัชนี
  name: string;
  contact: string;
  phone?: string; // เบอร์โทรศัพท์
  address?: string;
  taxId?: string;
  branch?: string;
  deliveryDate: string; // YYYY-MM-DD
}

export interface InvoiceMeta {
  docType: DocType;
  invoiceNo: string;
  poNo: string;
  jobName: string;
  docDate: string; // YYYY-MM-DD
  receiverName: string;
  receiverDate: string;
  cashierName: string;
  cashierDate: string;
}

export interface CalculationResult {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  netTotal: number;
  preTaxSubtotal: number; // for -VAT, the price before tax
  thaiBahtText: string;
}

export interface SavedInvoiceRecord {
  id: string; // unique record ID
  savedAt: string; // ISO datetime string
  invoiceNo: string; // เลขที่ใบกำกับ เช่น TK69 022
  docDate: string; // วันที่ในเอกสาร YYYY-MM-DD
  customerName: string; // ชื่อบริษัท/ลูกค้า
  customerPhone?: string; // เบอร์โทรศัพท์ลูกค้า
  customerTaxId?: string; // เลขผู้เสียภาษี
  contactName?: string; // ผู้ติดต่อ
  netTotal: number; // ยอดรวมสุทธิ
  vatMode: VatMode; // ประเภท VAT
  itemCount: number; // จำนวนรายการสินค้า
  synced?: boolean; // สถานะการ sync ข้อมูลขึ้น Server (false = บันทึกใน IndexedDB รอ sync, true = sync สำเร็จแล้ว)
  syncedAt?: string; // เวลา ISO ที่ sync สำเร็จ
  snapshot: {
    issuer: IssuerInfo;
    customer: CustomerInfo;
    meta: InvoiceMeta;
    items: InvoiceItem[];
    vatMode: VatMode;
  };
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface SyncApiResponse {
  success: boolean;
  message?: string;
  syncedIds: string[];
  serverTimestamp?: string;
}
