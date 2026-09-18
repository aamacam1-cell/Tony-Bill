import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWA';

export const OfflineStatusBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);
  const [showBackOnlineToast, setShowBackOnlineToast] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setHasBeenOffline(true);
      setShowBackOnlineToast(false);
    } else if (hasBeenOffline) {
      setShowBackOnlineToast(true);
      const timer = setTimeout(() => {
        setShowBackOnlineToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, hasBeenOffline]);

  return (
    <>
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div
          id="pwa-offline-alert"
          role="status"
          className="no-print bg-amber-500 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-md border-b border-amber-600 animate-fadeIn"
        >
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>
                <strong>โหมดออฟไลน์ (Offline Mode)</strong> — ทำงานได้โดยไม่ต้องใช้อินเทอร์เน็ต สามารถแก้ไข บันทึกในเครื่อง และพิมพ์ใบกำกับภาษีได้ 100%
              </span>
            </div>

            {/* Install button if not yet installed */}
            {!isInstalled && (isInstallable || isIOS) && (
              <button
                type="button"
                onClick={isInstallable ? install : () => setShowIOSGuide(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-amber-900 font-bold hover:bg-amber-100 transition-colors shrink-0 text-xs shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ติดตั้งลงเครื่อง</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Back Online Notification Toast */}
      {showBackOnlineToast && isOnline && (
        <div
          id="pwa-online-toast"
          role="status"
          className="no-print fixed bottom-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2.5 text-xs sm:text-sm font-medium animate-bounce"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
          <Wifi className="w-4 h-4 shrink-0" />
          <span>เชื่อมต่ออินเทอร์เน็ตแล้ว — ระบบพร้อมทำงานทั้งโหมดออนไลน์และออฟไลน์</span>
          <button
            type="button"
            onClick={() => setShowBackOnlineToast(false)}
            className="ml-2 hover:opacity-80 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">วิธีติดตั้งบน iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 space-y-2 mb-4">
              เพื่อให้สามารถเปิดใช้งานและพิมพ์ใบกำกับภาษีได้แม้ยามไม่มีสัญญาณเน็ต:
            </p>
            <ol className="list-decimal list-inside text-xs sm:text-sm text-slate-700 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <li>เปิดหน้านี้ในเบราว์เซอร์ <strong>Safari</strong></li>
              <li>แตะปุ่ม <strong>แชร์ (Share)</strong> ที่แถบเครื่องมือด้านล่าง</li>
              <li>เลื่อนลงมาแล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong></li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-orange-600 py-2.5 text-sm font-bold text-white hover:bg-orange-700 transition shadow-xs cursor-pointer"
            >
              รับทราบ / ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </>
  );
};
