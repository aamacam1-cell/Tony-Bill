import React, { useState, useMemo } from 'react';
import {
  X,
  History,
  Search,
  Trash2,
  FileText,
  Calendar,
  Phone,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  Receipt,
  RotateCcw,
  Layers,
  CloudCheck,
  CloudUpload,
  RefreshCw,
} from 'lucide-react';
import { SavedInvoiceRecord } from '../types';
import { formatDateTimeThai } from '../utils/historyDb';
import { deleteInvoiceFromIndexedDB, clearAllInvoicesFromIndexedDB } from '../utils/indexedDb';
import { formatThaiDate } from '../utils/dateFormatter';
import { getVatModeLabel } from '../utils/customerDb';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SavedInvoiceRecord[];
  onRecordsUpdated: (records: SavedInvoiceRecord[]) => void;
  onLoadInvoice: (record: SavedInvoiceRecord) => void;
  activeInvoiceNo?: string;
  isOnline?: boolean;
  onSyncNow?: () => void;
  isSyncing?: boolean;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  onRecordsUpdated,
  onLoadInvoice,
  activeInvoiceNo,
  isOnline = true,
  onSyncNow,
  isSyncing = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Count unsynced records
  const unsyncedCount = useMemo(() => {
    return records.filter((r) => r.synced !== true).length;
  }, [records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const term = searchTerm.toLowerCase();
    return records.filter((r) => {
      return (
        r.invoiceNo.toLowerCase().includes(term) ||
        r.customerName.toLowerCase().includes(term) ||
        (r.customerPhone && r.customerPhone.toLowerCase().includes(term)) ||
        (r.contactName && r.contactName.toLowerCase().includes(term)) ||
        (r.customerTaxId && r.customerTaxId.includes(term)) ||
        (r.docDate && r.docDate.includes(term))
      );
    });
  }, [records, searchTerm]);

  // Aggregate statistics
  const totalAmount = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (r.netTotal || 0), 0);
  }, [filteredRecords]);

  if (!isOpen) return null;

  const handleDelete = async (id: string) => {
    const updated = await deleteInvoiceFromIndexedDB(id);
    onRecordsUpdated(updated);
    setConfirmDeleteId(null);
    if (expandedRecordId === id) {
      setExpandedRecordId(null);
    }
  };

  const handleClearAll = async () => {
    await clearAllInvoicesFromIndexedDB();
    onRecordsUpdated([]);
    setShowClearConfirm(false);
    setExpandedRecordId(null);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `invoice_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-orange-600 rounded-lg text-white">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>ประวัติใบกำกับภาษีที่บันทึกไว้</span>
                <span className="text-xs font-medium px-2 py-0.5 bg-slate-800 text-orange-300 rounded-full border border-slate-700">
                  {records.length} รายการ
                </span>
                {unsyncedCount > 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 bg-amber-900/60 text-amber-200 rounded-full border border-amber-600/40">
                    รอซิงค์ {unsyncedCount}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                ข้อมูลถูกบันทึกใน IndexedDB บนเครื่อง รองรับการทำงานออฟไลน์ 100% พร้อมซิงค์ขึ้น Server อัตโนมัติ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unsyncedCount > 0 && onSyncNow && (
              <button
                type="button"
                onClick={onSyncNow}
                disabled={isSyncing || !isOnline}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                title="ซิงค์ข้อมูลทั้งหมดใน IndexedDB ขึ้นเซิร์ฟเวอร์"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CloudUpload className="w-3.5 h-3.5" />
                )}
                <span>{isSyncing ? 'กำลังซิงค์...' : `ซิงค์ขึ้นเซิร์ฟเวอร์ (${unsyncedCount})`}</span>
              </button>
            )}

            {records.length > 0 && (
              <button
                type="button"
                onClick={handleExportJson}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors border border-slate-700 cursor-pointer"
                title="ส่งออกไฟล์สำรองข้อมูล JSON เก็บไว้ในคอมพิวเตอร์"
              >
                <Download className="w-3.5 h-3.5" />
                <span>สำรองข้อมูล (JSON)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาเลขที่บิล, ชื่อลูกค้า, เบอร์โทร, วันที่..."
              className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Aggregate Summary */}
          <div className="flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center gap-2">
              <span className="text-slate-500">พบ:</span>
              <strong className="text-slate-900 font-semibold">{filteredRecords.length} ใบ</strong>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">ยอดรวมสุทธิ:</span>
              <strong className="text-orange-600 font-bold font-mono">
                ฿{totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>

            {records.length > 0 && (
              <div>
                {showClearConfirm ? (
                  <div className="inline-flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                    <span className="text-[11px] text-red-700 font-bold">ล้างประวัติทั้งหมด?</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      ยืนยัน
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="text-slate-400 hover:text-red-600 text-[11px] font-medium transition-colors cursor-pointer underline decoration-dotted"
                    title="ล้างประวัติทั้งหมดที่บันทึกไว้ในเครื่อง"
                  >
                    ล้างประวัติทั้งหมด
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Table / List */}
        <div className="overflow-y-auto flex-1 p-4">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 border border-slate-200">
                <Receipt className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-700">
                {searchTerm ? 'ไม่พบข้อมูลใบกำกับภาษีที่ตรงกับคำค้นหา' : 'ยังไม่มีประวัติใบกำกับภาษีที่บันทึกไว้'}
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                เมื่อทำใบกำกับภาษีเสร็จแล้ว ให้กดปุ่ม{' '}
                <span className="font-semibold text-orange-600">"บันทึกเอกสาร"</span> บนแถบเครื่องมือ
                ระบบจะเก็บสำเนาไว้ในเครื่องให้อัตโนมัติเพื่อเปิดดูหรือพิมพ์ซ้ำได้ตลอดเวลา
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 select-none">
                    <th className="py-2.5 px-3 w-32">เลขที่ใบกำกับ</th>
                    <th className="py-2.5 px-3">ลูกค้า / บริษัท</th>
                    <th className="py-2.5 px-3 w-32 hidden sm:table-cell">วันที่เอกสาร</th>
                    <th className="py-2.5 px-3 w-28 text-center hidden md:table-cell">ภาษี (VAT)</th>
                    <th className="py-2.5 px-3 w-32 text-right">ยอดสุทธิ (บาท)</th>
                    <th className="py-2.5 px-3 w-36 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((rec) => {
                    const isExpanded = expandedRecordId === rec.id;
                    const isActive = activeInvoiceNo && activeInvoiceNo === rec.invoiceNo;

                    return (
                      <React.Fragment key={rec.id}>
                        <tr
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isActive ? 'bg-orange-50/40' : ''
                          }`}
                        >
                          {/* Invoice Number */}
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-orange-700 bg-orange-100/70 border border-orange-200 px-1.5 py-0.5 rounded text-[11px] inline-block w-fit">
                                  {rec.invoiceNo}
                                </span>
                                {rec.synced ? (
                                  <span
                                    className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded font-medium"
                                    title={`ซิงค์ขึ้นเซิร์ฟเวอร์แล้วเมื่อ ${rec.syncedAt ? formatDateTimeThai(rec.syncedAt) : ''}`}
                                  >
                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>ซิงค์แล้ว</span>
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-0.5 text-[10px] text-amber-800 bg-amber-50 border border-amber-300 px-1 py-0.2 rounded font-medium"
                                    title="บันทึกใน IndexedDB แล้ว (รอซิงค์ขึ้น Server)"
                                  >
                                    <CloudUpload className="w-2.5 h-2.5 text-amber-600" />
                                    <span>รอซิงค์</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {formatDateTimeThai(rec.savedAt)}
                              </span>
                            </div>
                          </td>

                          {/* Customer Info */}
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900 leading-tight">
                              {rec.customerName || <span className="text-slate-400 italic">ไม่ระบุชื่อลูกค้า</span>}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                              {rec.contactName && (
                                <span>ติดต่อ: <strong className="text-slate-700">{rec.contactName}</strong></span>
                              )}
                              {rec.customerPhone && (
                                <span className="flex items-center gap-0.5 text-slate-600">
                                  <Phone className="w-2.5 h-2.5 text-orange-600" />
                                  <span>{rec.customerPhone}</span>
                                </span>
                              )}
                              <span className="text-slate-400">
                                ({rec.itemCount} รายการ)
                              </span>
                            </div>
                          </td>

                          {/* Document Date */}
                          <td className="py-2.5 px-3 hidden sm:table-cell text-slate-600 text-[11px]">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formatThaiDate(rec.docDate)}</span>
                            </div>
                          </td>

                          {/* VAT Mode */}
                          <td className="py-2.5 px-3 text-center hidden md:table-cell">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                rec.vatMode === 'ADD_VAT'
                                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                  : rec.vatMode === 'INC_VAT'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {rec.vatMode === 'ADD_VAT'
                                ? '+VAT 7%'
                                : rec.vatMode === 'INC_VAT'
                                ? '-VAT 7%'
                                : 'ไม่คิด VAT'}
                            </span>
                          </td>

                          {/* Net Total */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="font-mono font-bold text-slate-900 text-[13px]">
                              {rec.netTotal.toLocaleString('th-TH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-2.5 px-3 text-center">
                            {confirmDeleteId === rec.id ? (
                              <div className="inline-flex items-center gap-1 bg-red-50 p-1 rounded border border-red-200 shadow-2xs">
                                <span className="text-[10px] text-red-700 font-bold whitespace-nowrap">ลบ?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(rec.id)}
                                  className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                                  title="ยืนยันการลบออกจากประวัติ"
                                >
                                  ยืนยัน
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] cursor-pointer transition-colors"
                                  title="ยกเลิก"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                {/* Load / Open Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    onLoadInvoice(rec);
                                    onClose();
                                  }}
                                  className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                                  title="ดึงข้อมูลใบกำกับภาษีใบนี้มาแสดงและแก้ไขในหน้าหลัก"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>เปิดใบนี้</span>
                                </button>

                                {/* Toggle Preview Details */}
                                <button
                                  type="button"
                                  onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                  title={isExpanded ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียดสินค้าในบิลนี้'}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {/* Delete button */}
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(rec.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="ลบออกจากประวัติ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* Expanded Details Row */}
                        {isExpanded && (
                          <tr className="bg-orange-50/20 border-b border-slate-200">
                            <td colSpan={6} className="p-3">
                              <div className="bg-white p-3 rounded-lg border border-orange-200 shadow-2xs space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 text-[11px]">
                                  <div className="text-slate-600">
                                    <strong>ที่อยู่ลูกค้า:</strong> {rec.snapshot.customer.address || '-'}
                                  </div>
                                  <div className="text-slate-600">
                                    <strong>เลขผู้เสียภาษี:</strong>{' '}
                                    <span className="font-mono">{rec.snapshot.customer.taxId || '-'}</span>{' '}
                                    ({rec.snapshot.customer.branch || 'สำนักงานใหญ่'})
                                  </div>
                                  {rec.snapshot.meta.poNo && (
                                    <div className="text-slate-600">
                                      <strong>เลขที่ PO:</strong> {rec.snapshot.meta.poNo}
                                    </div>
                                  )}
                                </div>

                                {/* Items list preview */}
                                <div className="space-y-1">
                                  <span className="text-[11px] font-bold text-slate-700">รายการสินค้าและบริการ:</span>
                                  <div className="max-h-36 overflow-y-auto rounded border border-slate-200">
                                    <table className="w-full text-left text-[11px]">
                                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                        <tr>
                                          <th className="py-1 px-2 w-8 text-center">#</th>
                                          <th className="py-1 px-2">รายการ</th>
                                          <th className="py-1 px-2 w-16 text-right">จำนวน</th>
                                          <th className="py-1 px-2 w-24 text-right">ราคา/หน่วย</th>
                                          <th className="py-1 px-2 w-28 text-right">จำนวนเงิน</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {rec.snapshot.items.map((item, idx) => (
                                          <tr key={item.id || idx}>
                                            <td className="py-1 px-2 text-center text-slate-400">{idx + 1}</td>
                                            <td className="py-1 px-2 text-slate-800 font-medium">
                                              {item.description || <span className="text-slate-300 italic">-</span>}
                                            </td>
                                            <td className="py-1 px-2 text-right font-mono">{item.quantity}</td>
                                            <td className="py-1 px-2 text-right font-mono">
                                              {item.unitPrice.toLocaleString('th-TH', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}
                                            </td>
                                            <td className="py-1 px-2 text-right font-mono font-semibold">
                                              {item.amount.toLocaleString('th-TH', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                <div className="flex justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onLoadInvoice(rec);
                                      onClose();
                                    }}
                                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>ดึงใบนี้มาทำงานต่อ</span>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 text-[11px] flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-orange-600" />
            <span>
              บันทึกเก็บไว้ในเบราว์เซอร์เครื่องนี้ สามารถเปิดดู ตรวจสอบหลักฐาน หรือพิมพ์ซ้ำได้ทุกเวลา
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
