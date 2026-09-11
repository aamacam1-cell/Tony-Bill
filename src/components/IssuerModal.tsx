import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  MapPin,
  Phone,
  Share2,
  FileText,
  Save,
  Check,
  RotateCcw,
} from 'lucide-react';
import { IssuerInfo } from '../types';
import { LogoUploader } from './LogoUploader';

interface IssuerModalProps {
  isOpen: boolean;
  onClose: () => void;
  issuer: IssuerInfo;
  onSaveIssuer: (updated: IssuerInfo, setAsDefault?: boolean) => void;
}

export const IssuerModal: React.FC<IssuerModalProps> = ({
  isOpen,
  onClose,
  issuer,
  onSaveIssuer,
}) => {
  const [formData, setFormData] = useState<IssuerInfo>(issuer);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(issuer);
      setSavedSuccess(false);
    }
  }, [isOpen, issuer]);

  if (!isOpen) return null;

  const handleChange = (field: keyof IssuerInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (setAsDefault = false) => {
    onSaveIssuer(formData, setAsDefault);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-orange-400" />
            <h2 className="text-base font-bold">แก้ไขข้อมูลร้านค้า / ผู้ออกใบกำกับภาษี</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 text-xs">
          {savedSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>บันทึกข้อมูลร้านค้าเรียบร้อยแล้ว</span>
            </div>
          )}

          {/* Logo & Store Name */}
          <div className="flex items-center gap-4 p-3 bg-orange-50/50 rounded-xl border border-orange-200">
            <div className="flex flex-col items-center gap-1">
              <LogoUploader
                compact={false}
                logoUrl={formData.logoUrl}
                onChange={(url) => handleChange('logoUrl', url)}
              />
              <span className="text-[10px] text-slate-500 font-medium">โลโก้ร้าน</span>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อร้านค้า / บริษัท / ผู้ออกใบกำกับภาษี <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="เช่น บริษัท ทีเค กราฟิก แอนด์ พริ้นติ้ง จำกัด"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:border-orange-500 focus:outline-none font-semibold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              <span>ที่อยู่บริษัทผู้ออกใบ <span className="text-red-500">*</span></span>
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="เลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>

          {/* Phone & Social */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-orange-600" />
                <span>เบอร์โทรศัพท์</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="เช่น 02-719-8999, 089-123-4567"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-orange-600" />
                <span>Facebook / Line / เว็บไซต์</span>
              </label>
              <input
                type="text"
                value={formData.facebook}
                onChange={(e) => handleChange('facebook', e.target.value)}
                placeholder="เช่น TK Printing & Design"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tax ID & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-orange-600" />
                <span>เลขประจำตัวผู้เสียภาษี (13 หลัก)</span>
              </label>
              <input
                type="text"
                maxLength={13}
                value={formData.taxId}
                onChange={(e) => handleChange('taxId', e.target.value.replace(/\D/g, ''))}
                placeholder="เช่น 0105562014892"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono tracking-wider focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                สำนักงานใหญ่ / รหัสสาขา
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => handleChange('branch', e.target.value)}
                placeholder="เช่น สำนักงานใหญ่ หรือ 00000"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="บันทึกข้อมูลและใช้เป็นค่าเริ่มต้นสำหรับเอกสารในอนาคต"
            >
              <Save className="w-3.5 h-3.5 text-orange-400" />
              <span>บันทึก & จำเป็นค่าเริ่มต้น</span>
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>บันทึกข้อมูลร้าน</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
