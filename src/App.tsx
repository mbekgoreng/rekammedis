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

const MainLayout: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
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
    return <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />;
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
                onClick={() => setIsAuthenticated(false)}
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
