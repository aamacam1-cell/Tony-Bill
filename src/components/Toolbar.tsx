import React, { useState } from 'react';
import {
  Printer,
  RotateCcw,
  Save,
  Check,
  FileText,
  ZoomIn,
  ZoomOut,
  Users,
  Layers,
  Store,
  History,
  BookmarkCheck,
  Hash,
  WifiOff,
  Wifi,
  Download,
} from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWA';

interface ToolbarProps {
  onOpenIssuerModal: () => void;
  onPrint: () => void;
  onReset: () => void;
  onSaveIssuerDefault: () => void;
  onOpenCustomerModal: () => void;
  customerCount: number;
  onOpenHistoryModal: () => void;
  historyCount: number;
  onSaveInvoice: () => void;
  isInvoiceSaved?: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onOpenInvoiceNoModal?: () => void;
  currentInvoiceNo?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onOpenIssuerModal,
  onPrint,
  onReset,
  onSaveIssuerDefault,
  onOpenCustomerModal,
  customerCount,
  onOpenHistoryModal,
  historyCount,
  onSaveInvoice,
  isInvoiceSaved,
  zoom,
  onZoomChange,
  onOpenInvoiceNoModal,
  currentInvoiceNo,
}) => {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [invoiceSaveSuccess, setInvoiceSaveSuccess] = useState(false);
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const handleSaveIssuerClick = () => {
    onSaveIssuerDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSaveInvoiceClick = () => {
    onSaveInvoice();
    setInvoiceSaveSuccess(true);
    setTimeout(() => setInvoiceSaveSuccess(false), 2500);
  };

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: App Title & Document status & Online/Offline status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                ระบบออกใบกำกับภาษี / ใบเสร็จรับเงิน
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-800 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-orange-600" />
                <span>พิมพ์ 2 หน้า</span>
              </span>

              {/* Offline / Online Status Badge */}
              {!isOnline ? (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500 text-white flex items-center gap-1 shadow-2xs animate-pulse"
                  title="ทำงานในโหมดออฟไลน์: ไม่ต้องต่อเน็ต แก้ไขและพิมพ์ได้ตามปกติ"
                >
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>โหมดออฟไลน์</span>
                </span>
              ) : (
                <span
                  className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
                  title="ระบบรองรับการทำงานเต็มรูปแบบแม้ออฟไลน์ไม่มีอินเทอร์เน็ต"
                >
                  <Wifi className="w-3 h-3 text-emerald-600" />
                  <span>พร้อมใช้งานออฟไลน์</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">TAX INVOICE / RECEIPT GENERATOR (A4 PRINT READY)</p>
          </div>
        </div>

        {/* Center: Controls for Customer DB, History, Edit Issuer, PWA Install & Zoom */}
        <div className="flex flex-wrap items-center gap-2">
          {/* PWA Install Button when installable */}
          {!isInstalled && isInstallable && (
            <button
              type="button"
              onClick={install}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 hover:text-sky-900 text-xs sm:text-sm font-semibold text-sky-800 transition-colors shadow-2xs cursor-pointer"
              title="ติดตั้งแอพลงเครื่อง (คอมพิวเตอร์/แท็บเล็ต/มือถือ) เพื่อเปิดใช้งานออฟไลน์ได้โดยตรง"
            >
              <Download className="w-4 h-4 text-sky-600" />
              <span>ติดตั้งแอพ</span>
            </button>
          )}
          {/* Invoice History Button */}
          <button
            type="button"
            onClick={onOpenHistoryModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-orange-50 hover:border-orange-400 hover:text-orange-700 text-xs sm:text-sm font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="ดูประวัติใบกำกับภาษีที่บันทึกไว้ในเครื่อง"
          >
            <History className="w-4 h-4 text-orange-600" />
            <span>ประวัติย้อนหลัง</span>
            <span className="text-xs bg-orange-100 text-orange-800 font-mono px-1.5 py-0.5 rounded font-bold">
              {historyCount}
            </span>
          </button>

          {/* Customer Database Button */}
          <button
            type="button"
            onClick={onOpenCustomerModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-orange-50 hover:border-orange-400 hover:text-orange-700 text-xs sm:text-sm font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="จัดการฐานข้อมูลลูกค้า (บันทึก, แก้ไข, เพิ่มรายชื่อ)"
          >
            <Users className="w-4 h-4 text-orange-600" />
            <span>ฐานข้อมูลลูกค้า</span>
            <span className="text-xs bg-slate-100 text-slate-700 font-mono px-1.5 py-0.5 rounded font-bold">
              {customerCount}
            </span>
          </button>

          {/* Edit Issuer Info Button */}
          <button
            type="button"
            onClick={onOpenIssuerModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-orange-50 hover:border-orange-400 hover:text-orange-700 text-xs sm:text-sm font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="แก้ไขข้อมูลร้านค้าผู้ออกใบกำกับภาษี (ชื่อ, ที่อยู่, เบอร์โทร, เลขผู้เสียภาษี)"
          >
            <Store className="w-4 h-4 text-orange-600" />
            <span>แก้ไขข้อมูลร้าน</span>
          </button>

          {/* Zoom controls for desktop preview */}
          <div className="hidden lg:inline-flex items-center gap-1.5 border border-slate-200 rounded-lg p-1 bg-white text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => onZoomChange(Math.max(0.6, zoom - 0.1))}
              className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
              title="ย่อขนาดพรีวิว"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-mono text-slate-700 font-semibold select-none text-xs sm:text-sm">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => onZoomChange(Math.min(1.2, zoom + 0.1))}
              className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
              title="ขยายขนาดพรีวิว"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Save Completed Invoice Button */}
          <button
            type="button"
            onClick={handleSaveInvoiceClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold transition-all shadow-2xs cursor-pointer ${
              invoiceSaveSuccess
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : isInvoiceSaved
                ? 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700'
                : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 hover:border-amber-400'
            }`}
            title="บันทึกใบกำกับภาษีใบนี้เก็บไว้ในเครื่องเป็นหลักฐาน"
          >
            {invoiceSaveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>บันทึกสำเร็จ</span>
              </>
            ) : (
              <>
                <BookmarkCheck className="w-4 h-4 text-orange-600" />
                <span>{isInvoiceSaved ? 'บันทึกอีกครั้ง' : 'บันทึกเอกสาร'}</span>
              </>
            )}
          </button>

          {/* Save Issuer Defaults */}
          <button
            type="button"
            onClick={handleSaveIssuerClick}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            title="บันทึกข้อมูลชื่อร้าน ที่อยู่ เบอร์โทร โลโก้ เป็นค่าเริ่มต้นสำหรับใช้งานครั้งถัดไป"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">จำข้อมูลร้านแล้ว</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-slate-500" />
                <span>จำข้อมูลร้าน</span>
              </>
            )}
          </button>

          {/* Reset / Clear Customer & Items button */}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-400 transition-colors shadow-2xs cursor-pointer"
            title="รีเซ็ตล้างข้อมูลลูกค้าและรายการสินค้า (คงเลขที่บิลเดิมไว้)"
          >
            <RotateCcw className="w-4 h-4 text-orange-600" />
            <span>รีเซ็ต</span>
          </button>

          {/* Print button */}
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow cursor-pointer"
            title="สั่งพิมพ์ออกกระดาษ A4 (พิมพ์ทั้งต้นฉบับและสำเนา รวม 2 หน้า) หรือบันทึกเป็น PDF"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์เอกสาร (2 หน้า)</span>
          </button>
        </div>
      </div>
    </header>
  );
};

