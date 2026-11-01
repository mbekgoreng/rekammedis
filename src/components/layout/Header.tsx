import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Volume2,
  Building2,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { NotificationsDropdown } from './NotificationsDropdown';
import { GlobalSearchModal } from './GlobalSearchModal';
import { UserRole } from '../../types';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onNavigate: (module: string) => void;
  onSelectPatient: (patientId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onNavigate,
  onSelectPatient
}) => {
  const { currentUser, switchRole, notifications, queues, callQueuePatient } = useStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const waitingPatients = queues.filter((q) => q.status === 'Menunggu');

  // Listen for Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickCallNext = () => {
    if (waitingPatients.length > 0) {
      callQueuePatient(waitingPatients[0].id);
    }
  };

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'doctor', label: 'Dokter Spesialis / Umum', desc: 'Akses SOAP, rekam medis, diagnosa, resep' },
    { role: 'nurse', label: 'Perawat / Triage', desc: 'Akses vital signs, antrean, pendaftaran awal' },
    { role: 'pharmacist', label: 'Apoteker / Farmasi', desc: 'Akses resep masuk, stok obat, peracikan' },
    { role: 'cashier', label: 'Kasir / Billing', desc: 'Akses invoice, tagihan, pembayaran' },
    { role: 'lab', label: 'Petugas Laboratorium', desc: 'Akses order lab/radiologi, input hasil' },
    { role: 'admin', label: 'Administrator Fasilitas', desc: 'Akses penuh seluruh modul sistem' }
  ];

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        {/* Left Side: Mobile Hamburger & Facility Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Building2 className="w-4 h-4 text-clinical-600 shrink-0" />
            <span className="font-semibold text-slate-800">Klinik Tong Fang Ashiap</span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-emerald-700 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Sistem Aktif
            </span>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md mx-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-500 transition-colors shadow-2xs group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              <span className="hidden md:inline">Cari pasien, RM, obat, dokter, invoice...</span>
              <span className="md:hidden">Pencarian cepat...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Side: Quick Action, Notifications, User Role Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Call Next Patient Button */}
          {waitingPatients.length > 0 && (
            <button
              onClick={handleQuickCallNext}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              title={`Panggil antrean berikutnya (${waitingPatients[0].queueNumber})`}
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-700 animate-bounce" />
              <span>Panggil {waitingPatients[0].queueNumber}</span>
            </button>
          )}

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
              aria-label="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <NotificationsDropdown
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              onNavigate={onNavigate}
            />
          </div>

          <div className="h-6 w-px bg-slate-200 mx-0.5" />

          {/* User Profile & Clinical Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-clinical-700 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .filter((_, i) => i < 2)
                  .join('')}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                  {currentUser.name}
                </p>
                <p className="text-[10px] font-medium text-clinical-700 capitalize flex items-center gap-1">
                  <UserCheck className="w-2.5 h-2.5" />
                  Peran: {currentUser.role}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Role Switcher Menu */}
            {isRoleDropdownOpen && (
              <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-clinical-50 text-clinical-800 rounded border border-clinical-200">
                    Peran Aktif: {currentUser.role}
                  </span>
                </div>

                <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Ganti Peran Pengguna (Simulasi)
                </div>

                <div className="space-y-1">
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchRole(r.role);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex flex-col ${
                        currentUser.role === r.role
                          ? 'bg-clinical-50 text-clinical-900 font-semibold border border-clinical-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="font-semibold">{r.label}</span>
                      <span className="text-[10px] text-slate-500">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectPatient={onSelectPatient}
        onNavigate={onNavigate}
      />
    </>
  );
};
