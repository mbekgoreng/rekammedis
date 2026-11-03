import React, { useState } from 'react';
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
import { LoginView } from './modules/auth/LoginView';
import { ChangePasswordView } from './modules/auth/ChangePasswordView';
import { canAccess, ROLE_LABELS } from './lib/permissions';

const MainLayout: React.FC = () => {
  const { isAuthenticated, logout, currentUser } = useStore();
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

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col antialiased">
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

            {currentModule === 'users' && <UserManagementView />}

            {currentModule === 'audit' && <AuditTrailView />}

            {currentModule === 'settings' && <ClinicSettingsView />}

            {currentModule === 'change_password' && <ChangePasswordView />}
              </>
            )}
          </main>

          {/* Clinical Minimalist Footer */}
          <footer className="py-3 px-6 border-t border-slate-200 bg-white text-slate-400 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 no-print">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">Klinik Tong Fang Ashiap</span>
              <span>&bull;</span>
              <span>Sistem Rekam Medis Terpadu</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>Interoperabilitas SatuSehat / Kemenkes RI</span>
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
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
}
