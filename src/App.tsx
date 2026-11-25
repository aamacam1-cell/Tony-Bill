import React, { useState, useMemo, useEffect } from 'react';
import {
  IssuerInfo,
  CustomerInfo,
  InvoiceMeta,
  InvoiceItem,
  VatMode,
  CustomerProfile,
  SavedInvoiceRecord,
  QuotationMeta,
  AppPageView,
} from './types';
import {
  DEFAULT_ISSUER,
  INITIAL_CUSTOMER,
  INITIAL_META,
  INITIAL_ITEMS,
  INITIAL_QUOTATION_META,
  SAMPLE_ITEMS,
  loadSavedIssuer,
  saveIssuerAsDefault,
  getNextInvoiceNumber,
  calculateInvoice,
  incrementInvoiceNumber,
  getLastSavedOrPrintedInvoiceNo,
  setLastSavedOrPrintedInvoiceNo,
  getDefaultInvoiceNumber,
  getLastUserInvoiceNo,
  saveLastUserInvoiceNo,
  generateQuotationNumber,
  getLastQuotationNo,
  saveLastQuotationNo,
  loadQuotationDraft,
  saveQuotationDraft,
} from './utils/invoiceDefaults';
import { loadCustomerProfiles, saveOrUpdateCustomerProfile } from './utils/customerDb';
import { loadInvoiceHistory } from './utils/historyDb';
import { getAllInvoicesFromIndexedDB, saveInvoiceToIndexedDB } from './utils/indexedDb';
import { executePrint } from './utils/printHelper';
import { getTodayISODate, formatThaiDate } from './utils/dateFormatter';
import { Toolbar } from './components/Toolbar';
import { InvoicePaper } from './components/InvoicePaper';
import { QuotationPaper } from './components/QuotationPaper';
import { CustomerModal } from './components/CustomerModal';
import { IssuerModal } from './components/IssuerModal';
import { HistoryModal } from './components/HistoryModal';
import { OfflineStatusBanner } from './components/OfflineStatusBanner';
import { FileText, FileSpreadsheet, ArrowLeft, CheckCircle2, Undo2, X, BookmarkCheck } from 'lucide-react';

export default function App() {
  const [issuer, setIssuer] = useState<IssuerInfo>(() => loadSavedIssuer());
  const [customer, setCustomer] = useState<CustomerInfo>(INITIAL_CUSTOMER);
  const [lastSavedOrPrintedNo, setLastSavedOrPrintedNo] = useState<string>(() => {
    return getLastSavedOrPrintedInvoiceNo() || '';
  });
  const [meta, setMeta] = useState<InvoiceMeta>(() => {
    const savedUserNo = getLastUserInvoiceNo();
    const defaultNo = savedUserNo || getDefaultInvoiceNumber() || INITIAL_META.invoiceNo;
    const initial: InvoiceMeta = {
      ...INITIAL_META,
      invoiceNo: defaultNo,
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
  const [items, setItems] = useState<InvoiceItem[]>(INITIAL_ITEMS);
  const [vatMode, setVatMode] = useState<VatMode>('ADD_VAT');
  const [zoom, setZoom] = useState<number>(1.0);
  const [activePage, setActivePage] = useState<AppPageView>('INVOICE');

  // Quotation Page State (แยกต่างหากจากใบกำกับภาษี / ใบเสร็จรับเงิน)
  const [quotationCustomer, setQuotationCustomer] = useState<CustomerInfo>(() => {
    const draft = loadQuotationDraft();
    return draft?.customer || { ...INITIAL_CUSTOMER };
  });
  const [quotationMeta, setQuotationMeta] = useState<QuotationMeta>(() => {
    const draft = loadQuotationDraft();
    if (draft?.meta) {
      return draft.meta;
    }
    const savedQTNo = getLastQuotationNo();
    const initialQT: QuotationMeta = {
      ...INITIAL_QUOTATION_META,
      quotationNo: savedQTNo || generateQuotationNumber(1),
    };
    try {
      const savedCashier = localStorage.getItem('tk_invoice_cashier_name');
      if (savedCashier !== null && savedCashier.trim() !== '') {
        initialQT.quoterName = savedCashier;
      }
    } catch {
      // ignore
    }
    return initialQT;
  });
  const [quotationItems, setQuotationItems] = useState<InvoiceItem[]>(() => {
    const draft = loadQuotationDraft();
    return draft?.items?.length ? draft.items : [{ ...INITIAL_ITEMS[0], id: String(Date.now()) }];
  });
  const [quotationVatMode, setQuotationVatMode] = useState<VatMode>(() => {
    const draft = loadQuotationDraft();
    return draft?.vatMode || 'ADD_VAT';
  });

  // Auto-save quotation draft to localStorage
  useEffect(() => {
    saveQuotationDraft({
      customer: quotationCustomer,
      meta: quotationMeta,
      items: quotationItems,
      vatMode: quotationVatMode,
    });
  }, [quotationCustomer, quotationMeta, quotationItems, quotationVatMode]);

  const handleQuotationMetaChange = (newMeta: QuotationMeta) => {
    if (newMeta.quotationNo !== quotationMeta.quotationNo && newMeta.quotationNo.trim()) {
      saveLastQuotationNo(newMeta.quotationNo);
    }
    setQuotationMeta(newMeta);
  };

  const handleMetaChange = (newMeta: InvoiceMeta) => {
    if (newMeta.cashierName !== meta.cashierName) {
      try {
        localStorage.setItem('tk_invoice_cashier_name', newMeta.cashierName);
      } catch {
        // ignore
      }
    }
    if (newMeta.invoiceNo !== meta.invoiceNo) {
      if (newMeta.invoiceNo && newMeta.invoiceNo.trim()) {
        saveLastUserInvoiceNo(newMeta.invoiceNo);
        setLastSavedOrPrintedInvoiceNo(newMeta.invoiceNo);
        setLastSavedOrPrintedNo(newMeta.invoiceNo);
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
    page: AppPageView;
    invoiceNo: string;
    prevCustomer: CustomerInfo;
    prevMeta?: InvoiceMeta;
    prevQuotationMeta?: QuotationMeta;
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

  // Calculation memo (Invoice + Discount)
  const calcResult = useMemo(() => {
    return calculateInvoice(items, vatMode, meta.discount || 0);
  }, [items, vatMode, meta.discount]);

  // Calculation memo (Quotation + Discount)
  const quotationCalcResult = useMemo(() => {
    return calculateInvoice(quotationItems, quotationVatMode, quotationMeta.discount || 0);
  }, [quotationItems, quotationVatMode, quotationMeta.discount]);

  // Handle printing (Invoice 2 pages or Quotation 1 page)
  const handlePrint = () => {
    if (activePage === 'QUOTATION') {
      const qtNo = quotationMeta.quotationNo || generateQuotationNumber(1);
      saveLastQuotationNo(qtNo);
      executePrint(`พิมพ์ใบเสนอราคา ${qtNo} (QUOTATION)`);
      return;
    }

    const currentNo = meta.invoiceNo || 'TK-UNNAMED';
    saveLastUserInvoiceNo(currentNo);
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
    saveLastUserInvoiceNo(currentNo);
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
    saveLastUserInvoiceNo(record.invoiceNo);
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
    setActivePage('INVOICE');
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
        executePrint(
          activePage === 'QUOTATION'
            ? `พิมพ์ใบเสนอราคา ${quotationMeta.quotationNo || ''} (QUOTATION)`
            : undefined
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePage, quotationMeta.quotationNo]);

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

  // Customer selection logic (adapts automatically to activePage)
  const handleSelectCustomer = (selected: CustomerProfile) => {
    if (activePage === 'QUOTATION') {
      setQuotationCustomer((prev) => ({
        ...prev,
        alias: selected.alias,
        name: selected.companyName,
        contact: selected.contact || prev.contact || '',
        phone: selected.phone || prev.phone || '',
        address: selected.address,
        taxId: selected.taxId,
        branch: selected.branch || 'สำนักงานใหญ่',
      }));
      setQuotationVatMode(selected.vatType);
      return;
    }

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
  const handleQuickSaveCustomer = (targetCustomer: CustomerInfo = customer, targetVatMode: VatMode = vatMode) => {
    if (!targetCustomer.name.trim()) {
      alert('กรุณากรอกชื่อบริษัทหรือชื่อลูกค้าก่อนบันทึก');
      return;
    }

    const defaultAlias = targetCustomer.name.split(' ')[0] || 'ลูกค้า';
    const alias = prompt('ระบุ "ชื่อเรียก" (ดัชนีสำหรับเลือกในหัวบิล):', defaultAlias);
    if (!alias || !alias.trim()) return;

    const { profiles, savedId } = saveOrUpdateCustomerProfile({
      alias: alias.trim(),
      companyName: targetCustomer.name.trim(),
      contact: targetCustomer.contact || '',
      phone: targetCustomer.phone || '',
      address: targetCustomer.address || '',
      taxId: targetCustomer.taxId || '',
      branch: targetCustomer.branch || 'สำนักงานใหญ่',
      vatType: targetVatMode,
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

  const handleResetQuotation = () => {
    const todayISO = getTodayISODate();
    const currentQTNo = quotationMeta.quotationNo || getLastQuotationNo() || generateQuotationNumber(1);
    const nextQTNo = incrementInvoiceNumber(currentQTNo);
    saveLastQuotationNo(nextQTNo);

    setResetNotification({
      page: 'QUOTATION',
      invoiceNo: nextQTNo,
      prevCustomer: { ...quotationCustomer },
      prevQuotationMeta: { ...quotationMeta },
      prevItems: [...quotationItems],
      prevVatMode: quotationVatMode,
    });

    setQuotationCustomer({
      alias: '',
      name: '',
      contact: '',
      phone: '',
      address: '',
      taxId: '',
      branch: 'สำนักงานใหญ่',
      deliveryDate: todayISO,
    });

    setQuotationItems([
      {
        id: String(Date.now()),
        description: '',
        quantity: 0,
        unitPrice: 0,
        amount: 0,
      },
    ]);

    setQuotationMeta((prev) => {
      const docDateFormatted = formatThaiDate(prev.docDate || todayISO);
      return {
        ...prev,
        quotationNo: nextQTNo,
        contactPerson: '',
        discount: 0,
        customerApproverName: '',
        customerApproverDate: '',
        quoterDate: docDateFormatted,
      };
    });
  };

  const handleReset = () => {
    if (activePage === 'QUOTATION') {
      handleResetQuotation();
      return;
    }

    const todayISO = getTodayISODate();
    // ใช้เลขที่บิลปัจจุบัน (หรือล่าสุดที่จำไว้) แล้วรันเลขที่บิลถัดไป (+1) โดยอัตโนมัติ
    const currentInvoiceNo =
      meta.invoiceNo || getLastUserInvoiceNo() || lastSavedOrPrintedNo || getDefaultInvoiceNumber();
    const nextInvoiceNo = incrementInvoiceNumber(currentInvoiceNo);
    saveLastUserInvoiceNo(nextInvoiceNo);
    setLastSavedOrPrintedInvoiceNo(nextInvoiceNo);
    setLastSavedOrPrintedNo(nextInvoiceNo);

    // Store previous data in case user wants to undo
    setResetNotification({
      page: 'INVOICE',
      invoiceNo: nextInvoiceNo,
      prevCustomer: { ...customer },
      prevMeta: { ...meta },
      prevItems: [...items],
      prevVatMode: vatMode,
    });

    // ล้างเฉพาะข้อมูลลูกค้า / ผู้ซื้อ (ไม่ล้างข้อมูลผู้ออกใบกำกับภาษี / ผู้ขาย)
    setCustomer({
      alias: '',
      name: '',
      contact: '',
      phone: '',
      address: '',
      taxId: '',
      branch: 'สำนักงานใหญ่',
      deliveryDate: todayISO,
    });

    // ล้างรายการสินค้าในตารางเป็นแถวว่างเริ่มต้น
    setItems([
      {
        id: String(Date.now()),
        description: '',
        quantity: 0,
        unitPrice: 0,
        amount: 0,
      },
    ]);

    // รันเลขที่บิล +1 ล้างส่วนลดและผู้รับสินค้า แต่คงวันที่และชื่อผู้รับเงิน/แคชเชียร์ไว้
    setMeta((prevMeta) => {
      const docDateFormatted = formatThaiDate(prevMeta.docDate || todayISO);
      return {
        ...prevMeta,
        invoiceNo: nextInvoiceNo,
        discount: 0,
        receiverName: '',
        receiverDate: docDateFormatted,
        cashierDate: docDateFormatted,
      };
    });
  };

  const handleUndoReset = () => {
    if (!resetNotification) return;
    if (resetNotification.page === 'QUOTATION' && resetNotification.prevQuotationMeta) {
      const restoredQTNo = resetNotification.prevQuotationMeta.quotationNo;
      if (restoredQTNo && restoredQTNo.trim()) {
        saveLastQuotationNo(restoredQTNo);
      }
      setQuotationCustomer(resetNotification.prevCustomer);
      setQuotationMeta(resetNotification.prevQuotationMeta);
      setQuotationItems(resetNotification.prevItems);
      setQuotationVatMode(resetNotification.prevVatMode);
      setResetNotification(null);
      return;
    }

    if (resetNotification.prevMeta) {
      const restoredNo = resetNotification.prevMeta.invoiceNo;
      if (restoredNo && restoredNo.trim()) {
        saveLastUserInvoiceNo(restoredNo);
        setLastSavedOrPrintedInvoiceNo(restoredNo);
        setLastSavedOrPrintedNo(restoredNo);
      }
      setCustomer(resetNotification.prevCustomer);
      setMeta(resetNotification.prevMeta);
      setItems(resetNotification.prevItems);
      setVatMode(resetNotification.prevVatMode);
    }
    setResetNotification(null);
  };

  const handleIncrementQuotationNo = () => {
    const nextNo = incrementInvoiceNumber(quotationMeta.quotationNo);
    saveLastQuotationNo(nextNo);
    setQuotationMeta((prev) => ({ ...prev, quotationNo: nextNo }));
    setSaveToast({
      message: `ปรับเลขที่ใบเสนอราคาเป็น ${nextNo} เรียบร้อยแล้ว`,
      invoiceNo: nextNo,
    });
  };

  const handleSaveIssuerDefault = () => {
    saveIssuerAsDefault(issuer);
  };

  // Increment invoice number when user explicitly clicks the button
  const handleIncrementInvoiceNo = () => {
    const nextNo = incrementInvoiceNumber(meta.invoiceNo);
    saveLastUserInvoiceNo(nextNo);
    setLastSavedOrPrintedInvoiceNo(nextNo);
    setLastSavedOrPrintedNo(nextNo);
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
    saveLastUserInvoiceNo(newNo);
    setLastSavedOrPrintedInvoiceNo(newNo);
    setLastSavedOrPrintedNo(newNo);
    setMeta((prev) => ({ ...prev, invoiceNo: newNo }));
    setSaveToast({
      message: `ปรับเลขที่ใบกำกับเป็น ${newNo} แล้ว`,
      invoiceNo: newNo,
    });
  };

  return (
    <div className="min-h-screen bg-slate-200/80 text-slate-900 flex flex-col font-sans antialiased">
      {/* Offline status and PWA installation banner */}
      <OfflineStatusBanner />

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
        activePage={activePage}
        onToggleQuotationPage={() =>
          setActivePage((prev) => (prev === 'INVOICE' ? 'QUOTATION' : 'INVOICE'))
        }
      />

      {/* Main Workspace / A4 Sheet View */}
      <main className="flex-1 overflow-x-auto py-6 px-2 sm:px-4 flex flex-col items-center">

        {/* Printable Area */}
        <div
          id="invoice-printable-area"
          style={{
            transform: zoom !== 1 ? `scale(${zoom})` : undefined,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="w-full flex flex-col items-center gap-6 print:gap-0"
        >
          {activePage === 'QUOTATION' ? (
            /* ========================================================================= */
            /* QUOTATION PAGE (ใบเสนอราคา - แยกต่างหาก)                                  */
            /* ========================================================================= */
            <section className="w-full flex flex-col items-center">
              <div className="no-print w-full max-w-[210mm] mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-slate-600 px-1">
                <span className="font-bold flex items-center gap-1.5 text-sky-800">
                  <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                  <span>ใบเสนอราคา (QUOTATION)</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePage('INVOICE')}
                    className="inline-flex items-center gap-1 text-xs bg-white hover:bg-slate-100 px-2.5 py-0.5 rounded shadow-2xs border border-slate-300 font-semibold text-slate-700 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>กลับหน้าใบกำกับภาษี / ใบเสร็จรับเงิน</span>
                  </button>
                  <span className="text-xs bg-white px-2.5 py-0.5 rounded shadow-2xs border border-slate-200 font-semibold text-slate-700">
                    A4 (1 หน้า)
                  </span>
                </div>
              </div>

              <QuotationPaper
                issuer={issuer}
                onIssuerChange={setIssuer}
                customer={quotationCustomer}
                onCustomerChange={setQuotationCustomer}
                meta={quotationMeta}
                onMetaChange={handleQuotationMetaChange}
                items={quotationItems}
                onItemsChange={setQuotationItems}
                vatMode={quotationVatMode}
                onVatModeChange={setQuotationVatMode}
                calcResult={quotationCalcResult}
                onIncrementQuotationNo={handleIncrementQuotationNo}
                customers={customers}
                onSelectCustomer={handleSelectCustomer}
                onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
                onQuickSaveCustomer={() => handleQuickSaveCustomer(quotationCustomer, quotationVatMode)}
                onOpenIssuerModal={() => setIsIssuerModalOpen(true)}
              />
            </section>
          ) : (
            <>
              {/* ========================================================================= */}
              {/* PAGE 1: ORIGINAL (ต้นฉบับ)                                                */}
              {/* ========================================================================= */}
              <section className="w-full flex flex-col items-center">
                <div className="no-print w-full max-w-[210mm] mb-1.5 flex items-center justify-between text-xs sm:text-sm text-slate-600 px-1">
                  <span className="font-bold flex items-center gap-1.5 text-orange-700">
                    <FileText className="w-4 h-4" />
                    <span>หน้าที่ 1: ใบกำกับภาษี / ใบเสร็จรับเงิน (ต้นฉบับ - ORIGINAL)</span>
                  </span>
                  <span className="text-xs bg-white px-2.5 py-0.5 rounded shadow-2xs border border-slate-200 font-semibold text-slate-700">
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
                  customers={customers}
                  onSelectCustomer={handleSelectCustomer}
                  onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
                  onQuickSaveCustomer={() => handleQuickSaveCustomer(customer, vatMode)}
                  onOpenIssuerModal={() => setIsIssuerModalOpen(true)}
                />
              </section>

              {/* Screen separator between Page 1 and Page 2 */}
              <div className="no-print w-full max-w-[210mm] flex items-center gap-3 my-3 opacity-80">
                <div className="flex-1 border-b border-dashed border-slate-400" />
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded border border-slate-300">
                  ตัดขึ้นหน้าใหม่ (Page 2)
                </span>
                <div className="flex-1 border-b border-dashed border-slate-400" />
              </div>

              {/* ========================================================================= */}
              {/* PAGE 2: COPY (สำเนา)                                                      */}
              {/* ========================================================================= */}
              <section className="w-full flex flex-col items-center">
                <div className="no-print w-full max-w-[210mm] mb-1.5 flex items-center justify-between text-xs sm:text-sm text-slate-600 px-1">
                  <span className="font-bold flex items-center gap-1.5 text-slate-800">
                    <FileText className="w-4 h-4" />
                    <span>หน้าที่ 2: ใบกำกับภาษี / ใบเสร็จรับเงิน (สำเนา - COPY)</span>
                  </span>
                  <span className="text-xs bg-white px-2.5 py-0.5 rounded shadow-2xs border border-slate-200 font-semibold text-slate-700">
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
                  customers={customers}
                  onSelectCustomer={handleSelectCustomer}
                  onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
                  onQuickSaveCustomer={() => handleQuickSaveCustomer(customer, vatMode)}
                  onOpenIssuerModal={() => setIsIssuerModalOpen(true)}
                />
              </section>
            </>
          )}
        </div>
      </main>

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
          className="no-print fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs sm:text-sm max-w-md"
        >
          <div className="flex items-center gap-2.5">
            <BookmarkCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              {saveToast.message}{' '}
              <strong className="text-orange-400 font-mono">({saveToast.invoiceNo})</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSaveToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer ml-auto"
            title="ปิดการแจ้งเตือน"
          >
            <X className="w-4 h-4" />
          </button>
        </aside>
      )}

      {/* Reset Notification Toast / Undo Banner */}
      {resetNotification && (
        <aside
          id="reset-toast-banner"
          aria-label="แจ้งเตือนการรีเซ็ต"
          className="no-print fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3.5 rounded-xl shadow-2xl border border-slate-700 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs sm:text-sm max-w-md"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              เปิดบิลใหม่เรียบร้อย เลขที่บิล:{' '}
              <strong className="text-orange-400 font-mono">({resetNotification.invoiceNo})</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleUndoReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-orange-400 hover:text-orange-300 font-bold rounded-lg transition-colors cursor-pointer border border-slate-600 text-xs sm:text-sm"
              title="กู้คืนข้อมูลเอกสารที่กรอกไว้ก่อนหน้านี้"
            >
              <Undo2 className="w-4 h-4" />
              <span>เลิกทำ (Undo)</span>
            </button>
            <button
              type="button"
              onClick={() => setResetNotification(null)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              title="ปิดการแจ้งเตือน"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
