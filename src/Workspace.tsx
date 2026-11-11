import React, { Suspense, useEffect, useRef, useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useRoute, navigateTo, moduleToPath, routeTitle } from './lib/router';

// Views — dimuat per rute (code-splitting): setiap halaman jadi chunk sendiri,
// jadi membuka Dashboard tidak lagi mengunduh seluruh modul sekaligus.
function lazyView(
  load: () => Promise<Record<string, unknown>>,
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): React.LazyExoticComponent<React.ComponentType<any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return React.lazy(() => load().then((m) => ({ default: m[name] as React.ComponentType<any> })));
}

const DashboardView = lazyView(() => import('./modules/dashboard/DashboardView'), 'DashboardView');
const PatientListView = lazyView(() => import('./modules/patients/PatientListView'), 'PatientListView');
const PatientDetailView = lazyView(() => import('./modules/patients/PatientDetailView'), 'PatientDetailView');
const RegistrationView = lazyView(() => import('./modules/registration/RegistrationView'), 'RegistrationView');
const QueueView = lazyView(() => import('./modules/queue/QueueView'), 'QueueView');
const ExaminationView = lazyView(() => import('./modules/examination/ExaminationView'), 'ExaminationView');
const PrescriptionView = lazyView(() => import('./modules/prescription/PrescriptionView'), 'PrescriptionView');
const PharmacyView = lazyView(() => import('./modules/pharmacy/PharmacyView'), 'PharmacyView');
const LaboratoryView = lazyView(() => import('./modules/laboratory/LaboratoryView'), 'LaboratoryView');
const RadiologyView = lazyView(() => import('./modules/radiology/RadiologyView'), 'RadiologyView');
const DoctorScheduleView = lazyView(() => import('./modules/schedule/DoctorScheduleView'), 'DoctorScheduleView');
const BillingView = lazyView(() => import('./modules/billing/BillingView'), 'BillingView');
const MedicalLettersView = lazyView(() => import('./modules/letters/MedicalLettersView'), 'MedicalLettersView');
const ReportsView = lazyView(() => import('./modules/reports/ReportsView'), 'ReportsView');
const UserManagementView = lazyView(() => import('./modules/users/UserManagementView'), 'UserManagementView');
const AuditTrailView = lazyView(() => import('./modules/audit/AuditTrailView'), 'AuditTrailView');
const ClinicSettingsView = lazyView(() => import('./modules/settings/ClinicSettingsView'), 'ClinicSettingsView');
const ChangePasswordView = lazyView(() => import('./modules/auth/ChangePasswordView'), 'ChangePasswordView');
const GuideView = lazyView(() => import('./modules/guide/GuideView'), 'GuideView');
const BpjsView = lazyView(() => import('./modules/bpjs/BpjsView'), 'BpjsView');
const AiAssistantView = lazyView(() => import('./modules/ai/AiAssistantView'), 'AiAssistantView');

import { TourOverlay, tourStorageKey } from './components/onboarding/TourOverlay';
import { DEFAULT_CLINIC_ID } from './lib/clinics';
import { apiFetch } from './lib/api';
import { canAccess, ROLE_LABELS } from './lib/permissions';
import { loadSession } from './lib/auth';

// Cangkang ruang kerja: semua yang dirender SETELAH masuk (penyedia store,
// sidebar/header, seluruh modul). Dimuat sebagai chunk terpisah lewat
// React.lazy dari App.tsx supaya chunk awal halaman login tetap ringan.
// Navigasi antar halaman memakai URL sungguhan (lib/router): /app/dashboard,
// /app/pasien/<id>, /app/antrean, dst — bisa di-bookmark, dibagikan, dan
// tombol kembali/maju browser berfungsi.

const ModuleLoading: React.FC = () => (
  <div className="flex items-center justify-center py-24" role="status" aria-label="Memuat halaman">
    <span className="w-8 h-8 rounded-full border-[3px] border-slate-200 border-t-clinical-600 animate-spin" />
  </div>
);

const SubscriptionBanner: React.FC = () => {
  const [info, setInfo] = useState<{ expired: boolean; status: string; trialEndsAt?: string | null; currentPeriodEnd?: string | null } | null>(null);
  useEffect(() => {
    const s = loadSession();
    if (!s?.apiToken) return;
    void apiFetch<{ subscription: { expired: boolean; status: string; trialEndsAt?: string | null; currentPeriodEnd?: string | null } }>('/api/billing')
      .then(({ data }) => setInfo(data.subscription || null))
      .catch(() => undefined);
  }, []);
  if (!info) return null;
  const trialDays = info.trialEndsAt ? Math.ceil((new Date(info.trialEndsAt).getTime() - Date.now()) / 86400000) : null;
  if (info.expired) {
    return (
      <div className="bg-red-600 text-white text-center text-xs font-semibold px-4 py-2">
        Masa langganan klinik Anda telah berakhir — data tetap aman, tetapi pencatatan baru tidak tersinkron ke server. Perpanjang di Pengaturan → Langganan.
      </div>
    );
  }
  if (info.status === 'trialing' && trialDays !== null && trialDays <= 3) {
    return (
      <div className="bg-amber-500 text-white text-center text-xs font-semibold px-4 py-2">
        Masa trial berakhir dalam {Math.max(trialDays, 0)} hari — aktifkan langganan di Pengaturan → Langganan agar layanan tidak terjeda.
      </div>
    );
  }
  if (info.status === 'trialing' && trialDays !== null) {
    return (
      <div className="bg-clinical-600 text-white text-center text-xs font-semibold px-4 py-2">
        Free trial aktif — tersisa {Math.max(trialDays, 0)} hari. Semua fitur tersedia; aktifkan langganan kapan pun di Pengaturan → Langganan.
      </div>
    );
  }
  return null;
};

const MainLayout: React.FC = () => {
  const { isAuthenticated, logout, currentUser, clinicProfile, clinicId } = useStore();
  const [tourOpen, setTourOpen] = useState(false);
  const { route, navigate } = useRoute();
  const currentModule = route.module;
  const selectedPatientId = route.module === 'patient_detail' ? route.patientId : null;
  // Pasien konteks untuk modul yang menerima pasien terpilih (Pendaftaran,
  // Pemeriksaan) — terpisah dari rute detail pasien.
  const [contextPatientId, setContextPatientId] = useState<string | null>(route.patientId);
  const mainRef = useRef<HTMLElement>(null);
  const routeChanges = useRef(0);

  // Tutorial tampil otomatis SEKALI untuk admin klinik yang baru mendaftar
  useEffect(() => {
    if (!isAuthenticated || currentUser.role !== 'admin' || clinicId === DEFAULT_CLINIC_ID) return;
    try {
      if (!localStorage.getItem(tourStorageKey(clinicId, currentUser.id))) {
        setTourOpen(true);
      }
    } catch {
      // abaikan
    }
  }, [isAuthenticated, currentUser, clinicId]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // /app atau /app/ tanpa halaman -> arahkan ke Dashboard
  useEffect(() => {
    const p = window.location.pathname;
    if (p === '/app' || p === '/app/') {
      navigateTo(moduleToPath('dashboard'), { replace: true });
    }
  }, []);

  // Judul tab mengikuti halaman + gulir/fokus ke konten saat berpindah
  useEffect(() => {
    document.title = route.notFound
      ? 'Halaman Tidak Ditemukan — RekamMedis'
      : `${routeTitle(currentModule)} — RekamMedis`;
    routeChanges.current += 1;
    if (routeChanges.current > 1) {
      window.scrollTo({ top: 0 });
      mainRef.current?.focus({ preventScroll: true });
    }
  }, [currentModule, route.notFound, route.patientId]);

  const handleSelectPatient = (patientId: string) => {
    setContextPatientId(patientId);
    navigate('patient_detail', patientId);
  };

  const handleNavigate = (module: string) => {
    navigate(module);
  };

  const clearAndNavigate = (module: string) => {
    setContextPatientId(null);
    handleNavigate(module);
  };

  // Sesi tidak valid/kedaluwarsa di tengah pemakaian → keluar bersih
  useEffect(() => {
    if (!isAuthenticated) logout();
  }, [isAuthenticated, logout]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col antialiased">
      <a
        href="#konten-utama"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:text-clinical-800 focus:font-bold focus:text-xs focus:px-3 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        Lewati ke konten utama
      </a>
      <SubscriptionBanner />
      <div className="flex-1 flex w-full">
        <Sidebar
          currentModule={currentModule === 'patient_detail' ? 'patients' : currentModule}
          onNavigate={clearAndNavigate}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header
            onOpenTour={() => setTourOpen(true)}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
            onNavigate={clearAndNavigate}
            onSelectPatient={handleSelectPatient}
          />

          <main id="konten-utama" ref={mainRef} tabIndex={-1} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto outline-none">
            <ErrorBoundary resetKey={`${currentModule}:${selectedPatientId ?? ''}:${route.notFound}`} onGoDashboard={() => handleNavigate('dashboard')}>
            <Suspense fallback={<ModuleLoading />}>
            {route.notFound ? (
              <div className="max-w-lg mx-auto mt-16 text-center space-y-4 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto text-sm font-black">404</div>
                <h2 className="text-lg font-bold text-slate-800">Halaman Tidak Ditemukan</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Alamat yang Anda buka tidak dikenal. Halaman mungkin sudah dipindah, atau tautannya salah ketik.
                </p>
                <button
                  onClick={() => handleNavigate('dashboard')}
                  className="px-4 py-2 rounded-lg bg-clinical-700 text-white text-xs font-bold hover:bg-clinical-800"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            ) : !canAccess(currentUser.role, currentModule) ? (
              <div className="max-w-lg mx-auto mt-16 text-center space-y-4 bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
                <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto text-2xl font-black">
                  !
                </div>
                <h2 className="text-lg font-bold text-slate-800">Akses Dibatasi untuk Peran Anda</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Akun {currentUser.name} masuk sebagai {ROLE_LABELS[currentUser.role]} dan tidak memiliki
                  hak akses ke modul ini. Hak akses ditetapkan oleh administrator sesuai matriks RBAC.
                </p>
                <button
                  onClick={() => handleNavigate('dashboard')}
                  className="px-4 py-2 rounded-lg bg-clinical-700 text-white text-xs font-bold hover:bg-clinical-800"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            ) : (
              <>
            {currentModule === 'dashboard' && (
              <DashboardView
                onNavigate={handleNavigate}
                onSelectPatient={handleSelectPatient}
              />
            )}

            {currentModule === 'patients' && (
              <PatientListView
                onSelectPatient={handleSelectPatient}
                onNavigate={handleNavigate}
              />
            )}

            {currentModule === 'patient_detail' && selectedPatientId && (
              <PatientDetailView
                patientId={selectedPatientId}
                onBack={() => {
                  setContextPatientId(null);
                  handleNavigate('patients');
                }}
                onNavigate={handleNavigate}
              />
            )}

            {currentModule === 'registration' && (
              <RegistrationView
                selectedPatientId={contextPatientId || undefined}
                onNavigate={handleNavigate}
                onSelectPatient={handleSelectPatient}
              />
            )}

            {currentModule === 'queue' && (
              <QueueView
                onNavigate={handleNavigate}
                onSelectPatient={handleSelectPatient}
              />
            )}

            {(currentModule === 'examination' || currentModule === 'medical_records') && (
              <ExaminationView
                selectedPatientId={contextPatientId || undefined}
                onNavigate={handleNavigate}
                onSelectPatient={handleSelectPatient}
              />
            )}

            {currentModule === 'prescription' && (
              <PrescriptionView
                onNavigate={handleNavigate}
                onSelectPatient={handleSelectPatient}
              />
            )}

            {currentModule === 'pharmacy' && <PharmacyView />}

            {currentModule === 'laboratory' && <LaboratoryView />}

            {currentModule === 'radiology' && <RadiologyView />}

            {currentModule === 'schedule' && <DoctorScheduleView />}

            {currentModule === 'billing' && <BillingView />}

            {currentModule === 'letters' && <MedicalLettersView />}

            {currentModule === 'reports' && <ReportsView />}

            {currentModule === 'bpjs' && <BpjsView />}

            {currentModule === 'ai_assistant' && <AiAssistantView />}

            {currentModule === 'users' && <UserManagementView />}

            {currentModule === 'audit' && <AuditTrailView />}

            {currentModule === 'settings' && <ClinicSettingsView />}

            {currentModule === 'change_password' && <ChangePasswordView />}

            {currentModule === 'guide' && <GuideView onStartTour={() => setTourOpen(true)} />}
              </>
            )}
            </Suspense>
            </ErrorBoundary>
          </main>

          <footer className="py-3 px-6 border-t border-slate-200 bg-white text-slate-400 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 no-print">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">{clinicProfile.clinicName}</span>
              <span>&bull;</span>
              <span>Sistem Rekam Medis Terpadu</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>RekamMedis &bull; Rekam Medis Elektronik</span>
              <span>&bull;</span>
              <button
                onClick={logout}
                className="text-slate-500 hover:text-red-600 font-semibold"
              >
                Kunci Layar (Logout)
              </button>
            </div>
          </footer>
        </div>
      </div>

      {tourOpen && (
        <TourOverlay
          onNavigate={clearAndNavigate}
          onClose={() => setTourOpen(false)}
        />
      )}
    </div>
  );
};

const Workspace: React.FC<{ clinicId: string; onLogout: () => void }> = ({ clinicId, onLogout }) => (
  <StoreProvider key={clinicId} clinicId={clinicId} onLogout={onLogout}>
    <MainLayout />
  </StoreProvider>
);

export default Workspace;
