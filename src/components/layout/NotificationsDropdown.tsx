import React, { useRef, useEffect } from 'react';
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { clsx } from 'clsx';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-700" />
          <h4 className="font-semibold text-sm text-slate-800">Pemberitahuan Klinis</h4>
        </div>
        <button
          onClick={markAllNotificationsRead}
          className="text-xs text-clinical-600 hover:text-clinical-800 font-medium flex items-center gap-1"
        >
          <CheckCheck className="w-3.5 h-3.5" /> Tandai Semua Dibaca
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Tidak ada notifikasi saat ini.
          </div>
        ) : (
          notifications.map((notif) => {
            const icons = {
              info: <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />,
              warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />,
              critical: <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />,
              success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            };

            return (
              <div
                key={notif.id}
                onClick={() => {
                  markNotificationRead(notif.id);
                  if (notif.linkModule) {
                    onNavigate(notif.linkModule);
                    onClose();
                  }
                }}
                className={clsx(
                  'p-3.5 flex gap-3 cursor-pointer transition-colors hover:bg-slate-50',
                  !notif.read && 'bg-clinical-50/40'
                )}
              >
                {icons[notif.type]}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={clsx('text-xs font-semibold text-slate-800 truncate', !notif.read && 'text-clinical-900')}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-clinical-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-snug">{notif.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">{notif.time}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
