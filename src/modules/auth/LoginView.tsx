import React, { useEffect, useState } from 'react';
import {
  Activity,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { loadGuard, recordFailedLogin, resetGuard } from '../../lib/auth';

export const LoginView: React.FC = () => {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);

  // Hitung mundur kunci anti brute-force
  useEffect(() => {
    const tick = () => {
      const guard = loadGuard();
      const remaining = Math.max(0, Math.ceil((guard.lockUntil - Date.now()) / 1000));
      setLockRemaining(remaining);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const locked = lockRemaining > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(email, password, rememberMe);
      if (!result.ok) {
        const guard = recordFailedLogin();
        if (guard.lockUntil > Date.now()) {
          setError('Terlalu banyak percobaan gagal. Formulir dikunci selama 60 detik.');
        } else {
          setError(result.error || 'Email atau kata sandi salah.');
        }
      } else {
        resetGuard();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-900 font-sans">
      {/* Left Column: Clinical Enterprise Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-linear-to-br from-[#0b1d33] via-[#071526] to-[#040e1a] text-white border-r border-slate-800 relative overflow-hidden">
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
            Akses Terproteksi Kata Sandi &amp; Jejak Audit
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
              <span>Setiap akun petugas memiliki kata sandi pribadi</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sesi masuk tercatat dan berakhir otomatis</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Peran akun menentukan hak akses modul (RBAC)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Audit Trail Forensik Keamanan Pasien &amp; RBAC</span>
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
              Gunakan email dan kata sandi resmi Anda. Setiap aktivitas tercatat atas nama akun yang masuk.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-700" role="alert">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {locked && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-800" role="alert">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">
                Formulir terkunci sementara. Coba lagi dalam {lockRemaining} detik.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <Input
              label="Email Petugas"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              requiredIndicator
              autoComplete="username"
              placeholder="nama@tongfangashiap.id"
            />

            <div className="relative">
              <Input
                label="Kata Sandi (Password)"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                requiredIndicator
                autoComplete="current-password"
                placeholder="Masukkan kata sandi Anda"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-clinical-600 focus:ring-clinical-500"
                />
                <span>Ingat sesi perangkat ini (7 hari)</span>
              </label>

              <span className="text-slate-400 text-right">
                Lupa kata sandi? Hubungi administrator.
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-sm font-bold"
              rightIcon={<ArrowRight className="w-4 h-4 text-white" />}
              disabled={locked || submitting}
            >
              {submitting ? 'Memeriksa Kredensial…' : 'Masuk ke Sistem EMR'}
            </Button>
          </form>

          <p className="text-[11px] leading-relaxed text-slate-400 border-t border-slate-100 pt-4">
            Akses tanpa izin ke sistem rekam medis adalah pelanggaran kerahasiaan data pasien.
            Percobaan masuk yang gagal berulang akan mengunci formulir sementara, dan aktivitas di dalam sistem tercatat pada jejak audit atas nama akun yang masuk.
          </p>
        </div>
      </div>
    </div>
  );
};
