import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Calendar,
  Building2,
  Phone,
  User,
  Users,
  BookmarkPlus,
  Tag,
  Store,
  FileText,
} from 'lucide-react';
import {
  InvoiceItem,
  IssuerInfo,
  CustomerInfo,
  QuotationMeta,
  VatMode,
  CalculationResult,
  CustomerProfile,
} from '../types';
import { TaxIdInput } from './TaxIdInput';
import { LogoUploader } from './LogoUploader';
import { formatThaiDate, getTodayISODate } from '../utils/dateFormatter';

interface QuotationPaperProps {
  issuer: IssuerInfo;
  onIssuerChange: (issuer: IssuerInfo) => void;
  customer: CustomerInfo;
  onCustomerChange: (customer: CustomerInfo) => void;
  meta: QuotationMeta;
  onMetaChange: (meta: QuotationMeta) => void;
  items: InvoiceItem[];
  onItemsChange: (items: InvoiceItem[]) => void;
  vatMode: VatMode;
  onVatModeChange: (mode: VatMode) => void;
  calcResult: CalculationResult;
  onIncrementQuotationNo?: () => void;
  customers: CustomerProfile[];
  onSelectCustomer: (customer: CustomerProfile) => void;
  onOpenCustomerModal: () => void;
  onQuickSaveCustomer: () => void;
  onOpenIssuerModal?: () => void;
}

export const QuotationPaper: React.FC<QuotationPaperProps> = ({
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
  onIncrementQuotationNo,
  customers,
  onSelectCustomer,
  onOpenCustomerModal,
  onQuickSaveCustomer,
  onOpenIssuerModal,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingPriceIdx, setEditingPriceIdx] = useState<number | null>(null);
  const [editingPriceVal, setEditingPriceVal] = useState<string>('');
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [editingDiscountVal, setEditingDiscountVal] = useState<string>('');

  const selectedCustomerId = useMemo(() => {
    if (!customer.name && !customer.alias) return '';
    const match = customers.find(
      (c) =>
        (customer.alias && c.alias === customer.alias) ||
        (customer.name && c.companyName === customer.name)
    );
    return match ? match.id : '';
  }, [customers, customer.alias, customer.name]);

  const updateCustomer = (field: keyof CustomerInfo, val: string) => {
    onCustomerChange({ ...customer, [field]: val });
  };

  const updateIssuer = (field: keyof IssuerInfo, val: string) => {
    onIssuerChange({ ...issuer, [field]: val });
  };

  const updateMeta = (field: keyof QuotationMeta, val: string) => {
    if (field === 'docDate') {
      const formattedDate = formatThaiDate(val);
      onMetaChange({
        ...meta,
        docDate: val,
        quoterDate: formattedDate,
      });
    } else {
      onMetaChange({ ...meta, [field]: val });
    }
  };

  const updateDiscount = (rawVal: string) => {
    const cleaned = rawVal.replace(/,/g, '').trim();
    const num = cleaned === '' ? 0 : Math.max(0, parseFloat(cleaned) || 0);
    onMetaChange({ ...meta, discount: num });
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: String(Date.now()),
      description: '',
      quantity: 0,
      unitPrice: 0,
      amount: 0,
    };
    onItemsChange([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      onItemsChange([
        {
          id: String(Date.now()),
          description: '',
          quantity: 0,
          unitPrice: 0,
          amount: 0,
        },
      ]);
      return;
    }
    setEditingPriceIdx(null);
    setEditingPriceVal('');
    onItemsChange(items.filter((_, i) => i !== index));
  };

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
      const valStr = String(value).trim();
      const q = valStr === '' ? 0 : parseFloat(valStr) || 0;
      target.quantity = q;
      target.amount = Math.round(q * target.unitPrice * 100) / 100;
    } else if (field === 'unitPrice') {
      const valStr = String(value).replace(/,/g, '').trim();
      const p = valStr === '' ? 0 : parseFloat(valStr) || 0;
      target.unitPrice = p;
      target.amount = Math.round(target.quantity * p * 100) / 100;
    }

    updated[index] = target;
    onItemsChange(updated);
  };

  const fmt = (num: number) => {
    return (num || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="a4-page a4-paper text-slate-800 flex flex-col justify-between text-sm leading-relaxed bg-white">
      {/* Top Main Section */}
      <div>
        {/* ========================================================================= */}
        {/* SECTION 1: HEADER                                                         */}
        {/* ========================================================================= */}
        <header className="border-b-2 border-orange-500 pb-2 mb-2">
          <div className="grid grid-cols-3 items-center gap-2">
            {/* Top Left: Store Logo */}
            <div className="flex items-center justify-start">
              <LogoUploader
                compact={true}
                logoUrl={issuer.logoUrl}
                onChange={(url) => updateIssuer('logoUrl', url)}
              />
            </div>

            {/* Top Center: Title */}
            <div className="text-center px-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 print:text-black leading-tight whitespace-nowrap">
                ใบเสนอราคา
              </h1>
              <p className="text-xs sm:text-sm font-bold text-slate-600 tracking-wider mt-0.5 whitespace-nowrap">
                QUOTATION
              </p>
            </div>

            {/* Top Right: Badge */}
            <div className="flex items-center justify-end">
              <div className="border-2 rounded-md px-3.5 py-1.5 text-center min-w-[120px] border-orange-600 bg-orange-50/40 text-orange-700 print:border-black print:bg-transparent">
                <div className="font-bold text-base sm:text-lg leading-tight print:text-black">
                  ใบเสนอราคา
                </div>
                <div className="text-xs font-semibold tracking-wider opacity-80 mt-0.5 leading-none print:text-black">
                  QUOTATION
                </div>
              </div>
            </div>
          </div>

          {/* Under Header: Meta Fields Grid */}
          <div className="mt-2 pt-2 border-t border-dashed border-slate-200 grid grid-cols-2 sm:grid-cols-[1.2fr_1.15fr_0.85fr_0.8fr] gap-2 text-xs sm:text-sm">
            {/* เลขที่ใบเสนอราคา */}
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-semibold text-slate-700 whitespace-nowrap text-xs sm:text-sm shrink-0">
                เลขที่:
              </span>
              <div className="flex items-center gap-0.5 flex-1 min-w-0">
                <input
                  type="text"
                  value={meta.quotationNo}
                  onChange={(e) => updateMeta('quotationNo', e.target.value)}
                  placeholder="ระบุเลขที่ใบเสนอราคา"
                  className="font-bold text-orange-600 print:text-black px-1.5 py-1 rounded border border-slate-200 focus:border-orange-400 focus:bg-orange-50/50 w-full min-w-0 focus:outline-none text-xs sm:text-[13px] font-mono tracking-tight"
                />
                {onIncrementQuotationNo && (
                  <button
                    type="button"
                    onClick={onIncrementQuotationNo}
                    className="no-print p-0.5 rounded hover:bg-orange-50 text-slate-400 hover:text-orange-600 transition-colors shrink-0 cursor-pointer"
                    title="เพิ่มเลขที่ใบเสนอราคาถัดไป (+1)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* วันที่เอกสาร */}
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-semibold text-slate-700 whitespace-nowrap text-xs sm:text-sm shrink-0">
                วันที่:
              </span>
              <div className="relative flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full text-left font-medium text-slate-800 bg-white print:bg-transparent px-1.5 py-1 rounded border border-slate-200 focus:border-orange-400 flex items-center justify-between text-xs cursor-pointer min-w-0"
                  title="คลิกเพื่อเลือกวันที่"
                >
                  <span className="whitespace-nowrap truncate">{formatThaiDate(meta.docDate)}</span>
                  <Calendar className="w-3 h-3 text-orange-600 no-print shrink-0 ml-0.5" />
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
                      className="text-sm p-1.5 border rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ยืนราคา */}
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-semibold text-slate-700 whitespace-nowrap text-xs sm:text-sm shrink-0">
                ยืนราคา:
              </span>
              <input
                type="text"
                value={meta.validityDays}
                onChange={(e) => updateMeta('validityDays', e.target.value)}
                placeholder="เช่น 30 วัน"
                className="px-1.5 py-1 rounded border border-slate-200 focus:border-orange-400 focus:bg-orange-50/50 w-full min-w-0 focus:outline-none text-xs"
              />
            </div>

            {/* ผู้ติดต่อ */}
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-semibold text-slate-700 whitespace-nowrap text-xs sm:text-sm shrink-0">
                ผู้ติดต่อ:
              </span>
              <input
                type="text"
                value={meta.contactPerson}
                onChange={(e) => updateMeta('contactPerson', e.target.value)}
                placeholder="ระบุผู้ติดต่อ"
                className="px-1.5 py-1 rounded border border-slate-200 focus:border-orange-400 focus:bg-orange-50/50 w-full min-w-0 focus:outline-none text-xs truncate"
              />
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* SECTION 2 & 3: ISSUER & CUSTOMER                                          */}
        {/* ========================================================================= */}
        <div className="space-y-1 pb-2 mb-2 border-b border-slate-200">
          {/* Issuer */}
          <div className="bg-slate-50/60 print:bg-transparent rounded-md p-2.5 border border-slate-200/80 print:border-none print:p-0">
            <div className="flex items-center justify-between text-orange-600 print:text-black font-bold text-xs sm:text-sm pb-1 mb-1.5 border-b border-slate-200 print:border-slate-300">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                <span>ผู้เสนอราคา / ผู้ขาย</span>
              </div>
              {onOpenIssuerModal && (
                <button
                  type="button"
                  onClick={onOpenIssuerModal}
                  className="no-print inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-white hover:bg-orange-50 border border-slate-300 hover:border-orange-400 text-slate-700 hover:text-orange-700 rounded shadow-2xs font-semibold transition-colors cursor-pointer"
                  title="แก้ไขข้อมูลร้านค้า / บริษัท"
                >
                  <Store className="w-3.5 h-3.5 text-orange-600" />
                  <span>แก้ไขข้อมูลร้าน</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5 text-xs sm:text-sm">
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                  <span className="text-slate-700 print:text-black font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0">
                    ชื่อ:
                  </span>
                  <input
                    type="text"
                    value={issuer.name}
                    onChange={(e) => updateIssuer('name', e.target.value)}
                    placeholder="ชื่อบริษัท / ร้านค้า"
                    className="w-full font-bold text-slate-900 print:text-black bg-white print:bg-transparent border border-slate-200 print:border-none focus:border-orange-400 focus:outline-none px-2 py-0.5 rounded text-sm sm:text-base"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-semibold text-slate-700 print:text-black whitespace-nowrap text-xs sm:text-sm">
                    สาขา:
                  </span>
                  <input
                    type="text"
                    value={issuer.branch}
                    onChange={(e) => updateIssuer('branch', e.target.value)}
                    placeholder="เช่น สำนักงานใหญ่ หรือ 00000"
                    className="w-40 px-2 py-0.5 bg-white print:bg-transparent border border-slate-200 print:border-none rounded focus:border-orange-400 focus:outline-none text-xs sm:text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-start gap-2">
                <div className="flex items-start gap-1.5 flex-1 min-w-[200px]">
                  <span className="text-slate-700 print:text-black font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 pt-0.5 print:pt-0">
                    ที่อยู่:
                  </span>
                  <div className="grid flex-1 min-w-0">
                    <div
                      aria-hidden="true"
                      className="col-start-1 row-start-1 w-full min-w-0 invisible whitespace-pre-wrap break-words px-2 py-0.5 border border-transparent text-xs sm:text-sm leading-relaxed font-sans text-slate-800 print:visible print:text-black print:p-0 print:border-none"
                    >
                      {(issuer.address || '') + '\u200b'}
                    </div>
                    <textarea
                      rows={1}
                      value={issuer.address}
                      onChange={(e) => updateIssuer('address', e.target.value)}
                      placeholder="ที่อยู่ร้านค้า"
                      className="col-start-1 row-start-1 w-full h-full min-w-0 resize-none overflow-hidden text-slate-800 bg-white border border-slate-200 focus:border-orange-400 focus:outline-none px-2 py-0.5 rounded text-xs sm:text-sm leading-relaxed font-sans print:hidden"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-semibold text-slate-700 print:text-black whitespace-nowrap text-xs sm:text-sm flex items-center gap-0.5">
                    <Phone className="w-3.5 h-3.5 text-orange-600 print:text-black shrink-0" />
                    <span>โทรศัพท์:</span>
                  </span>
                  <input
                    type="text"
                    value={issuer.phone}
                    onChange={(e) => updateIssuer('phone', e.target.value)}
                    placeholder="เช่น 02-719-8999, 089-123-4567"
                    className="w-44 px-2 py-0.5 bg-white print:bg-transparent border border-slate-200 print:border-none rounded focus:border-orange-400 focus:outline-none text-xs sm:text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <span className="font-semibold text-slate-700 print:text-black text-xs sm:text-sm whitespace-nowrap">
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

          <div className="h-2 my-1 print:h-2 print:my-1" aria-hidden="true" />

          {/* Customer */}
          <div className="bg-slate-50/60 print:bg-transparent rounded-md p-2.5 border border-slate-200/80 print:border-none print:p-0">
            <div className="flex items-center justify-between text-slate-900 font-bold text-xs sm:text-sm pb-1 mb-1.5 border-b border-slate-200 print:border-slate-300">
              <div className="flex items-center gap-1.5 text-orange-600 print:text-black">
                <User className="w-4 h-4" />
                <span>ลูกค้า / ผู้ขอใบเสนอราคา</span>
              </div>

              <div className="no-print flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={onQuickSaveCustomer}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-white border border-slate-300 hover:border-orange-400 hover:text-orange-600 rounded shadow-2xs font-semibold transition-colors cursor-pointer"
                  title="บันทึกข้อมูลลูกค้าที่กรอกอยู่นี้ลงในฐานข้อมูล"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-orange-600" />
                  <span>บันทึกคนนี้</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenCustomerModal}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded shadow-2xs font-semibold transition-colors cursor-pointer"
                  title="เปิดหน้าต่างจัดการฐานข้อมูลลูกค้าทั้งหมด"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>จัดการฐานข้อมูล</span>
                </button>
              </div>
            </div>

            {/* Customer Dropdown */}
            <div className="no-print mb-2 flex items-center gap-2 min-w-0 max-w-full overflow-hidden">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1 shrink-0">
                <Tag className="w-3.5 h-3.5 text-orange-600" />
                <span>เลือกชื่อลูกค้า:</span>
              </span>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    onCustomerChange({
                      alias: '',
                      name: '',
                      contact: '',
                      phone: '',
                      address: '',
                      taxId: '',
                      branch: 'สำนักงานใหญ่',
                      deliveryDate: customer.deliveryDate || getTodayISODate(),
                    });
                    return;
                  }
                  const found = customers.find((c) => c.id === val);
                  if (found) {
                    onSelectCustomer(found);
                  }
                }}
                className="w-full min-w-0 max-w-full px-2 py-1 bg-white border border-orange-300 rounded text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-orange-500 truncate cursor-pointer"
              >
                <option value="">-- เลือกชื่อลูกค้า --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    ⭐ {c.alias} — {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-xs sm:text-sm">
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                  <span className="text-slate-700 print:text-black font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0">
                    ชื่อ:
                  </span>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => updateCustomer('name', e.target.value)}
                    placeholder="ชื่อบริษัท / ลูกค้า"
                    className="w-full font-bold text-slate-900 print:text-black bg-white print:bg-transparent border border-slate-200 print:border-none focus:border-orange-400 focus:outline-none px-2 py-0.5 rounded text-sm sm:text-base"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-semibold text-slate-700 print:text-black whitespace-nowrap text-xs sm:text-sm">
                    สาขา:
                  </span>
                  <input
                    type="text"
                    value={customer.branch || ''}
                    onChange={(e) => updateCustomer('branch', e.target.value)}
                    placeholder="เช่น สำนักงานใหญ่ หรือ 00000"
                    className="w-40 px-2 py-0.5 bg-white print:bg-transparent border border-slate-200 print:border-none rounded focus:border-orange-400 focus:outline-none text-xs sm:text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-start gap-2">
                <div className="flex items-start gap-1.5 flex-1 min-w-[200px]">
                  <span className="text-slate-700 print:text-black font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 pt-0.5 print:pt-0">
                    ที่อยู่:
                  </span>
                  <div className="grid flex-1 min-w-0">
                    <div
                      aria-hidden="true"
                      className="col-start-1 row-start-1 w-full min-w-0 invisible whitespace-pre-wrap break-words px-2 py-0.5 border border-transparent text-xs sm:text-sm leading-relaxed font-sans text-slate-800 print:visible print:text-black print:p-0 print:border-none"
                    >
                      {(customer.address || '') + '\u200b'}
                    </div>
                    <textarea
                      rows={1}
                      value={customer.address || ''}
                      onChange={(e) => updateCustomer('address', e.target.value)}
                      placeholder="ที่อยู่ลูกค้า (เลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์)"
                      className="col-start-1 row-start-1 w-full h-full min-w-0 resize-none overflow-hidden text-slate-800 bg-white border border-slate-200 focus:border-orange-400 focus:outline-none px-2 py-0.5 rounded text-xs sm:text-sm leading-relaxed font-sans print:hidden"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-semibold text-slate-700 print:text-black whitespace-nowrap text-xs sm:text-sm flex items-center gap-0.5">
                    <Phone className="w-3.5 h-3.5 text-orange-600 print:text-black shrink-0" />
                    <span>โทร:</span>
                  </span>
                  <input
                    type="text"
                    value={customer.phone || ''}
                    onChange={(e) => updateCustomer('phone', e.target.value)}
                    placeholder="เบอร์โทรลูกค้า"
                    className="w-44 px-2 py-0.5 bg-white print:bg-transparent border border-slate-200 print:border-none rounded focus:border-orange-400 focus:outline-none text-xs sm:text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <span className="font-semibold text-slate-700 print:text-black text-xs sm:text-sm whitespace-nowrap">
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
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="bg-orange-500 text-white font-bold border-b border-orange-400 print:bg-slate-200 print:text-black print:border-black">
                  <th className="w-12 py-2 px-2 text-center border-r border-orange-400 print:border-black">
                    ลำดับ
                  </th>
                  <th className="py-2 px-3 border-r border-orange-400 print:border-black">
                    รายการสินค้า / บริการ (DESCRIPTION)
                  </th>
                  <th className="w-24 py-2 px-2 text-center border-r border-orange-400 print:border-black">
                    จำนวน
                  </th>
                  <th className="w-28 py-2 px-2 text-right border-r border-orange-400 print:border-black">
                    ราคา/หน่วย
                  </th>
                  <th className="w-32 py-2 px-3 text-right border-r border-orange-400 print:border-black">
                    ราคารวม
                  </th>
                  <th className="w-10 py-2 text-center no-print">
                    ลบ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-200 print:divide-slate-300">
                {items.map((item, idx) => {
                  const hasData = Boolean(
                    (item.description && item.description.trim()) ||
                    (item.quantity && item.quantity > 0) ||
                    (item.unitPrice && item.unitPrice > 0) ||
                    (item.amount && item.amount > 0)
                  );

                  return (
                    <tr key={item.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="py-1.5 px-2 text-center font-semibold text-slate-700 border-r border-orange-400 print:border-black select-none text-xs sm:text-sm">
                        {idx + 1}
                      </td>

                      <td className="py-1 px-2 border-r border-orange-400 print:border-black">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          placeholder={idx === 0 && !hasData ? 'ระบุชื่อสินค้า หรือรายละเอียดบริการที่เสนอราคา...' : ''}
                          className="w-full py-1 px-1.5 bg-transparent rounded focus:bg-white focus:ring-1 focus:ring-orange-400 focus:outline-none text-xs sm:text-sm"
                        />
                      </td>

                      <td className="py-1 px-1.5 border-r border-orange-400 print:border-black">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={!item.quantity || item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          placeholder=""
                          className="w-full text-center py-1 px-1 bg-transparent rounded focus:bg-white focus:ring-1 focus:ring-orange-400 focus:outline-none font-semibold text-xs sm:text-sm"
                        />
                      </td>

                      <td className="py-1 px-1.5 text-right border-r border-orange-400 print:border-black">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={
                            editingPriceIdx === idx
                              ? editingPriceVal
                              : !item.unitPrice || item.unitPrice === 0
                              ? ''
                              : fmt(item.unitPrice)
                          }
                          onFocus={() => {
                            setEditingPriceIdx(idx);
                            setEditingPriceVal(
                              item.unitPrice && item.unitPrice > 0 ? String(item.unitPrice) : ''
                            );
                          }}
                          onChange={(e) => {
                            setEditingPriceVal(e.target.value);
                            handleItemChange(idx, 'unitPrice', e.target.value);
                          }}
                          onBlur={() => {
                            setEditingPriceIdx(null);
                            setEditingPriceVal('');
                          }}
                          placeholder=""
                          className="w-full text-right py-1 px-1.5 bg-transparent rounded focus:bg-white focus:ring-1 focus:ring-orange-400 focus:outline-none font-mono text-xs sm:text-sm print:hidden"
                        />
                        <div className="hidden print:block font-mono text-xs sm:text-sm text-right py-1 px-1.5 select-all">
                          {!item.unitPrice || item.unitPrice === 0 ? '' : fmt(item.unitPrice)}
                        </div>
                      </td>

                      <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900 border-r border-orange-400 print:border-black select-all text-xs sm:text-sm">
                        {item.amount && item.amount > 0 ? fmt(item.amount) : ''}
                      </td>

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
                  );
                })}

                <tr className="no-print bg-orange-50/30">
                  <td colSpan={6} className="py-1.5 px-3">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-700 hover:text-orange-900 py-1 px-3 rounded hover:bg-orange-100/70 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ เพิ่มรายการสินค้า/บริการ</span>
                    </button>
                  </td>
                </tr>

                <tr className="bg-slate-50/80 border-t-2 border-orange-400 print:bg-slate-50 print:border-black">
                  <td
                    colSpan={3}
                    className="py-2.5 px-3 text-left border-r border-orange-400 print:border-black text-slate-700 align-middle"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 shrink-0 text-xs sm:text-sm">
                        จำนวนเงินตัวอักษร:
                      </span>
                      <span className="font-semibold text-slate-900 italic bg-white/80 print:bg-transparent px-2 py-0.5 rounded border border-slate-300 print:border-none text-xs sm:text-sm">
                        ({calcResult.thaiBahtText})
                      </span>
                    </div>
                  </td>
                  <td colSpan={3} className="p-0 align-top" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5 & 6: VAT MODE, NOTES & FINANCIAL TOTALS                         */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-3">
          {/* Left: VAT Mode + Remarks / Delivery Terms */}
          <div className="flex-1 w-full space-y-2.5">
            <div className="no-print bg-slate-50 border border-slate-200 rounded-lg p-2.5 max-w-sm w-full space-y-1.5">
              <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                โหมดการคิดภาษี (VAT Mode):
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onVatModeChange('ADD_VAT')}
                  className={`px-2.5 py-1 rounded text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    vatMode === 'ADD_VAT'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-orange-50'
                  }`}
                >
                  + แยกนอก (+7%)
                </button>
                <button
                  type="button"
                  onClick={() => onVatModeChange('INC_VAT')}
                  className={`px-2.5 py-1 rounded text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    vatMode === 'INC_VAT'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-emerald-50'
                  }`}
                >
                  รวมใน (7%)
                </button>
                <button
                  type="button"
                  onClick={() => onVatModeChange('NO_VAT')}
                  className={`px-2.5 py-1 rounded text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    vatMode === 'NO_VAT'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ไม่มี VAT (0%)
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {vatMode === 'ADD_VAT' && 'คำนวณภาษีเพิ่ม 7% จากยอดรวมสินค้า'}
                {vatMode === 'INC_VAT' && 'ราคาสินค้าในตารางรวมภาษี 7% ไว้แล้ว (ถอด VAT)'}
                {vatMode === 'NO_VAT' && 'ไม่มีการคิดภาษีมูลค่าเพิ่ม (0%)'}
              </p>
            </div>

            {/* Terms & Notes Box (แสดงทั้งหน้าจอและตอนพิมพ์) */}
            <div className="bg-slate-50/70 print:bg-transparent rounded-md border border-slate-200 print:border-slate-300 p-2.5 text-xs sm:text-sm space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 print:text-black">
                <FileText className="w-3.5 h-3.5 text-orange-600 print:text-black shrink-0" />
                <span>เงื่อนไขการเสนอราคา / หมายเหตุ:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700 print:text-black whitespace-nowrap text-xs">
                  กำหนดส่งมอบ:
                </span>
                <input
                  type="text"
                  value={meta.deliveryTerms}
                  onChange={(e) => updateMeta('deliveryTerms', e.target.value)}
                  placeholder="ระบุกำหนดส่งมอบสินค้า / บริการ"
                  className="w-full bg-white print:bg-transparent border border-slate-200 print:border-none rounded px-2 py-0.5 text-xs focus:border-orange-400 focus:outline-none"
                />
              </div>
              <div className="grid w-full min-w-0">
                <div
                  aria-hidden="true"
                  className="col-start-1 row-start-1 w-full min-w-0 invisible whitespace-pre-wrap break-words px-2 py-1 border border-transparent text-xs leading-relaxed font-sans text-slate-700 print:visible print:text-black print:p-0 print:border-none"
                >
                  {(meta.notes || '') + '\u200b'}
                </div>
                <textarea
                  rows={2}
                  value={meta.notes}
                  onChange={(e) => updateMeta('notes', e.target.value)}
                  placeholder="ระบุเงื่อนไขการชำระเงิน หรือหมายเหตุเพิ่มเติม..."
                  className="col-start-1 row-start-1 w-full h-full min-w-0 resize-none overflow-hidden text-slate-700 bg-white border border-slate-200 focus:border-orange-400 focus:outline-none px-2 py-1 rounded text-xs leading-relaxed font-sans print:hidden"
                />
              </div>
            </div>
          </div>

          {/* Right: Financial Totals Box */}
          <div className="w-full sm:w-80 bg-slate-50/90 print:bg-transparent rounded border border-slate-200 print:border-black p-3 text-xs sm:text-sm space-y-1.5 shrink-0">
            {vatMode === 'NO_VAT' && (
              <>
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-semibold">รวมเป็นเงิน (SUBTOTAL):</span>
                  <span className="font-mono font-semibold">{fmt(calcResult.subtotal)}</span>
                </div>
                <div
                  className={`justify-between items-center text-slate-700 ${
                    calcResult.discountAmount > 0 ? 'flex' : 'flex print:hidden'
                  }`}
                >
                  <span className="font-semibold text-rose-700 print:text-black">ส่วนลด (DISCOUNT):</span>
                  <div className="flex items-center gap-1 print:hidden">
                    <span className="text-slate-400 font-mono">-</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={
                        editingDiscount
                          ? editingDiscountVal
                          : !meta.discount || meta.discount === 0
                          ? ''
                          : fmt(meta.discount)
                      }
                      onFocus={() => {
                        setEditingDiscount(true);
                        setEditingDiscountVal(
                          meta.discount && meta.discount > 0 ? String(meta.discount) : ''
                        );
                      }}
                      onChange={(e) => {
                        setEditingDiscountVal(e.target.value);
                        updateDiscount(e.target.value);
                      }}
                      onBlur={() => {
                        setEditingDiscount(false);
                        setEditingDiscountVal('');
                      }}
                      placeholder="0.00"
                      title="ระบุส่วนลดราคา (บาท)"
                      className="w-28 text-right font-mono font-semibold text-rose-700 bg-white border border-slate-300 focus:border-orange-400 focus:outline-none px-1.5 py-0.5 rounded text-xs sm:text-sm"
                    />
                  </div>
                  <span className="hidden print:inline font-mono font-semibold text-black">
                    -{fmt(calcResult.discountAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-xs sm:text-sm">
                  <span>ภาษีมูลค่าเพิ่ม (VAT 0%):</span>
                  <span className="font-mono font-semibold">0.00</span>
                </div>
                <div className="border-t-2 border-orange-500 print:border-black pt-1.5 mt-1.5 flex justify-between items-center text-sm sm:text-base font-bold text-slate-900">
                  <span>ยอดรวมสุทธิ (TOTAL):</span>
                  <span className="font-mono text-base sm:text-lg font-bold text-orange-600 print:text-black">
                    {fmt(calcResult.netTotal)} บาท
                  </span>
                </div>
              </>
            )}

            {vatMode === 'ADD_VAT' && (
              <>
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-semibold">รวมเป็นเงิน (SUBTOTAL):</span>
                  <span className="font-mono font-semibold">{fmt(calcResult.subtotal)}</span>
                </div>
                <div
                  className={`justify-between items-center text-slate-700 ${
                    calcResult.discountAmount > 0 ? 'flex' : 'flex print:hidden'
                  }`}
                >
                  <span className="font-semibold text-rose-700 print:text-black">ส่วนลด (DISCOUNT):</span>
                  <div className="flex items-center gap-1 print:hidden">
                    <span className="text-slate-400 font-mono">-</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={
                        editingDiscount
                          ? editingDiscountVal
                          : !meta.discount || meta.discount === 0
                          ? ''
                          : fmt(meta.discount)
                      }
                      onFocus={() => {
                        setEditingDiscount(true);
                        setEditingDiscountVal(
                          meta.discount && meta.discount > 0 ? String(meta.discount) : ''
                        );
                      }}
                      onChange={(e) => {
                        setEditingDiscountVal(e.target.value);
                        updateDiscount(e.target.value);
                      }}
                      onBlur={() => {
                        setEditingDiscount(false);
                        setEditingDiscountVal('');
                      }}
                      placeholder="0.00"
                      title="ระบุส่วนลดราคา (บาท)"
                      className="w-28 text-right font-mono font-semibold text-rose-700 bg-white border border-slate-300 focus:border-orange-400 focus:outline-none px-1.5 py-0.5 rounded text-xs sm:text-sm"
                    />
                  </div>
                  <span className="hidden print:inline font-mono font-semibold text-black">
                    -{fmt(calcResult.discountAmount)}
                  </span>
                </div>
                {calcResult.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-slate-700 text-xs sm:text-sm">
                    <span className="font-semibold">ยอดหลังหักส่วนลด:</span>
                    <span className="font-mono font-semibold">{fmt(calcResult.afterDiscountSubtotal)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-orange-700 print:text-black font-medium">
                  <span className="font-semibold">ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                  <span className="font-mono font-bold">+{fmt(calcResult.vatAmount)}</span>
                </div>
                <div className="border-t-2 border-orange-500 print:border-black pt-1.5 mt-1.5 flex justify-between items-center text-sm sm:text-base font-bold text-slate-900">
                  <span>ยอดรวมสุทธิ (TOTAL):</span>
                  <span className="font-mono text-base sm:text-lg font-bold text-orange-600 print:text-black">
                    {fmt(calcResult.netTotal)} บาท
                  </span>
                </div>
              </>
            )}

            {vatMode === 'INC_VAT' && (
              <>
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-semibold">ราคารวมภาษีแล้ว:</span>
                  <span className="font-mono font-semibold">{fmt(calcResult.subtotal)}</span>
                </div>
                <div
                  className={`justify-between items-center text-slate-700 ${
                    calcResult.discountAmount > 0 ? 'flex' : 'flex print:hidden'
                  }`}
                >
                  <span className="font-semibold text-rose-700 print:text-black">ส่วนลด (DISCOUNT):</span>
                  <div className="flex items-center gap-1 print:hidden">
                    <span className="text-slate-400 font-mono">-</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={
                        editingDiscount
                          ? editingDiscountVal
                          : !meta.discount || meta.discount === 0
                          ? ''
                          : fmt(meta.discount)
                      }
                      onFocus={() => {
                        setEditingDiscount(true);
                        setEditingDiscountVal(
                          meta.discount && meta.discount > 0 ? String(meta.discount) : ''
                        );
                      }}
                      onChange={(e) => {
                        setEditingDiscountVal(e.target.value);
                        updateDiscount(e.target.value);
                      }}
                      onBlur={() => {
                        setEditingDiscount(false);
                        setEditingDiscountVal('');
                      }}
                      placeholder="0.00"
                      title="ระบุส่วนลดราคา (บาท)"
                      className="w-28 text-right font-mono font-semibold text-rose-700 bg-white border border-slate-300 focus:border-orange-400 focus:outline-none px-1.5 py-0.5 rounded text-xs sm:text-sm"
                    />
                  </div>
                  <span className="hidden print:inline font-mono font-semibold text-black">
                    -{fmt(calcResult.discountAmount)}
                  </span>
                </div>
                {calcResult.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-slate-700 text-xs sm:text-sm">
                    <span className="font-semibold">หลังหักส่วนลด (รวมภาษี):</span>
                    <span className="font-mono font-semibold">{fmt(calcResult.afterDiscountSubtotal)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-600 text-xs sm:text-sm">
                  <span>ราคาก่อนภาษี (PRE-TAX):</span>
                  <span className="font-mono font-semibold">{fmt(calcResult.preTaxSubtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-700 print:text-black font-medium">
                  <span className="font-semibold">ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                  <span className="font-mono font-bold">{fmt(calcResult.vatAmount)}</span>
                </div>
                <div className="border-t-2 border-orange-500 print:border-black pt-1.5 mt-1.5 flex justify-between items-center text-sm sm:text-base font-bold text-slate-900">
                  <span>ยอดรวมสุทธิ (TOTAL):</span>
                  <span className="font-mono text-base sm:text-lg font-bold text-orange-600 print:text-black">
                    {fmt(calcResult.netTotal)} บาท
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 7: QUOTATION SIGNATURES FOOTER                                    */}
      {/* ========================================================================= */}
      <footer className="pt-2 border-t-2 border-orange-500 print:border-black mt-2">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 text-center text-xs sm:text-sm">
          {/* Left: Customer Acceptance */}
          <div className="flex flex-col items-center justify-between border border-slate-200 print:border-slate-400 rounded-lg p-2.5 bg-slate-50/40 print:bg-transparent min-h-[165px] print:min-h-[175px]">
            <div className="font-bold text-slate-900 text-xs sm:text-sm border-b border-slate-200 print:border-slate-300 pb-1 w-full text-center tracking-wide">
              ผู้อนุมัติสั่งซื้อ / ผู้รับใบเสนอราคา (CUSTOMER ACCEPTANCE)
            </div>

            <div className="w-full flex-1 min-h-[65px] sm:min-h-[75px] print:min-h-[75px] flex items-center justify-center">
              <span className="no-print text-slate-300 text-[11px] sm:text-xs select-none tracking-widest">
                (พื้นที่ลงลายมือชื่อ / ประทับตรา)
              </span>
            </div>

            <div className="w-full flex flex-col items-center">
              <div className="w-56 sm:w-64 border-b border-dashed border-slate-400 mb-1.5" />
              <div className="flex items-center justify-center gap-1.5 w-56 sm:w-64 mb-1">
                <span className="text-slate-600 font-semibold text-xs sm:text-sm shrink-0">ลงชื่อ:</span>
                <input
                  type="text"
                  value={meta.customerApproverName}
                  onChange={(e) => updateMeta('customerApproverName', e.target.value)}
                  placeholder="(......................................................)"
                  className="text-center font-medium text-slate-800 focus:bg-orange-50/50 rounded px-1.5 border-transparent focus:border-orange-300 focus:outline-none w-full text-xs sm:text-sm"
                />
              </div>
              <div className="flex items-center justify-center gap-1.5 w-56 sm:w-64 text-xs sm:text-sm text-slate-600">
                <span className="font-semibold shrink-0">วันที่:</span>
                <input
                  type="text"
                  value={meta.customerApproverDate}
                  onChange={(e) => updateMeta('customerApproverDate', e.target.value)}
                  placeholder="......../......../........"
                  className="text-center font-medium text-slate-700 focus:bg-orange-50/50 rounded px-1.5 border-transparent focus:border-orange-300 focus:outline-none w-36 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Right: Quoter Signature */}
          <div className="flex flex-col items-center justify-between border border-slate-200 print:border-slate-400 rounded-lg p-2.5 bg-slate-50/40 print:bg-transparent min-h-[165px] print:min-h-[175px]">
            <div className="font-bold text-slate-900 text-xs sm:text-sm border-b border-slate-200 print:border-slate-300 pb-1 w-full text-center tracking-wide">
              ผู้เสนอราคา / ผู้มีอำนาจลงนาม (AUTHORIZED SIGNATURE)
            </div>

            <div className="w-full flex-1 min-h-[65px] sm:min-h-[75px] print:min-h-[75px] flex items-center justify-center">
              <span className="no-print text-slate-300 text-[11px] sm:text-xs select-none tracking-widest">
                (พื้นที่ลงลายมือชื่อ / ประทับตรา)
              </span>
            </div>

            <div className="w-full flex flex-col items-center">
              <div className="w-56 sm:w-64 border-b border-dashed border-slate-400 mb-1.5" />
              <div className="flex items-center justify-center gap-1.5 w-56 sm:w-64 mb-1">
                <span className="text-slate-600 font-semibold text-xs sm:text-sm shrink-0">ลงชื่อ:</span>
                <input
                  type="text"
                  value={meta.quoterName}
                  onChange={(e) => updateMeta('quoterName', e.target.value)}
                  placeholder="(......................................................)"
                  className="text-center font-medium text-slate-800 focus:bg-orange-50/50 rounded px-1.5 border-transparent focus:border-orange-300 focus:outline-none w-full text-xs sm:text-sm"
                />
              </div>
              <div className="flex items-center justify-center gap-1.5 w-56 sm:w-64 text-xs sm:text-sm text-slate-600">
                <span className="font-semibold shrink-0">วันที่:</span>
                <input
                  type="text"
                  value={meta.quoterDate || (meta.docDate ? formatThaiDate(meta.docDate) : '')}
                  onChange={(e) => updateMeta('quoterDate', e.target.value)}
                  placeholder="วันที่เสนอราคา"
                  className="text-center font-medium text-slate-700 focus:bg-orange-50/50 rounded px-1.5 border-transparent focus:border-orange-300 focus:outline-none w-36 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
