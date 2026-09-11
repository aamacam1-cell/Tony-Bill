import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { SyncStatus } from '../types';

interface NetworkStatusIndicatorProps {
  isOnline: boolean;
  syncStatus: SyncStatus;
  unsyncedCount: number;
  onSyncNow: (simulateError?: boolean) => void;
  lastError?: string | null;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  isOnline,
  syncStatus,
  unsyncedCount,
  onSyncNow,
  lastError,
}) => {
  return (
    <div className="flex items-center gap-1.5 text-xs select-none">
      {/* Network Status Badge */}
      {isOnline ? (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs transition-all"
          title="เชื่อมต่ออินเทอร์เน็ตอยู่ ข้อมูลจะซิงค์ขึ้นเซิร์ฟเวอร์อัตโนมัติ"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold text-[11px]">ออนไลน์</span>
        </div>
      ) : (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs animate-pulse transition-all"
          title="ไม่มีการเชื่อมต่ออินเทอร์เน็ต แต่คุณยังสามารถใช้งานและบันทึกข้อมูลลงใน IndexedDB ได้ตามปกติ เมื่อต่อเน็ตได้ระบบจะซิงค์ขึ้นอัตโนมัติ"
        >
          <WifiOff className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-bold text-[11px]">ออฟไลน์</span>
          <span className="text-[10px] hidden sm:inline bg-amber-200/70 text-amber-900 px-1.5 py-0.2 rounded font-medium">
            บันทึกลง IndexedDB ในเครื่อง
          </span>
        </div>
      )}

      {/* Sync Status / Action Details */}
      {syncStatus === 'syncing' ? (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">
          <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
          <span className="font-medium">กำลังซิงค์...</span>
        </div>
      ) : unsyncedCount > 0 ? (
        <div className="inline-flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200 text-[11px]"
            title={`มีข้อมูล ${unsyncedCount} รายการที่บันทึกใน IndexedDB และรอซิงค์ขึ้น Server`}
          >
            <Database className="w-3 h-3 text-orange-600" />
            <span className="font-medium">รอซิงค์ {unsyncedCount} รายการ</span>
          </span>

          {isOnline && (
            <button
              type="button"
              onClick={() => onSyncNow(false)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-600 hover:bg-orange-700 text-white font-medium text-[11px] shadow-2xs transition-colors cursor-pointer"
              title="กดเพื่อซิงค์ข้อมูลใน IndexedDB ขึ้นเซิร์ฟเวอร์ทันที"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>ซิงค์ทันที</span>
            </button>
          )}
        </div>
      ) : isOnline ? (
        <div
          className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium opacity-80"
          title="ข้อมูลในเครื่องและเซิร์ฟเวอร์ตรงกันแล้ว"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>ซิงค์แล้ว</span>
        </div>
      ) : null}

      {/* Error notification if server sync failed */}
      {syncStatus === 'error' && isOnline && (
        <div
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[11px]"
          title={lastError || 'เซิร์ฟเวอร์มีปัญหา ข้อมูลยังอยู่ใน IndexedDB ปลอดภัย'}
        >
          <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
          <span className="truncate max-w-[120px] font-medium">ซิงค์ไม่ผ่าน (ลองใหม่)</span>
          <button
            type="button"
            onClick={() => onSyncNow(false)}
            className="underline hover:text-red-900 font-bold ml-0.5 cursor-pointer"
          >
            ลองอีกครั้ง
          </button>
        </div>
      )}
    </div>
  );
};
