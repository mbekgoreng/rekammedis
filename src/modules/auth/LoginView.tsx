import React, { useState } from 'react';
import {
  Activity,
  Lock,
  Mail,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { UserRole } from '../../types';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { switchRole } = useStore();
  const [email, setEmail] = useState('yusuf.tjakep@tongfangashiap.id');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess();
  };

  const handleQuickLoginAs = (role: UserRole) => {
    switchRole(role);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-900 font-sans">
      {/* Left Column: Clinical Enterprise Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-linear-to-br from-[#0b1d33] via-[#071526] to-[#040e1a] text-white border-r border-slate-800 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-clinical-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-clinical-600 flex items-center justify-center text-white shadow-lg">
            <Activity className="w-7 h-7 text-cyan-200" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-white">
              Tong Fang <span className="text-cyan-400">Ashiap</span>
            </h1>
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold block">
              Electronic Medical Record Enterprise
            </span>
          </div>
        </div>

        {/* Center Philosophy & Clinical Highlights */}
        <div className="max-w-md space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-cyan-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Standar Akreditasi Kemenkes RI
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-slate-100 leading-tight">
            Sistem Informasi Rekam Medis Terpadu Fasilitas Pelayanan Kesehatan
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed">
            Platform clinical-grade untuk dokter, perawat, apoteker, dan staf administrasi faskes dengan interoperabilitas SOAP, ICD-10, E-Prescribing, dan antrean real-time.
          </p>

          <div className="space-y-3 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dokumentasi SOAP & Rekam Medis Elektronik Terstruktur</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Manajemen Antrian Pasien Poliklinik & Audio Chime</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Peresepan Digital Otomatis ke Instalasi Farmasi</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Audit Trail Forensik Keamanan Pasien & RBAC</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 relative z-10 flex items-center justify-between">
          <span>&copy; 2026 Klinik Tong Fang Ashiap System. Hak Cipta Dilindungi.</span>
          <span>Versi Enterprise 4.2.0</span>
        </div>
      </div>

      {/* Right Column: Clean Clinical Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center sm:text-left">
            <div className="inline-flex lg:hidden items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-clinical-700 flex items-center justify-center text-white">
                <Activity className="w-5 h-5 text-cyan-200" />
              </div>
              <span className="font-extrabold text-lg text-slate-900">Klinik Tong Fang Ashiap</span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Masuk ke Akun Faskes
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan kredensial resmi tenaga kesehatan Anda untuk mengakses data rekam medis.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <Input
              label="Email Petugas / Username Faskes"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              requiredIndicator
            />

            <Input
              label="Kata Sandi (Password)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              requiredIndicator
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-clinical-600 focus:ring-clinical-500"
                />
                <span>Ingat sesi perangkat ini</span>
              </label>

              <button
                type="button"
                className="text-clinical-700 hover:text-clinical-900 font-semibold"
              >
                Lupa kata sandi?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-sm font-bold"
              rightIcon={<ArrowRight className="w-4 h-4 text-white" />}
            >
              Masuk ke Sistem EMR
            </Button>
          </form>

          {/* Quick Role Demonstrator Buttons */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-2 text-center sm:text-left">
              Masuk Cepat Sebagai Peran:
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLoginAs('doctor')}
                className="p-2 rounded-lg border border-slate-200 hover:border-clinical-500 hover:bg-clinical-50 text-slate-700 font-semibold text-center transition-colors"
              >
                Dokter
              </button>
              <button
                type="button"
                onClick={() => handleQuickLoginAs('nurse')}
                className="p-2 rounded-lg border border-slate-200 hover:border-clinical-500 hover:bg-clinical-50 text-slate-700 font-semibold text-center transition-colors"
              >
                Perawat
              </button>
              <button
                type="button"
                onClick={() => handleQuickLoginAs('pharmacist')}
                className="p-2 rounded-lg border border-slate-200 hover:border-clinical-500 hover:bg-clinical-50 text-slate-700 font-semibold text-center transition-colors"
              >
                Farmasi
              </button>
              <button
                type="button"
                onClick={() => handleQuickLoginAs('cashier')}
                className="p-2 rounded-lg border border-slate-200 hover:border-clinical-500 hover:bg-clinical-50 text-slate-700 font-semibold text-center transition-colors"
              >
                Kasir
              </button>
              <button
                type="button"
                onClick={() => handleQuickLoginAs('lab')}
                className="p-2 rounded-lg border border-slate-200 hover:border-clinical-500 hover:bg-clinical-50 text-slate-700 font-semibold text-center transition-colors"
              >
                Laboran
              </button>
              <button
                type="button"
                onClick={() => handleQuickLoginAs('admin')}
                className="p-2 rounded-lg border border-slate-200 hover:border-clinical-500 hover:bg-clinical-50 text-slate-700 font-semibold text-center transition-colors"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

