import React, { useRef } from 'react';
import { ImagePlus, RotateCcw } from 'lucide-react';
import { DEFAULT_LOGO_SVG } from '../utils/invoiceDefaults';

interface LogoUploaderProps {
  logoUrl: string;
  onChange: (url: string) => void;
  compact?: boolean;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({ logoUrl, onChange, compact = true }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 3MB for good performance)
    if (file.size > 3 * 1024 * 1024) {
      alert('รูปภาพมีขนาดใหญ่เกินไป (กรุณาเลือกรูปภาพขนาดไม่เกิน 3MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        onChange(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetDefault = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(DEFAULT_LOGO_SVG);
  };

  const sizeClass = compact
    ? 'w-14 h-14 sm:w-16 sm:h-16'
    : 'w-20 h-20 sm:w-24 sm:h-24';

  return (
    <div className={`relative group ${sizeClass} rounded-md border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs print:border-none print:shadow-none print:p-0`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {logoUrl ? (
        <img
          src={logoUrl}
          alt="โลโก้ร้าน"
          referrerPolicy="no-referrer"
          className="max-w-full max-h-full object-contain"
        />
      ) : (
        <div className="text-center text-slate-400 text-[10px] flex flex-col items-center">
          <ImagePlus className="w-5 h-5 mb-0.5 text-slate-300" />
          <span>ใส่โลโก้</span>
        </div>
      )}

      {/* Hover action overlay (hidden in print) */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="no-print absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5 cursor-pointer text-white text-[10px] p-0.5 font-medium text-center"
        title="คลิกเพื่ออัปโหลดโลโก้ใหม่"
      >
        <ImagePlus className="w-3.5 h-3.5" />
        <span>เปลี่ยน</span>
        {logoUrl !== DEFAULT_LOGO_SVG && (
          <button
            type="button"
            onClick={handleResetDefault}
            className="mt-0.5 text-[9px] text-orange-200 hover:text-white flex items-center gap-0.5 bg-black/40 px-1 py-0.5 rounded"
            title="รีเซ็ตกลับเป็นโลโก้เริ่มต้น"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
};
