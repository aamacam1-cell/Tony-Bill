import React, { useState, useMemo, useEffect } from 'react';
import {
  IssuerInfo,
  CustomerInfo,
  InvoiceMeta,
  InvoiceItem,
  VatMode,
  CustomerProfile,
  SavedInvoiceRecord,
} from './types';
import {
  DEFAULT_ISSUER,
  INITIAL_CUSTOMER,
  INITIAL_META,
  SAMPLE_ITEMS,
  loadSavedIssuer,
  saveIssuerAsDefault,
  getNextInvoiceNumber,
  calculateInvoice,
  incrementInvoiceNumber,
  getLastSavedOrPrintedInvoiceNo,
  setLastSavedOrPrintedInvoiceNo,
  getDefaultInvoiceNumber,
} from './utils/invoiceDefaults';
import { loadCustomerProfiles, saveOrUpdateCustomerProfile } from './utils/customerDb';
import { loadInvoiceHistory } from './utils/historyDb';
import { getAllInvoicesFromIndexedDB, saveInvoiceToIndexedDB } from './utils/indexedDb';
import { executePrint } from './utils/printHelper';
import { getTodayISODate, formatThaiDate } from './utils/dateFormatter';
import { Toolbar } from './components/Toolbar';
import { InvoicePaper } from './components/InvoicePaper';
import { CustomerModal } from './components/CustomerModal';
import { IssuerModal } from './components/IssuerModal';
import { HistoryModal } from './components/HistoryModal';
import { InvoiceNoSettingsModal } from './components/InvoiceNoSettingsModal';
import { FileText, Layers, CheckCircle2, Info, RotateCcw, Undo2, X, BookmarkCheck } from 'lucide-react';

export default function App() {
  const [issuer, setIssuer] = useState<IssuerInfo>(() => loadSavedIssuer());
  const [customer, setCustomer] = useState<CustomerInfo>(INITIAL_CUSTOMER);
  const [lastSavedOrPrintedNo, setLastSavedOrPrintedNo] = useState<string>(() => {
    return getLastSavedOrPrintedInvoiceNo() || '';
  });
  const [isInvoiceNoModalOpen, setIsInvoiceNoModalOpen] = useState(false);
  const [meta, setMeta] = useState<InvoiceMeta>(() => {
    const defaultNo = getDefaultInvoiceNumber();
    const initial: InvoiceMeta = {
      ...INITIAL_META,
      invoiceNo: defaultNo || INITIAL_META.invoiceNo,
    };
    try {
      const savedCashier = localStorage.getItem('tk_invoice_cashier_name');
      if (savedCashier !== null && savedCashier.trim() !== '') {
        initial.cashierName = savedCashier;
      }
    } catch {
      // ignore
    }
    return initial;
  });
  const [items, setItems] = useState<InvoiceItem[]>(SAMPLE_ITEMS);
  const [vatMode, setVatMode] = useState<VatMode>('ADD_VAT');
  const [zoom, setZoom] = useState<number>(1.0);

  const handleMetaChange = (newMeta: InvoiceMeta) => {
    if (newMeta.cashierName !== meta.cashierName) {
      try {
        localStorage.setItem('tk_invoice_cashier_name', newMeta.cashierName);
      } catch {
        // ignore
      }
    }
    setMeta(newMeta);
  };

  // Customer Database
  const [customers, setCustomers] = useState<CustomerProfile[]>(() => loadCustomerProfiles());
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Issuer Modal
  const [isIssuerModalOpen, setIsIssuerModalOpen] = useState(false);

  // Invoice History Database (stored in IndexedDB on user's device)
  const [historyRecords, setHistoryRecords] = useState<SavedInvoiceRecord[]>(() => loadInvoiceHistory());
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<{ message: string; invoiceNo: string } | null>(null);

  // Load complete history from IndexedDB on startup
  useEffect(() => {
    getAllInvoicesFromIndexedDB().then((records) => {
      setHistoryRecords(records);
    });
  }, []);

  // Auto-dismiss save toast
  useEffect(() => {
    if (saveToast) {
      const timer = setTimeout(() => {
        setSaveToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [saveToast]);

  // Reset Notification / Undo state
  const [resetNotification, setResetNotification] = useState<{
    invoiceNo: string;
    prevCustomer: CustomerInfo;
    prevMeta: InvoiceMeta;
    prevItems: InvoiceItem[];
    prevVatMode: VatMode;
  } | null>(null);

  // Auto-dismiss reset notification
  useEffect(() => {
    if (resetNotification) {
      const timer = setTimeout(() => {
        setResetNotification(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [resetNotification]);

  // Calculation memo
  const calcResult = useMemo(() => {
    return calculateInvoice(items, vatMode);
  }, [items, vatMode]);

  // Handle printing (both pages)
  const handlePrint = () => {
    const currentNo = meta.invoiceNo || 'TK-UNNAMED';
    setLastSavedOrPrintedInvoiceNo(currentNo);
    setLastSavedOrPrintedNo(currentNo);

    // Automatically save/archive the invoice into history as evidence
    handleSaveInvoice(true);
    executePrint();
  };

  // Save invoice into local history (IndexedDB / localStorage)
  const handleSaveInvoice = async (isSilent = false) => {
    const activeItemCount = items.filter(
      (it) => (it.description && it.description.trim()) || it.amount > 0
    ).length;

    const currentNo = meta.invoiceNo || 'TK-UNNAMED';
    setLastSavedOrPrintedInvoiceNo(currentNo);
    setLastSavedOrPrintedNo(currentNo);

    const { record, isNew, allRecords } = await saveInvoiceToIndexedDB({
      invoiceNo: currentNo,
      docDate: meta.docDate || getTodayISODate(),
      customerName: customer.name || 'ไม่ระบุชื่อลูกค้า',
      customerPhone: customer.phone,
      customerTaxId: customer.taxId,
      contactName: customer.contact,
      netTotal: calcResult.netTotal,
      vatMode: vatMode,
      itemCount: activeItemCount || items.length,
      snapshot: {
        issuer: { ...issuer },
        customer: { ...customer },
        meta: { ...meta },
        items: items.map((it) => ({ ...it })),
        vatMode: vatMode,
      },
    });

    setHistoryRecords(allRecords);

    if (!isSilent) {
      setSaveToast({
        message: isNew
          ? 'บันทึกข้อมูลใบกำกับภาษีเรียบร้อยแล้ว'
          : 'อัปเดตข้อมูลใบกำกับภาษีเรียบร้อยแล้ว',
        invoiceNo: record.invoiceNo,
      });
    }
  };

  // Load a saved invoice record back into the editor
  const handleLoadInvoiceFromHistory = (record: SavedInvoiceRecord) => {
    setLastSavedOrPrintedInvoiceNo(record.invoiceNo);
    setLastSavedOrPrintedNo(record.invoiceNo);

    if (record.snapshot) {
      setCustomer({ ...record.snapshot.customer });
      setMeta({ ...record.snapshot.meta });
      setItems(record.snapshot.items.map((it) => ({ ...it })));
      setVatMode(record.snapshot.vatMode);
      if (record.snapshot.issuer) {
        setIssuer({ ...record.snapshot.issuer });
      }
    }
    setSaveToast({
      message: `โหลดข้อมูลใบกำกับภาษี ${record.invoiceNo} เข้าสู่หน้าแก้ไขแล้ว`,
      invoiceNo: record.invoiceNo,
    });
  };

  // Keyboard shortcut Ctrl+P / Cmd+P to intercept and use robust print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        executePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check URL query param for auto-printing (e.g. from popup tab)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('print') === 'true' || window.location.hash === '#print') {
      const timer = setTimeout(() => {
        executePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Customer selection logic
  const handleSelectCustomer = (selected: CustomerProfile) => {
    setCustomer((prev) => ({
      ...prev,
      alias: selected.alias,
      name: selected.companyName,
      contact: selected.contact || prev.contact || '',
      phone: selected.phone || prev.phone || '',
      address: selected.address,
      taxId: selected.taxId,
      branch: selected.branch || 'สำนักงานใหญ่',
    }));

    // Auto-fill VAT mode according to selected customer's profile!
    setVatMode(selected.vatType);
  };

  // Quick save current customer in form to database
  const handleQuickSaveCustomer = () => {
    if (!customer.name.trim()) {
      alert('กรุณากรอกชื่อบริษัทหรือชื่อลูกค้าก่อนบันทึก');
      return;
    }

    const defaultAlias = customer.name.split(' ')[0] || 'ลูกค้า';
    const alias = prompt('ระบุ "ชื่อเรียก" (ดัชนีสำหรับเลือกในหัวบิล):', defaultAlias);
    if (!alias || !alias.trim()) return;

    const { profiles, savedId } = saveOrUpdateCustomerProfile({
      alias: alias.trim(),
      companyName: customer.name.trim(),
      contact: customer.contact || '',
      phone: customer.phone || '',
      address: customer.address || '',
      taxId: customer.taxId || '',
      branch: customer.branch || 'สำนักงานใหญ่',
      vatType: vatMode,
    });

    setCustomers(profiles);
    const saved = profiles.find((p) => p.id === savedId);
    if (saved) {
      handleSelectCustomer(saved);
    }
  };

  const handleSaveIssuer = (updated: IssuerInfo, setAsDefault?: boolean) => {
    setIssuer(updated);
    if (setAsDefault) {
      saveIssuerAsDefault(updated);
    }
  };

  const handleReset = () => {
    const todayISO = getTodayISODate();
    const todayThai = formatThaiDate(todayISO);
    // Requirement: ไม่เปลี่ยนเลขที่ใบกำกับภาษีเมื่อกดรีเซ็ต ให้คงเลขล่าสุดที่บันทึกหรือพิมพ์ไว้ (หรือเลขปัจจุบัน)
    const keptInvoiceNo = lastSavedOrPrintedNo || meta.invoiceNo;

    // Store previous data in case user wants to undo
    setResetNotification({
      invoiceNo: keptInvoiceNo,
      prevCustomer: { ...customer },
      prevMeta: { ...meta },
      prevItems: [...items],
      prevVatMode: vatMode,
    });

    // Requirement: ล้างข้อมูล เฉพาะ ข้อมูล "ลูกค้า / ผู้ซื้อ"
    setCustomer({
      name: '',
      contact: '',
      phone: '',
      address: '',
      taxId: '',
      branch: 'สำนักงานใหญ่',
      deliveryDate: todayISO,
    });

    // Requirement: และ รายการสินค้า เท่านั้น เพื่อรอการใส่ข้อมูล ใหม่
    setItems([
      {
        id: String(Date.now()),
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);

    // คงเลขที่ใบกำกับล่าสุดที่บันทึกหรือพิมพ์ไว้ และคงชื่อผู้รับเงินไว้
    setMeta((prevMeta) => ({
      ...prevMeta,
      docType: 'ORIGINAL',
      invoiceNo: keptInvoiceNo,
      poNo: '',
      jobName: '',
      docDate: todayISO,
      receiverName: '',
      receiverDate: todayThai,
      cashierName: prevMeta.cashierName,
      cashierDate: todayThai,
    }));
  };

  const handleUndoReset = () => {
    if (!resetNotification) return;
    setCustomer(resetNotification.prevCustomer);
    setMeta(resetNotification.prevMeta);
    setItems(resetNotification.prevItems);
    setVatMode(resetNotification.prevVatMode);
    setResetNotification(null);
  };

  const handleSaveIssuerDefault = () => {
    saveIssuerAsDefault(issuer);
  };

  // Increment invoice number when user explicitly clicks the button
  const handleIncrementInvoiceNo = () => {
    const nextNo = incrementInvoiceNumber(meta.invoiceNo);
    setMeta((prev) => ({ ...prev, invoiceNo: nextNo }));
    setSaveToast({
      message: `ปรับเลขที่ใบกำกับเป็น ${nextNo} เรียบร้อยแล้ว`,
      invoiceNo: nextNo,
    });
  };

  // Preserve existing function name for backwards compatibility
  const handleRegenerateInvoiceNo = () => {
    handleIncrementInvoiceNo();
  };

  const handleApplyInvoiceNo = (newNo: string) => {
    setMeta((prev) => ({ ...prev, invoiceNo: newNo }));
    setSaveToast({
      message: `ปรับเลขที่ใบกำกับเป็น ${newNo} แล้ว`,
      invoiceNo: newNo,
    });
  };

  return (
    <div className="min-h-screen bg-slate-200/80 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top action toolbar (Hidden when printing) */}
      <Toolbar
        onOpenIssuerModal={() => setIsIssuerModalOpen(true)}
        onPrint={handlePrint}
        onReset={handleReset}
        onSaveIssuerDefault={handleSaveIssuerDefault}
        onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
        customerCount={customers.length}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        historyCount={historyRecords.length}
        onSaveInvoice={() => handleSaveInvoice(false)}
        isInvoiceSaved={historyRecords.some((r) => r.invoiceNo.trim() === meta.invoiceNo.trim())}
        zoom={zoom}
        onZoomChange={setZoom}
        onOpenInvoiceNoModal={() => setIsInvoiceNoModalOpen(true)}
        currentInvoiceNo={meta.invoiceNo}
      />

      {/* Main Workspace / A4 Sheet View */}
      <main className="flex-1 overflow-x-auto py-6 px-2 sm:px-4 flex flex-col items-center">
        {/* Info banner for multi-page printing */}
        <div className="no-print max-w-4xl w-full mb-4 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-between text-xs text-orange-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-600 shrink-0" />
            <span>
              <strong>ระบบจะพิมพ์พร้อมกัน 2 หน้าอัตโนมัติ:</strong> หน้า 1 (ต้นฉบับ) และ หน้า 2 (สำเนา) ข้อมูลแก้ไขจะเชื่อมโยงกันแบบเรียลไทม์
            </span>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="shrink-0 px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded font-medium shadow-2xs text-[11px] cursor-pointer"
          >
            กดพิมพ์ (2 หน้า)
          </button>
        </div>

        {/* Printable Area containing both Page 1 (Original) and Page 2 (Copy) */}
        <div
          id="invoice-printable-area"
          style={{
            transform: zoom !== 1 ? `scale(${zoom})` : undefined,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="w-full flex flex-col items-center gap-6 print:gap-0"
        >
          {/* ========================================================================= */}
          {/* PAGE 1: ORIGINAL (ต้นฉบับ)                                                */}
          {/* ========================================================================= */}
          <section className="w-full flex flex-col items-center">
            <div className="no-print w-full max-w-[210mm] mb-1.5 flex items-center justify-between text-xs text-slate-600 px-1">
              <span className="font-bold flex items-center gap-1.5 text-orange-700">
                <FileText className="w-3.5 h-3.5" />
                <span>หน้าที่ 1: ใบกำกับภาษี / ใบเสร็จรับเงิน (ต้นฉบับ - ORIGINAL)</span>
              </span>
              <span className="text-[11px] bg-white px-2 py-0.5 rounded shadow-2xs border border-slate-200">
                A4 กระดาษหน้าที่ 1
              </span>
            </div>

            <InvoicePaper
              docType="ORIGINAL"
              issuer={issuer}
              onIssuerChange={setIssuer}
              customer={customer}
              onCustomerChange={setCustomer}
              meta={meta}
              onMetaChange={handleMetaChange}
              items={items}
              onItemsChange={setItems}
              vatMode={vatMode}
              onVatModeChange={setVatMode}
              calcResult={calcResult}
              onRegenerateInvoiceNo={handleRegenerateInvoiceNo}
              onIncrementInvoiceNo={handleIncrementInvoiceNo}
              onOpenInvoiceNoSettings={() => setIsInvoiceNoModalOpen(true)}
              customers={customers}
              onSelectCustomer={handleSelectCustomer}
              onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
              onQuickSaveCustomer={handleQuickSaveCustomer}
              onOpenIssuerModal={() => setIsIssuerModalOpen(true)}
            />
          </section>

          {/* Screen separator between Page 1 and Page 2 */}
          <div className="no-print w-full max-w-[210mm] flex items-center gap-3 my-2 opacity-70">
            <div className="flex-1 border-b border-dashed border-slate-400" />
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              ตัดขึ้นหน้าใหม่ (Page 2)
            </span>
            <div className="flex-1 border-b border-dashed border-slate-400" />
          </div>

          {/* ========================================================================= */}
          {/* PAGE 2: COPY (สำเนา)                                                      */}
          {/* ========================================================================= */}
          <section className="w-full flex flex-col items-center">
            <div className="no-print w-full max-w-[210mm] mb-1.5 flex items-center justify-between text-xs text-slate-600 px-1">
              <span className="font-bold flex items-center gap-1.5 text-slate-700">
                <FileText className="w-3.5 h-3.5" />
                <span>หน้าที่ 2: ใบกำกับภาษี / ใบเสร็จรับเงิน (สำเนา - COPY)</span>
              </span>
              <span className="text-[11px] bg-white px-2 py-0.5 rounded shadow-2xs border border-slate-200">
                A4 กระดาษหน้าที่ 2
              </span>
            </div>

            <InvoicePaper
              docType="COPY"
              issuer={issuer}
              onIssuerChange={setIssuer}
              customer={customer}
              onCustomerChange={setCustomer}
              meta={meta}
              onMetaChange={handleMetaChange}
              items={items}
              onItemsChange={setItems}
              vatMode={vatMode}
              onVatModeChange={setVatMode}
              calcResult={calcResult}
              onRegenerateInvoiceNo={handleRegenerateInvoiceNo}
              onIncrementInvoiceNo={handleIncrementInvoiceNo}
              onOpenInvoiceNoSettings={() => setIsInvoiceNoModalOpen(true)}
              customers={customers}
              onSelectCustomer={handleSelectCustomer}
              onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
              onQuickSaveCustomer={handleQuickSaveCustomer}
              onOpenIssuerModal={() => setIsIssuerModalOpen(true)}
            />
          </section>
        </div>
      </main>

      {/* Invoice Number Settings Modal */}
      <InvoiceNoSettingsModal
        isOpen={isInvoiceNoModalOpen}
        onClose={() => setIsInvoiceNoModalOpen(false)}
        currentInvoiceNo={meta.invoiceNo}
        lastSavedOrPrintedNo={lastSavedOrPrintedNo}
        onApplyInvoiceNo={handleApplyInvoiceNo}
        onIncrementInvoiceNo={handleIncrementInvoiceNo}
      />

      {/* Customer Database Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={customers}
        onCustomersUpdated={setCustomers}
        onSelectCustomer={handleSelectCustomer}
      />

      {/* Issuer Info Modal */}
      <IssuerModal
        isOpen={isIssuerModalOpen}
        onClose={() => setIsIssuerModalOpen(false)}
        issuer={issuer}
        onSaveIssuer={handleSaveIssuer}
      />

      {/* Invoice History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        records={historyRecords}
        onRecordsUpdated={setHistoryRecords}
        onLoadInvoice={handleLoadInvoiceFromHistory}
        activeInvoiceNo={meta.invoiceNo}
      />

      {/* Save Invoice Toast Banner */}
      {saveToast && (
        <aside
          id="save-invoice-toast-banner"
          aria-label="แจ้งเตือนการบันทึกเอกสาร"
          className="no-print fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs max-w-md"
        >
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {saveToast.message}{' '}
              <strong className="text-orange-400 font-mono">({saveToast.invoiceNo})</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSaveToast(null)}
            className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer ml-auto"
            title="ปิดการแจ้งเตือน"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {/* Reset Notification Toast / Undo Banner */}
      {resetNotification && (
        <aside
          id="reset-toast-banner"
          aria-label="แจ้งเตือนการรีเซ็ต"
          className="no-print fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs max-w-md"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              ล้างข้อมูลลูกค้าและรายการสินค้าเรียบร้อย{' '}
              <strong className="text-orange-400 font-mono">({resetNotification.invoiceNo})</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleUndoReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-orange-400 hover:text-orange-300 font-semibold rounded-md transition-colors cursor-pointer border border-slate-600"
              title="กู้คืนข้อมูลเอกสารที่กรอกไว้ก่อนหน้านี้"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>เลิกทำ (Undo)</span>
            </button>
            <button
              type="button"
              onClick={() => setResetNotification(null)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
              title="ปิดการแจ้งเตือน"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
