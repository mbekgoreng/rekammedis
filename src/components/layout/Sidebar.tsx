import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  Stethoscope,
  FileText,
  Pill,
  Package,
  FlaskConical,
  Scan,
  FileSpreadsheet,
  CalendarDays,
  CreditCard,
  BarChart3,
  ShieldCheck,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '../../context/StoreContext';
import { canAccess } from '../../lib/permissions';

interface SidebarProps {
  currentModule: string;
  onNavigate: (module: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) => {
  const { queues, medicines, currentUser, clinicProfile } = useStore();

  const waitingQueueCount = queues.filter((q) => q.status === 'Menunggu').length;
  const lowStockCount = medicines.filter((m) => m.stock <= m.minimumStock).length;

  const menuSections = [
    {
      title: 'Pelayanan Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'queue', label: 'Antrian', icon: Clock, badge: waitingQueueCount > 0 ? waitingQueueCount : undefined, badgeColor: 'bg-amber-500' },
        { id: 'registration', label: 'Pendaftaran', icon: UserPlus },
        { id: 'patients', label: 'Data Pasien', icon: Users },
      ]
    },
    {
      title: 'Asuhan Medis',
      items: [
        { id: 'examination', label: 'Pemeriksaan & SOAP', icon: Stethoscope },
        { id: 'medical_records', label: 'Rekam Medis', icon: FileText },
        { id: 'prescription', label: 'Resep Digital', icon: Pill },
      ]
    },
    {
      title: 'Penunjang Medis',
      items: [
        { id: 'pharmacy', label: 'Farmasi & Stok', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: 'bg-red-500' },
        { id: 'laboratory', label: 'Laboratorium', icon: FlaskConical },
        { id: 'radiology', label: 'Radiologi', icon: Scan },
        { id: 'letters', label: 'Surat Medis', icon: FileSpreadsheet },
      ]
    },
    {
      title: 'Operasional',
      items: [
        { id: 'schedule', label: 'Jadwal Dokter', icon: CalendarDays },
        { id: 'billing', label: 'Pembayaran & Kasir', icon: CreditCard },
        { id: 'reports', label: 'Laporan Fasilitas', icon: BarChart3 },
      ]
    },
    {
      title: 'Sistem & Keamanan',
      items: [
        { id: 'users', label: 'Manajemen Pengguna', icon: ShieldCheck },
        { id: 'audit', label: 'Audit Trail', icon: History },
        { id: 'settings', label: 'Pengaturan Klinik', icon: Settings },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-clinical-sidebar text-slate-300 border-r border-slate-800 transition-all duration-300 select-none shadow-xl lg:shadow-none',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-clinical-dark">
          <div className={clsx('flex items-center gap-3 overflow-hidden', isCollapsed && 'justify-center w-full')}>
            {clinicProfile.logoDataUrl ? (
              <img src={clinicProfile.logoDataUrl} alt="Logo klinik" className="w-10 h-10 rounded-lg object-contain bg-white shadow-md shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-clinical-600 flex items-center justify-center text-white shadow-md shrink-0">
                <Activity className="w-6 h-6 text-clinical-100" />
              </div>
            )}
            {!isCollapsed && (
              <div className="leading-tight">
                <span className="font-extrabold text-white text-base tracking-tight block truncate max-w-[150px]" title={clinicProfile.clinicName}>
                  {clinicProfile.clinicName}
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
                  Klinik EMR Enterprise
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Perkecil Menu"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Current User Clinical Role Indicator */}
        {!isCollapsed && (
          <div className="px-4 py-2.5 bg-[#0a182b] border-b border-slate-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate text-slate-300 font-medium">{currentUser.name}</span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 font-bold">
              {currentUser.role}
            </span>
          </div>
        )}

        {/* Navigation Menus */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5 custom-scrollbar">
          {menuSections
            .map((section) => ({
              ...section,
              items: section.items.filter((item) => canAccess(currentUser.role, item.id))
            }))
            .filter((section) => section.items.length > 0)
            .map((section, sIdx) => (
            <div key={sIdx}>
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onCloseMobile();
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all group relative',
                        isActive
                          ? 'bg-clinical-600 text-white font-semibold shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
                        isCollapsed && 'justify-center px-2'
                      )}
                    >
                      <Icon
                        className={clsx(
                          'w-4 h-4 shrink-0 transition-transform group-hover:scale-105',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                        )}
                      />
                      {!isCollapsed && (
                        <span className="flex-1 text-left truncate">{item.label}</span>
                      )}
                      {!isCollapsed && item.badge !== undefined && (
                        <span
                          className={clsx(
                            'text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full font-mono',
                            item.badgeColor || 'bg-clinical-600'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip for collapsed view */}
                      {isCollapsed && item.badge !== undefined && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-clinical-sidebar" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Collapse Toggle for Collapsed state */}
        {isCollapsed && (
          <div className="p-3 border-t border-slate-800 hidden lg:flex justify-center">
            <button
              onClick={onToggleCollapse}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Perbesar Menu"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
