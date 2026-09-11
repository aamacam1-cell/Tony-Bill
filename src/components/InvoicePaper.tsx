import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Calendar,
  RefreshCw,
  Building2,
  Phone,
  Share2,
  User,
  Users,
  BookmarkPlus,
  Tag,
  Store,
  Edit3,
} from 'lucide-react';
import {
  InvoiceItem,
  IssuerInfo,
  CustomerInfo,
  InvoiceMeta,
  VatMode,
  CalculationResult,
  DocType,
  CustomerProfile,
} from '../types';
import { TaxIdInput } from './TaxIdInput';
import { LogoUploader } from './LogoUploader';
import { formatThaiDate } from '../utils/dateFormatter';
import { getVatModeLabel } from '../utils/customerDb';

interface InvoicePaperProps {
  docType: DocType; // 'ORIGINAL' or 'COPY'
  issuer: IssuerInfo;
  onIssuerChange: (issuer: IssuerInfo) => void;
  customer: CustomerInfo;
  onCustomerChange: (customer: CustomerInfo) => void;
  meta: InvoiceMeta;
  onMetaChange: (meta: InvoiceMeta) => void;
  items: InvoiceItem[];
  onItemsChange: (items: InvoiceItem[]) => void;
  vatMode: VatMode;
  onVatModeChange: (mode: VatMode) => void;
  calcResult: CalculationResult;
  onRegenerateInvoiceNo: () => void;
  customers: CustomerProfile[];
  onSelectCustomer: (customer: CustomerProfile) => void;
  onOpenCustomerModal: () => void;
  onQuickSaveCustomer: () => void;
  onOpenIssuerModal?: () => void;
}

export const InvoicePaper: React.FC<InvoicePaperProps> = ({
  docType,
  issuer,
  onIssuerChange,
  customer,
  onCustomerChange,
  meta,
  onMetaChange,
  items,
  onItemsChange,
  vatMode,
  onVatModeChange,
  calcResult,
  onRegenerateInvoiceNo,
  customers,
  onSelectCustomer,
  onOpenCustomerModal,
  onQuickSaveCustomer,
  onOpenIssuerModal,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Helper to update customer
  const updateCustomer = (field: keyof CustomerInfo, val: string) => {
    onCustomerChange({ ...customer, [field]: val });
  };

  // Helper to update issuer
  const updateIssuer = (field: keyof IssuerInfo, val: string) => {
    onIssuerChange({ ...issuer, [field]: val });
  };

  // Helper to update meta
  const updateMeta = (field: keyof InvoiceMeta, val: string) => {
    onMetaChange({ ...meta, [field]: val });
  };

  // Add new item row
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: String(Date.now()),
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    onItemsChange([...items, newItem]);
  };

  // Remove item row
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      onItemsChange([
        {
          id: String(Date.now()),
          description: '',
          quantity: 1,
          unitPrice: 0,
          amount: 0,
        },
      ]);
      return;
    }
    const updated = items.filter((_, i) => i !== index);
    onItemsChange(updated);
  };

  // Update item field
  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const updated = [...items];
    const target = { ...updated[index] };

    if (field === 'description') {
      target.description = String(value);
    } else if (field === 'quantity') {
      const q = parseFloat(String(value)) || 0;
      target.quantity = q;
      target.amount = Math.round(q * target.unitPrice * 100) / 100;
    } else if (field === 'unitPrice') {
      const p = parseFloat(String(value)) || 0;
      target.unitPrice = p;
      target.amount = Math.round(target.quantity * p * 100) / 100;
    }

    updated[index] = target;
    onItemsChange(updated);
  };

  // Format currency helper
  const fmt = (num: number) => {
    return (num || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const isOriginal = docType === 'ORIGINAL';

  return (
    <div className="a4-page a4-paper text-slate-800 flex flex-col justify-between text-xs leading-normal bg-white">
      {/* Top Main Section */}
      <div>
        {/* ========================================================================= */}
        {/* SECTION 1: HEADER (Space-Optimized & Centered Title)                       */}
        {/* ========================================================================= */}
        <header className="border-b-2 border-orange-500 pb-2 mb-2">
          <div className="grid grid-cols-3 items-center gap-2">
            {/* Top Left: Store Logo (Compact) */}
            <div className="flex items-center justify-start">
              <LogoUploader
                compact={true}
                logoUrl={issuer.logoUrl}
                onChange={(url) => updateIssuer('logoUrl', url)}
              />
            </div>

            {/* Top Center: Centered 2-line Title */}
            <div className="text-center px-1">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 print:text-black leading-tight whitespace-nowrap">
                ใบกำกับภาษี / ใบเสร็จรับเงิน
              </h1>
              <p className="text-[11px] font-semibold text-slate-600 tracking-wider mt-0.5 whitespace-nowrap">
                TAX INVOICE / RECEIPT
              </p>
            </div>

            {/* Top Right: Box displaying "ต้นฉบับ ORIGINAL" or "สำเนา COPY" */}
            <div className="flex items-center justify-end">
              <div
                className={`border-2 rounded-md px-3 py-1 text-center min-w-[110px] print:border-black print:bg-transparent ${
                  isOriginal
                    ? 'border-orange-600 bg-orange-50/40 text-orange-700'
                    : 'border-slate-500 bg-slate-100/60 text-slate-800'
                }`}
              >
                <div className="font-bold text-sm leading-none print:text-black">
                  {isOriginal ? 'ต้นฉบับ' : 'สำเนา'}
                </div>
                <div className="text-[10px] font-semibold tracking-wider opacity-80 mt-0.5 leading-none print:text-black">
                  {isOriginal ? 'ORIGINAL' : 'COPY'}
                </div>
              </div>
            </div>
          </div>

          {/* Under Header: Compact Meta Fields Grid (เลขที่, วันที่, PO, ผู้ติดต่อ) */}
          <div className="mt-1.5 pt-1.5 border-t border-dashed border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            {/* เลขที่ใบกำกับ */}
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-700 whitespace-nowrap text-[11px]">
                เลขที่:
              </span>
              <div className="flex items-center gap-0.5 flex-1 min-w-0">
                <input
                  type="text"
                  value={meta.invoiceNo}
                  onChange={(e) => updateMeta('invoiceNo', e.target.value)}
                  placeholder="เช่น TK69 021"
                  className="font-bold text-orange-600 print:text-black px-1.5 py-0.5 rounded border border-slate-200 focus:border-orange-400 focus:bg-orange-50/50 w-full focus:outline-none text-xs"
                />
                <button
                  type="button"
                  onClick={onRegenerateInvoiceNo}
                  className="no-print p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-orange-600 transition-colors shrink-0 cursor-pointer"
                  title="สร้างเลขที่ใบกำกับอัตโนมัติ"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* วันที่เอกสาร */}
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-700 whitespace-nowrap text-[11px]">
                วันที่:
              </span>
              <div className="relative flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full text-left font-medium text-slate-800 bg-white print:bg-transparent px-1.5 py-0.5 rounded border border-slate-200 focus:border-orange-400 flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>{formatThaiDate(meta.docDate)}</span>
                  <Calendar className="w-3 h-3 text-orange-600 no-print shrink-0 ml-1" />
                </button>
                {showDatePicker && (
                  <div className="no-print absolute z-20 top-full mt-1 bg-white p-2 rounded-lg shadow-xl border border-slate-200">
                    <input
                      type="date"
                      value={meta.docDate}
                      onChange={(e) => {
                        updateMeta('docDate', e.target.value);
                        setShowDatePicker(false);
                      }}
                      className="text-xs p-1 border rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* เลขที่ PO */}
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-700 whitespace-nowrap text-[11px]">
                เลขที่ PO:
              </span>
              <input
                type="text"
                value={meta.poNo}
                onChange={(e) => updateMeta('poNo', e.target.value)}
                placeholder="ระบุถ้ามี"
                className="px-1.5 py-0.5 rounded border border-slate-200 focus:border-orange-400 focus:bg-orange-50/50 w-full focus:outline-none text-xs"
              />
            </div>

            {/* ผู้ติดต่อ (เปลี่ยนจากชื่องาน) */}
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-700 whitespace-nowrap text-[11px]">
                ผู้ติดต่อ:
              </span>
              <input
                type="text"
                value={meta.jobName}
                onChange={(e) => updateMeta('jobName', e.target.value)}
                placeholder="ระบุผู้ติดต่อ"
                className="px-1.5 py-0.5 rounded border border-slate-200 focus:border-orange-400 focus:bg-orange-50/50 w-full focus:outline-none text-xs truncate"
              />
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* SECTION 2 & 3: ISSUER (LEFT) & CUSTOMER (RIGHT) - COMPACT                 */}
        {/* ========================================================================= */}
        {/* SECTION 2 & 3: ISSUER (TOP) & CUSTOMER (BOTTOM)                           */}
        {/* ========================================================================= */}
        <div className="space-y-1 pb-2 mb-2 border-b border-slate-200">
          {/* Top: Issuer Info (ข้อมูลผู้ออกใบกำกับภาษี / ผู้ขาย) */}
          <div className="bg-slate-50/60 print:bg-transparent rounded-md p-2 border border-slate-200/80 print:border-none print:p-0">
            <div className="flex items-center justify-between text-orange-600 print:text-black font-bold text-xs pb-1 mb-1 border-b border-slate-200 print:border-slate-300">
              <div className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>ผู้ออกใบกำกับภาษี / ผู้ขาย</span>
              </div>
              {onOpenIssuerModal && (
                <button
                  type="button"
                  onClick={onOpenIssuerModal}
                  className="no-print inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-white hover:bg-orange-50 border border-slate-300 hover:border-orange-400 text-slate-700 hover:text-orange-700 rounded shadow-2xs font-semibold transition-colors cursor-pointer"
                  title="แก้ไขข้อมูลร้านค้า / บริษัทผู้ออกใบกำกับภาษี"
                >
                  <Store className="w-3 h-3 text-orange-600" />
                  <span>แก้ไขข้อมูลร้าน</span>
                </button>
              )}
            </div>

            <div className="space-y-1 text-xs">
              {/* บรรทัด 1: ชื่อบริษัท + ย้าย สาขา มาต่อท้ายในบรรทัดเดียวกัน */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                  <span className="text-slate-600 print:text-black font-medium text-[11px] whitespace-nowrap shrink-0">
                    ชื่อ:
                  </span>
                  <input
                    type="text"
                    value={issuer.name}
                    onChange={(e) => updateIssuer('name', e.target.value)}
                    placeholder="ชื่อบริษัท / ร้านค้า"
                    className="w-full font-bold text-slate-900 print:text-black bg-white print:bg-transparent border border-slate-200 print:border-none focus:border-orange-400 focus:outline-none px-1.5 py-0.5 rounded text-xs"
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-medium text-slate-600 print:text-black whitespace-nowrap text-[11px]">
                    สาขา:
                  </span>
                  <input
                    type="text"
                    value={issuer.branch}
                    onChange={(e) => updateIssuer('branch', e.target.value)}
                    placeholder="เช่น สำนักงานใหญ่ หรือ 00000"
                    className="w-36 px-1.5 py-0.5 bg-white print:bg-transparent border border-slate-200 print:border-none rounded focus:border-orange-400 focus:outline-none text-[11px]"
                  />
                </div>
              </div>

              {/* บรรทัด 2: ที่อยู่ + ย้าย เบอร์โทร ให้ไปอยู่ต่อท้ายในบรรทัดเดียวกัน */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                  <span className="text-slate-600 print:text-black font-medium text-[11px] whitespace-nowrap shrink-0">
                    ที่อยู่:
                  </span>
                  <input
                    type="text"
                    value={issuer.address}
                    onChange={(e) => updateIssuer('address', e.target.value)}
                    placeholder="ที่อยู่ร้านค้า"
                    className="w-full text-slate-700 print:text-black bg-white print:bg-transparent border border-slate-200 print:border-none focus:border-orange-400 focus:outline-none px-1.5 py-0.5 rounded text-[11px]"
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-medium text-slate-600 print:text-black whitespace-nowrap text-[11px] flex items-center gap-0.5">
                    <Phone className="w-2.5 h-2.5 text-orange-600 print:text-black shrink-0" />
                    <span>โทรศัพท์:</span>
                  </span>
                  <input
                    type="text"
                    value={issuer.phone}
                    onChange={(e) => updateIssuer('phone', e.target.value)}
                    placeholder="เช่น 02-719-8999, 089-123-4567"
                    className="w-44 px-1.5 py-0.5 bg-white print:bg-transparent border border-slate-200 print:border-none rounded focus:border-orange-400 focus:outline-none text-[11px]"
                  />
                </div>
              </div>

              {/* บรรทัด 3: ขยับ เลขประจำตัวผู้เสียภาษี ขึ้นไปติดกับบรรทัดที่อยู่ */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="font-medium text-slate-600 print:text-black text-[11px] whitespace-nowrap">
                  เลขประจำตัวผู้เสียภาษี:
                </span>
                <TaxIdInput
                  compact={true}
                  value={issuer.taxId}
                  onChange={(val) => updateIssuer('taxId', val)}
                />
              </div>
            </div>
          </div>

          {/* เว้นบรรทัดว่าง ระหว่าง ส่วนของ "ผู้ขาย" กับ "ผู้ซื้อ" ให้เห็นชัดเจน */}
          <div className="h-3 my-1.5 print:h-4 print:my-2" aria-hidden="true" />

          {/* Bottom: Customer Info (ข้อมูลลูกค้า / ผู้ซื้อ) With Local Database Dropdown & Quick Select */}
          <div className="bg-slate-50/60 print:bg-transparent rounded-md p-2 border border-slate-200/80 print:border-none print:p-0">
            {/* Customer Header + Dropdown Search */}
            <div className="flex items-center justify-between text-slate-900 font-bold text-xs pb-1 mb-1 border-b border-slate-200 print:border-slate-300">
              <div className="flex items-center gap-1 text-orange-600 print:text-black">
                <User className="w-3.5 h-3.5" />
                <span>ลูกค้า / ผู้ซื้อ</span>
              </div>

              {/* Action buttons for Customer Database */}
              <div className="no-print flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={onQuickSaveCustomer}
                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-white border border-slate-300 hover:border-orange-400 hover:text-orange-600 rounded shadow-2xs font-medium transition-colors cursor-pointer"
                  title="บันทึกข้อมูลลูกค้าที่กรอกอยู่นี้ลงในฐานข้อมูล"
                >
                  <BookmarkPlus className="w-3 h-3 text-orange-600" />
                  <span>บันทึกคนนี้</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenCustomerModal}
                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-orange-600 hover:bg-orange-700 text-white rounded shadow-2xs font-semibold transition-colors cursor-pointer"
                  title="เปิดหน้าต่างจัดการฐานข้อมูลลูกค้าทั้งหมด"
                >
                  <Users className="w-3 h-3" />
                  <span>จัดการฐานข้อมูล</span>
                </button>
              </div>
            </div>

            {/* Dropdown to select customer */}
            <div className="no-print mb-1.5 flex items-center gap-1 min-w-0 max-w-full overflow-hidden">
              <span className="text-[10px] font-semibold text-slate-600 whitespace-nowrap flex items-center gap-0.5 shrink-0">
                <Tag className="w-3 h-3 text-orange-600" />
                <span>เลือกชื่อลูกค้า:</span>
              </span>
              <select
                onChange={(e) => {
                  const found = customers.find((c) => c.id === e.target.value);
                  if (found) {
                    onSelectCustomer(found);
                  }
                }}
                defaultValue=""
                className="w-full min-w-0 max-w-full px-1.5 py-0.5 bg-white border border-orange-300 rounded text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500 truncate cursor-pointer"
              >
                <option value="" disabled>
                  -- เลือกชื่อลูกค้า --
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    ⭐ {c.alias} — {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 text-xs">
              {/* บรรทัด 1: ชื่อลูกค้า + ย้าย สาขา มาต่อท้ายในบรรทัดเดียวกัน */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                  <span className="text-slate-600 print:text-black font-medium text-[11px] whitespace-nowrap shrink-0">
                    ชื่อ:
                  </span>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => updateCustomer('name', e.target.value)}
                    placeholder="ชื่อบริษัท / ลูกค้า / ผู้ซื้อ"
                    className="w-full font-bold text-slate-900 print:text-black bg-white print:bg-transparent border border-slate-200 print:border-none focus:border-orange-400 focus:outline-none px-1.5 py-0.5 rounded text-xs"
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-medium text-slate-600 print:text-black whitespace-nowrap text-[11px]">
                    สาขา:
                  </span>
                  <input
                    type="text"
                    value={customer.branch || ''}
                    onChange={(e) => updateCustomer('branch', e.target.value)}
                    placeholder="เช่น สำนักงานใหญ่ หรือ 00000"
                    className="w-36 px-1.5 py-0.5 bg-white print:bg-transparent border border-slate-200 print:border-none rounded focus:border-orange-400 focus:outline-none text-[11px]"
                  />
                </div>
              </div>

              {/* บรรทัด 2: ที่อยู่ + ย้าย เบอร์โทร ให้ไปอยู่ต่อท้ายในบรรทัดเดียวกัน */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                  <span className="text-slate-600 print:text-black font-medium text-[11px] whitespace-nowrap shrink-0">
                    ที่อยู่:
                  </span>
                  <input
                    type="text"
                    value={customer.address || ''}
                    onChange={(e) => updateCustomer('address', e.target.value)}
                    placeholder="ที่อยู่ลูกค้า (เลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์)"
                    className="w-full text-slate-700 print:text-black bg-white print:bg-transparent border border-slate-200 print:border-none focus:border-orange-400 focus:outline-none px-1.5 py-0.5 rounded text-[11px]"
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-medium text-slate-600 print:text-black whitespace-nowrap text-[11px] flex items-center gap-0.5">
                    <Phone className="w-2.5 h-2.5 text-orange-600 print:text-black shrink-0" />
                    <span>โทร:</span>
                  </span>
                  <input
                    type="text"
                    value={customer.phone || ''}
                    onChange={(e) => updateCustomer('phone', e.target.value)}
                    placeholder="เบอร์โทรลูกค้า"
                    className="w-44 px-1.5 py-0.5 bg-white print:bg-transparent border border-slate-200 print:border-none rounded focus:border-orange-400 focus:outline-none text-[11px]"
                  />
                </div>
              </div>

              {/* บรรทัด 3: ขยับ เลขประจำตัวผู้เสียภาษี ขึ้นไปติดกับบรรทัดที่อยู่ */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="font-medium text-slate-600 print:text-black text-[11px] whitespace-nowrap">
                  เลขประจำตัวผู้เสียภาษี:
                </span>
                <TaxIdInput
                  compact={true}
                  value={customer.taxId || ''}
                  onChange={(val) => updateCustomer('taxId', val)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: PRODUCT & SERVICE TABLE                                        */}
        {/* ========================================================================= */}
        <div className="mb-3">
          <div className="border border-orange-400 rounded overflow-hidden print:border-black">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-orange-500 text-white font-bold border-b border-orange-400 print:bg-slate-200 print:text-black print:border-black">
                  <th className="w-10 py-1.5 px-1 text-center border-r border-orange-400 print:border-black">
                    ลำดับ
                  </th>
                  <th className="py-1.5 px-2 border-r border-orange-400 print:border-black">
                    รายการสินค้า / บริการ (DESCRIPTION)
                  </th>
                  <th className="w-20 py-1.5 px-2 text-center border-r border-orange-400 print:border-black">
                    จำนวน
                  </th>
                  <th className="w-24 py-1.5 px-2 text-right border-r border-orange-400 print:border-black">
                    ราคา/หน่วย
                  </th>
                  <th className="w-28 py-1.5 px-2 text-right border-r border-orange-400 print:border-black">
                    ราคารวม
                  </th>
                  <th className="w-8 py-1.5 text-center no-print">
                    ลบ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-200 print:divide-slate-300">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-orange-50/20 transition-colors">
                    {/* Index */}
                    <td className="py-1 px-1 text-center font-medium text-slate-600 border-r border-orange-400 print:border-black select-none text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Description */}
                    <td className="py-1 px-2 border-r border-orange-400 print:border-black">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        placeholder="ระบุชื่อสินค้า หรือรายละเอียดบริการ..."
                        className="w-full py-0.5 px-1 bg-transparent rounded focus:bg-white focus:ring-1 focus:ring-orange-400 focus:outline-none text-xs"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="py-1 px-1 border-r border-orange-400 print:border-black">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.quantity === 0 ? '' : item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        placeholder="0"
                        className="w-full text-center py-0.5 px-1 bg-transparent rounded focus:bg-white focus:ring-1 focus:ring-orange-400 focus:outline-none font-medium text-xs"
                      />
                    </td>

                    {/* Unit Price */}
                    <td className="py-1 px-1 text-right border-r border-orange-400 print:border-black">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice === 0 ? '' : item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        placeholder="0.00"
                        className="w-full text-right py-0.5 px-1 bg-transparent rounded focus:bg-white focus:ring-1 focus:ring-orange-400 focus:outline-none font-mono text-xs"
                      />
                    </td>

                    {/* Amount */}
                    <td className="py-1 px-2 text-right font-mono font-semibold text-slate-900 border-r border-orange-400 print:border-black select-all text-xs">
                      {fmt(item.amount)}
                    </td>

                    {/* Delete action button (hidden in print) */}
                    <td className="py-1 px-1 text-center no-print">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveItem(idx);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer inline-flex items-center justify-center"
                        title={items.length > 1 ? 'ลบแถวสินค้านี้' : 'ล้างข้อมูลแถวนี้'}
                      >
                        <Trash2 className="w-4 h-4 mx-auto text-slate-400 hover:text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Add Item Button Row (Hidden in print) */}
                <tr className="no-print bg-orange-50/30">
                  <td colSpan={6} className="py-1 px-3">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 hover:text-orange-900 py-0.5 px-2 rounded hover:bg-orange-100/70 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ เพิ่มรายการสินค้า/บริการ</span>
                    </button>
                  </td>
                </tr>

                {/* Thai Baht text row */}
                <tr className="bg-slate-50/80 border-t-2 border-orange-400 print:bg-slate-50 print:border-black">
                  <td
                    colSpan={3}
                    className="py-2 px-2.5 text-left border-r border-orange-400 print:border-black text-slate-700 align-middle"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 shrink-0 text-xs">
                        จำนวนเงินตัวอักษร:
                      </span>
                      <span className="font-medium text-slate-800 italic bg-white/70 print:bg-transparent px-1.5 py-0.5 rounded border border-slate-200 print:border-none text-xs">
                        ({calcResult.thaiBahtText})
                      </span>
                    </div>
                  </td>
                  <td
                    colSpan={3}
                    className="p-0 align-top"
                  >
                    {/* Placeholder cell aligned with table */}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5 & 6: SUMMARY TOTALS (Card Removed, Clean Compact Layout)         */}
        {/* ========================================================================= */}
        <div className="flex justify-end items-start mb-3">
          {/* Right: Financial Totals Box */}
          <div className="w-full sm:w-72 bg-slate-50/90 print:bg-transparent rounded border border-slate-200 print:border-black p-2.5 text-xs space-y-1">
            {/* Case 1: NO_VAT */}
            {vatMode === 'NO_VAT' && (
              <>
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">รวมเป็นเงิน (SUBTOTAL):</span>
                  <span className="font-mono">{fmt(calcResult.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>ภาษีมูลค่าเพิ่ม (VAT 0%):</span>
                  <span className="font-mono">0.00</span>
                </div>
                <div className="border-t-2 border-orange-500 print:border-black pt-1 mt-1 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>ยอดรวมสุทธิ (TOTAL):</span>
                  <span className="font-mono text-orange-600 print:text-black">
                    {fmt(calcResult.netTotal)} บาท
                  </span>
                </div>
              </>
            )}

            {/* Case 2: ADD_VAT */}
            {vatMode === 'ADD_VAT' && (
              <>
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">รวมเป็นเงิน (SUBTOTAL):</span>
                  <span className="font-mono">{fmt(calcResult.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-orange-700 print:text-black">
                  <span className="font-medium">ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                  <span className="font-mono font-semibold">+{fmt(calcResult.vatAmount)}</span>
                </div>
                <div className="border-t-2 border-orange-500 print:border-black pt-1 mt-1 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>ยอดรวมสุทธิ (TOTAL):</span>
                  <span className="font-mono text-orange-600 print:text-black">
                    {fmt(calcResult.netTotal)} บาท
                  </span>
                </div>
              </>
            )}

            {/* Case 3: INC_VAT */}
            {vatMode === 'INC_VAT' && (
              <>
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">ราคารวมภาษีแล้ว:</span>
                  <span className="font-mono">{fmt(calcResult.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 text-[11px]">
                  <span>ราคาก่อนภาษี (PRE-TAX):</span>
                  <span className="font-mono">{fmt(calcResult.preTaxSubtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-700 print:text-black">
                  <span className="font-medium">ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                  <span className="font-mono font-semibold">{fmt(calcResult.vatAmount)}</span>
                </div>
                <div className="border-t-2 border-orange-500 print:border-black pt-1 mt-1 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>ยอดรวมสุทธิ (TOTAL):</span>
                  <span className="font-mono text-orange-600 print:text-black">
                    {fmt(calcResult.netTotal)} บาท
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 7: SIGNATURES FOOTER                                              */}
      {/* ========================================================================= */}
      <footer className="pt-2 border-t-2 border-orange-500 print:border-black mt-2">
        <div className="grid grid-cols-2 gap-6 text-center text-xs">
          {/* Left: Receiver Signature */}
          <div className="flex flex-col items-center">
            <div className="font-semibold text-slate-800 mb-6">ผู้รับสินค้า / บริการ (RECEIVER)</div>
            <div className="w-52 border-b border-dashed border-slate-400 mb-1.5" />
            <div className="flex items-center justify-center gap-1 w-52 mb-1">
              <span className="text-slate-500 text-[11px]">ลงชื่อ:</span>
              <input
                type="text"
                value={meta.receiverName}
                onChange={(e) => updateMeta('receiverName', e.target.value)}
                placeholder="(......................................................)"
                className="text-center font-medium text-slate-800 focus:bg-orange-50/50 rounded px-1 border-transparent focus:border-orange-300 focus:outline-none w-full text-xs"
              />
            </div>
            <div className="flex items-center justify-center gap-1 w-52 text-[11px] text-slate-500">
              <span>วันที่:</span>
              <input
                type="text"
                value={meta.receiverDate}
                onChange={(e) => updateMeta('receiverDate', e.target.value)}
                placeholder="วันที่รับสินค้า"
                className="text-center font-medium text-slate-700 focus:bg-orange-50/50 rounded px-1 border-transparent focus:border-orange-300 focus:outline-none w-32 text-xs"
              />
            </div>
          </div>

          {/* Right: Cashier / Issuer Signature */}
          <div className="flex flex-col items-center">
            <div className="font-semibold text-slate-800 mb-6">ผู้รับเงิน / แคชเชียร์ (AUTHORIZED SIGNATURE)</div>
            <div className="w-52 border-b border-dashed border-slate-400 mb-1.5" />
            <div className="flex items-center justify-center gap-1 w-52 mb-1">
              <span className="text-slate-500 text-[11px]">ลงชื่อ:</span>
              <input
                type="text"
                value={meta.cashierName}
                onChange={(e) => updateMeta('cashierName', e.target.value)}
                placeholder="(......................................................)"
                className="text-center font-medium text-slate-800 focus:bg-orange-50/50 rounded px-1 border-transparent focus:border-orange-300 focus:outline-none w-full text-xs"
              />
            </div>
            <div className="flex items-center justify-center gap-1 w-52 text-[11px] text-slate-500">
              <span>วันที่:</span>
              <input
                type="text"
                value={meta.cashierDate}
                onChange={(e) => updateMeta('cashierDate', e.target.value)}
                placeholder="วันที่รับเงิน"
                className="text-center font-medium text-slate-700 focus:bg-orange-50/50 rounded px-1 border-transparent focus:border-orange-300 focus:outline-none w-32 text-xs"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
