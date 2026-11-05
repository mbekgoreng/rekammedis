import React, { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Views
import { DashboardView } from './modules/dashboard/DashboardView';
import { PatientListView } from './modules/patients/PatientListView';
import { PatientDetailView } from './modules/patients/PatientDetailView';
import { RegistrationView } from './modules/registration/RegistrationView';
import { QueueView } from './modules/queue/QueueView';
import { ExaminationView } from './modules/examination/ExaminationView';
import { PrescriptionView } from './modules/prescription/PrescriptionView';
import { PharmacyView } from './modules/pharmacy/PharmacyView';
import { LaboratoryView } from './modules/laboratory/LaboratoryView';
import { RadiologyView } from './modules/radiology/RadiologyView';
import { DoctorScheduleView } from './modules/schedule/DoctorScheduleView';
import { BillingView } from './modules/billing/BillingView';
import { MedicalLettersView } from './modules/letters/MedicalLettersView';
import { ReportsView } from './modules/reports/ReportsView';
import { UserManagementView } from './modules/users/UserManagementView';
import { AuditTrailView } from './modules/audit/AuditTrailView';
import { ClinicSettingsView } from './modules/settings/ClinicSettingsView';
import { ChangePasswordView } from './modules/auth/ChangePasswordView';
import { GuideView } from './modules/guide/GuideView';
import { BpjsView } from './modules/bpjs/BpjsView';
import { TourOverlay, tourStorageKey } from './components/onboarding/TourOverlay';
import { DEFAULT_CLINIC_ID } from './lib/clinics';
import { apiFetch } from './lib/api';
import { canAccess, ROLE_LABELS } from './lib/permissions';
import { loadSession } from './lib/auth';

// Cangkang ruang kerja: semua yang dirender SETELAH masuk (penyedia store,
// sidebar/header, seluruh modul). Dimuat sebagai chunk terpisah lewat
// React.lazy dari App.tsx supaya chunk awal halaman login tetap ringan.
// Perilaku di dalam cangkang ini tidak berubah dari sebelumnya.

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
  return null;
};

const MainLayout: React.FC = () => {
  const { isAuthenticated, logout, currentUser, clinicProfile, clinicId } = useStore();
  const [tourOpen, setTourOpen] = useState(false);

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
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentModule('patient_detail');
  };

  const handleNavigate = (module: string) => {
    setCurrentModule(module);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <SubscriptionBanner />
      <div className="flex-1 flex w-full">
        {/* Left Clinical Sidebar */}
        <Sidebar
          currentModule={selectedPatientId && currentModule === 'patient_detail' ? 'patients' : currentModule}
          onNavigate={(mod) => {
            setSelectedPatientId(null);
            handleNavigate(mod);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Clinical Top Header */}
          <Header
            onOpenTour={() => setTourOpen(true)}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
            onNavigate={(mod) => {
              setSelectedPatientId(null);
              handleNavigate(mod);
            }}
            onSelectPatient={handleSelectPatient}
          />

          {/* Module Canvas */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {!canAccess(currentUser.role, currentModule) ? (
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
                  setSelectedPatientId(null);
                  setCurrentModule('patients');
                }}
                onNavigate={handleNavigate}
              />
            )}

            {currentModule === 'registration' && (
              <RegistrationView
                selectedPatientId={selectedPatientId || undefined}
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
                selectedPatientId={selectedPatientId || undefined}
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

            {currentModule === 'users' && <UserManagementView />}

            {currentModule === 'audit' && <AuditTrailView />}

            {currentModule === 'settings' && <ClinicSettingsView />}

            {currentModule === 'change_password' && <ChangePasswordView />}

            {currentModule === 'guide' && <GuideView onStartTour={() => setTourOpen(true)} />}
              </>
            )}
          </main>

          {/* Clinical Minimalist Footer */}
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
          onNavigate={(mod) => {
            setSelectedPatientId(null);
            handleNavigate(mod);
          }}
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
