import React, { useState, useEffect, useMemo } from 'react';
import {
  Hash,
  X,
  Check,
  Plus,
  Settings,
  Sparkles,
  Save,
  RotateCcw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { InvoiceNumberSettings } from '../types';
import {
  loadInvoiceNumberSettings,
  saveInvoiceNumberSettings,
  formatInvoiceNumberFromSettings,
  incrementInvoiceNumber,
  DEFAULT_INVOICE_SETTINGS,
} from '../utils/invoiceDefaults';
import { getBEYear2Digit } from '../utils/dateFormatter';

interface InvoiceNoSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInvoiceNo: string;
  lastSavedOrPrintedNo?: string;
  onApplyInvoiceNo: (newNo: string) => void;
  onIncrementInvoiceNo: () => void;
}

export const InvoiceNoSettingsModal: React.FC<InvoiceNoSettingsModalProps> = ({
  isOpen,
  onClose,
  currentInvoiceNo,
  lastSavedOrPrintedNo,
  onApplyInvoiceNo,
  onIncrementInvoiceNo,
}) => {
  const [settings, setSettings] = useState<InvoiceNumberSettings>(() => loadInvoiceNumberSettings());
  const [mode, setMode] = useState<'structured' | 'custom'>('structured');
  const [customInput, setCustomInput] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Sync settings when modal opens
  useEffect(() => {
    if (isOpen) {
      const loaded = loadInvoiceNumberSettings();
      setSettings(loaded);
      if (loaded.customTemplate) {
        setCustomInput(loaded.customTemplate);
        setMode('custom');
      } else {
        setCustomInput(currentInvoiceNo || 'TK69 021');
        setMode('structured');
      }
      setSavedSuccess(false);
      setApplySuccess(false);
    }
  }, [isOpen, currentInvoiceNo]);

  // Preview generated number based on settings
  const previewNumber = useMemo(() => {
    if (mode === 'custom') {
      return customInput.trim() || 'TK69 021';
    }
    const tempSettings: InvoiceNumberSettings = {
      ...settings,
      customTemplate: undefined,
    };
    return formatInvoiceNumberFromSettings(tempSettings);
  }, [mode, customInput, settings]);

  // Preview what the next incremented number would look like
  const previewIncrement = useMemo(() => {
    return incrementInvoiceNumber(currentInvoiceNo || previewNumber);
  }, [currentInvoiceNo, previewNumber]);

  if (!isOpen) return null;

  const handleSaveDefault = () => {
    const toSave: InvoiceNumberSettings = {
      ...settings,
      customTemplate: mode === 'custom' ? customInput.trim() : undefined,
    };
    saveInvoiceNumberSettings(toSave);
    setSettings(toSave);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleApplyToCurrent = () => {
    onApplyInvoiceNo(previewNumber);
    setApplySuccess(true);
    setTimeout(() => {
      setApplySuccess(false);
      onClose();
    }, 800);
  };

  const handleUseCurrentAsDefault = () => {
    setMode('custom');
    setCustomInput(currentInvoiceNo);
    const toSave: InvoiceNumberSettings = {
      ...settings,
      customTemplate: currentInvoiceNo,
    };
    saveInvoiceNumberSettings(toSave);
    setSettings(toSave);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetToFactory = () => {
    setSettings(DEFAULT_INVOICE_SETTINGS);
    setMode('structured');
    setCustomInput('TK69 021');
  };

  const currentBEYear = getBEYear2Digit();

  return (
    <div
      id="invoice-no-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>ตั้งค่า "เลขที่" ใบกำกับภาษี</span>
                <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-800 text-orange-300 rounded-full border border-slate-700">
                  ค่าเริ่มต้น & รูปแบบ
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                แก้ไข กำหนดค่าเริ่มต้น และจัดการการรันลำดับเลขที่ใบกำกับภาษี
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Status Box: Current Document vs Last Saved/Printed */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block">
                  เลขที่เอกสารปัจจุบันในหน้าจอ:
                </span>
                <span className="font-mono text-lg font-bold text-orange-600 bg-orange-100/70 border border-orange-200 px-2 py-0.5 rounded inline-block mt-0.5">
                  {currentInvoiceNo || 'ไม่ระบุ'}
                </span>
              </div>

              {/* Quick Increment button */}
              <button
                type="button"
                onClick={onIncrementInvoiceNo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                title={`กดเพื่อเพิ่มเลขที่บิล (+1) เป็น ${previewIncrement}`}
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มเลขที่ (+1)</span>
              </button>
            </div>

            {lastSavedOrPrintedNo && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <span>เลขที่บิลล่าสุดที่บันทึกหรือพิมพ์แล้ว:</span>
                <span className="font-mono font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  {lastSavedOrPrintedNo}
                </span>
              </div>
            )}
          </div>

          {/* Configuration Modes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-orange-600" />
                <span>กำหนดรูปแบบเลขที่เริ่มต้น (Default Number Template)</span>
              </label>
              <div className="flex items-center gap-1 text-[11px] bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMode('structured')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                    mode === 'structured'
                      ? 'bg-white text-orange-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  แบบมีระบบ (คำนำหน้า+ลำดับ)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                    mode === 'custom'
                      ? 'bg-white text-orange-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  กำหนดเองอิสระ
                </button>
              </div>
            </div>

            {mode === 'structured' ? (
              <div className="space-y-3 bg-white p-3.5 border border-slate-200 rounded-xl">
                <div className="grid grid-cols-2 gap-3">
                  {/* Prefix */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      คำนำหน้า (Prefix):
                    </label>
                    <input
                      type="text"
                      value={settings.prefix}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, prefix: e.target.value }))
                      }
                      placeholder="เช่น TK, INV, REC"
                      className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  {/* Padding Digits */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      จำนวนหลักตัวเลข:
                    </label>
                    <select
                      value={settings.paddingDigits}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          paddingDigits: parseInt(e.target.value, 10) || 3,
                        }))
                      }
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:outline-none bg-white"
                    >
                      <option value={2}>2 หลัก (เช่น 01, 21)</option>
                      <option value={3}>3 หลัก (เช่น 001, 021) - แนะนำ</option>
                      <option value={4}>4 หลัก (เช่น 0001, 0021)</option>
                      <option value={5}>5 หลัก (เช่น 00001, 00021)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Starting sequence */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      ลำดับเลขเริ่มต้น:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={999999}
                      value={settings.startingNumber}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          startingNumber: parseInt(e.target.value, 10) || 1,
                        }))
                      }
                      className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  {/* Auto BE Year checkbox */}
                  <div className="flex items-end pb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={settings.autoBEYear}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, autoBEYear: e.target.checked }))
                        }
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
                      />
                      <span>
                        ใส่ปี พ.ศ. 2 หลัก ({currentBEYear}) อัตโนมัติ
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-3.5 border border-slate-200 rounded-xl space-y-2">
                <label className="block text-[11px] font-semibold text-slate-700">
                  ระบุเลขที่เริ่มต้นที่ต้องการโดยตรง:
                </label>
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="เช่น TK69 021 หรือ INV-2569/001"
                  className="w-full text-sm font-mono font-bold px-3 py-2 rounded-lg border border-slate-300 focus:border-orange-500 focus:outline-none text-orange-600"
                />
                <p className="text-[10px] text-slate-500">
                  เมื่อกดปุ่ม "เพิ่มเลข (+1)" ระบบจะเพิ่มลำดับตัวเลขท้ายสุดให้อัตโนมัติ เช่น จาก TK69 021 เป็น TK69 022
                </p>
              </div>
            )}
          </div>

          {/* Live Preview Box */}
          <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-orange-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                <span>ตัวอย่างเลขที่เริ่มต้นที่จะได้:</span>
              </span>
              <span className="font-mono font-black text-xl text-orange-700 block mt-1 tracking-wider">
                {previewNumber}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-orange-900/80 block">เมื่อกดเพิ่มเลขถัดไป (+1):</span>
              <span className="font-mono text-xs font-bold text-slate-700 bg-white/90 border border-orange-200 px-2 py-0.5 rounded inline-block mt-0.5">
                {incrementInvoiceNumber(previewNumber)}
              </span>
            </div>
          </div>

          {/* Quick Helper Button: Use Current Invoice Number as Default */}
          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={handleUseCurrentAsDefault}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-orange-700 hover:underline cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5 text-orange-600" />
              <span>ใช้เลขปัจจุบันในบิล ({currentInvoiceNo}) เป็นค่าเริ่มต้น</span>
            </button>

            <button
              type="button"
              onClick={handleResetToFactory}
              className="text-slate-400 hover:text-slate-600 text-[11px] hover:underline cursor-pointer"
            >
              คืนค่าโรงงาน (TK69 021)
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>บันทึกค่าเริ่มต้นแล้ว</span>
              </span>
            )}
            {applySuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-orange-600" />
                <span>นำไปใช้ในบิลแล้ว</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDefault}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              title="บันทึกรูปแบบนี้ไว้เป็นค่าเริ่มต้นของระบบ"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>บันทึกเป็นค่าเริ่มต้น</span>
            </button>

            <button
              type="button"
              onClick={handleApplyToCurrent}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="นำเลขที่นี้ไปใส่ในบิลที่กำลังเปิดอยู่ทันที"
            >
              <Check className="w-4 h-4" />
              <span>นำไปใช้ในบิลนี้ทันที</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
