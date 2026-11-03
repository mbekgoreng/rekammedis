import React, { useEffect, useState } from 'react';
import {
  hashPassword, saveSession, loadGuard, recordFailedLogin, resetGuard, DEFAULT_PASSWORD
} from '../../lib/auth';
import { findAccount, emailTaken, createClinic, readClinicSettings } from '../../lib/clinics';

// Layar masuk & pendaftaran RekamMedis — satu konsep visual dengan landing page:
// panel navy #17155E → #213A75, aksen hijau #84E488, logo resmi, Plus Jakarta Sans.
//
// Dua gerbang:
//  - "Masuk": email + kata sandi. Akun dicari di semua klinik terdaftar pada
//    perangkat ini; sesi terikat ke klinik pemilik akun.
//  - "Daftar Klinik": membuat ruang kerja klinik baru (profil klinik + akun
//    admin) lalu langsung masuk. Nama klinik, pengaturan, dan tema mengikuti
//    klinik yang didaftarkan — bukan nama bawaan.

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#409DA1] focus:outline-none focus:ring-2 focus:ring-[#409DA1]/30';
const labelCls = 'block text-xs font-bold text-slate-600 mb-1.5';

export const LoginView: React.FC<{ onAuthenticated: () => void }> = ({ onAuthenticated }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // ---- Login state ----
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);

  useEffect(() => {
    const guard = loadGuard();
    if (guard.lockUntil > Date.now()) setLockSeconds(Math.ceil((guard.lockUntil - Date.now()) / 1000));
    const t = setInterval(() => setLockSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const startSession = (clinicId: string, userId: string, userEmail: string, rememberMe: boolean) => {
    const policy = readClinicSettings(clinicId);
    const now = Date.now();
    saveSession({
      userId,
      email: userEmail,
      clinicId,
      loginAt: now,
      expiresAt: now + (rememberMe ? policy.rememberDays * 24 * 60 * 60 * 1000 : policy.sessionHours * 60 * 60 * 1000),
      remember: rememberMe
    });
    resetGuard();
    onAuthenticated();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockSeconds > 0 || busy) return;
    setError(null);
    setBusy(true);
    try {
      const found = findAccount(email);
      const policy = found ? readClinicSettings(found.clinicId) : null;
      const fail = () => {
        const guard = policy
          ? recordFailedLogin(policy.maxLoginAttempts, policy.lockMinutes * 60 * 1000)
          : recordFailedLogin();
        if (guard.lockUntil > Date.now()) setLockSeconds(Math.ceil((guard.lockUntil - Date.now()) / 1000));
        setError('Email atau kata sandi salah.');
      };
      if (!found || found.user.isActive === false || !found.user.passwordHash) {
        fail();
        return;
      }
      const candidate = await hashPassword(found.user.id, password);
      if (candidate !== found.user.passwordHash) {
        fail();
        return;
      }
      startSession(found.clinicId, found.user.id, found.user.email, remember);
    } finally {
      setBusy(false);
    }
  };

  // ---- Register state ----
  const [reg, setReg] = useState({
    clinicName: '',
    facilityType: 'Klinik Pratama',
    address: '',
    phone: '',
    clinicEmail: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPassword2: ''
  });
  const [regError, setRegError] = useState<string | null>(null);
  const [regBusy, setRegBusy] = useState(false);
  const setRegField = (k: keyof typeof reg) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setReg((prev) => ({ ...prev, [k]: e.target.value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regBusy) return;
    setRegError(null);
    if (!reg.clinicName.trim() || !reg.address.trim() || !reg.phone.trim() || !reg.adminName.trim()) {
      setRegError('Nama klinik, alamat, telepon, dan nama admin wajib diisi.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.adminEmail.trim())) {
      setRegError('Format email admin tidak valid.');
      return;
    }
    if (reg.adminPassword.length < 8) {
      setRegError('Kata sandi admin minimal 8 karakter.');
      return;
    }
    if (reg.adminPassword !== reg.adminPassword2) {
      setRegError('Konfirmasi kata sandi tidak sama.');
      return;
    }
    if (emailTaken(reg.adminEmail)) {
      setRegError('Email admin sudah terdaftar pada klinik lain di perangkat ini. Gunakan email lain.');
      return;
    }
    setRegBusy(true);
    try {
      const { clinicId, admin } = await createClinic({
        clinicName: reg.clinicName.trim(),
        facilityType: reg.facilityType,
        address: reg.address.trim(),
        phone: reg.phone.trim(),
        clinicEmail: reg.clinicEmail.trim(),
        adminName: reg.adminName.trim(),
        adminEmail: reg.adminEmail,
        adminPassword: reg.adminPassword
      });
      startSession(clinicId, admin.id, admin.email, true);
    } finally {
      setRegBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f6f8fb] font-sans">
      {/* Panel kiri — konsep landing page */}
      <aside className="hidden lg:flex w-[46%] relative overflow-hidden flex-col justify-between p-10 text-white"
        style={{ background: 'linear-gradient(150deg, #17155E 0%, #213A75 48%, #2F698B 100%)' }}>
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-30 blur-3xl" style={{ background: '#84E488' }} />
        <div className="pointer-events-none absolute bottom-10 -left-32 w-96 h-96 rounded-full opacity-25 blur-3xl" style={{ background: '#409DA1' }} />
        <div className="relative flex items-center gap-3">
          <span className="bg-white rounded-2xl p-1.5 inline-flex">
            <img src="/logo.svg" alt="Logo RekamMedis" className="w-10 h-10" />
          </span>
          <div>
            <p className="font-extrabold text-lg leading-none tracking-tight">RekamMedis</p>
            <p className="text-[11px] text-white/70 mt-1">Sistem Rekam Medis Elektronik Terpadu</p>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Satu sistem untuk<br />seluruh klinik Anda.
          </h1>
          <p className="text-white/75 text-sm leading-relaxed max-w-md">
            Daftarkan klinik Anda dan mulai bekerja dengan nama, pengaturan, dan tema warna
            klinik Anda sendiri — pendaftaran pasien, antrean, SOAP, resep, farmasi,
            laboratorium, sampai kasir dan laporan dalam satu alur.
          </p>
          <ul className="space-y-3 text-sm">
            {[
              'Nama & profil klinik mengikuti pendaftaran Anda',
              'Setiap klinik ruang kerja terpisah — data tidak tercampur',
              'Tema warna bisa diganti kapan saja di Pengaturan',
              'Akun per petugas dengan hak akses sesuai peran'
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#84E488' }}>
                  <svg viewBox="0 0 12 12" className="w-3 h-3"><path d="M2 6.5 4.8 9 10 3" fill="none" stroke="#17155E" strokeWidth="2" strokeLinecap="round" /></svg>
                </span>
                <span className="text-white/90">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-white/50 leading-relaxed">
          RekamMedis saat ini berjalan sebagai prototipe di perangkat ini. Untuk pemakaian
          produksi banyak klinik diperlukan server & basis data terpusat — lihat catatan di Pengaturan.
        </p>
      </aside>

      {/* Panel kanan — formulir */}
      <main className="flex-1 flex items-center justify-center p-5 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <img src="/logo.svg" alt="Logo RekamMedis" className="w-10 h-10" />
            <div>
              <p className="font-extrabold text-[#17155E] leading-none">RekamMedis</p>
              <p className="text-[11px] text-slate-500 mt-1">Rekam Medis Elektronik Terpadu</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-200/70 mb-6" role="tablist">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`py-2.5 rounded-xl text-sm font-bold transition ${tab === t ? 'bg-white text-[#17155E] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t === 'login' ? 'Masuk' : 'Daftar Klinik'}
              </button>
            ))}
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Selamat datang kembali</h2>
                <p className="text-xs text-slate-500 mt-1">Masuk dengan akun petugas klinik Anda.</p>
              </div>
              <div>
                <label className={labelCls} htmlFor="login-email">Email</label>
                <input id="login-email" type="email" autoComplete="username" className={inputCls}
                  placeholder="nama@klinikanda.id" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls} htmlFor="login-password">Kata Sandi</label>
                <div className="relative">
                  <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                    className={`${inputCls} pr-16`} placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#2F698B]">
                    {showPassword ? 'Sembunyi' : 'Lihat'}
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 select-none">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#409DA1]" />
                Ingat saya di perangkat ini (sesi 7 hari)
              </label>
              {error && (
                <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5" role="alert">{error}</p>
              )}
              <button type="submit" disabled={busy || lockSeconds > 0}
                className="w-full py-3 rounded-xl font-extrabold text-sm text-[#17155E] transition disabled:opacity-60"
                style={{ background: 'linear-gradient(90deg, #84E488, #6BCE90)' }}>
                {lockSeconds > 0 ? `Terkunci — coba lagi dalam ${lockSeconds} detik` : busy ? 'Memeriksa…' : 'Masuk ke Aplikasi'}
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                Lupa kata sandi? Hubungi administrator klinik Anda untuk reset.<br />
                Akun demo Klinik Tong Fang Ashiap: <span className="font-semibold text-slate-700">admin@tongfangashiap.id</span> / {DEFAULT_PASSWORD}
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Daftarkan klinik Anda</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ruang kerja klinik dibuat atas nama klinik Anda — lengkap dengan akun admin pertama.
                  Staf lain ditambahkan nanti lewat Manajemen Pengguna.
                </p>
              </div>
              <fieldset className="space-y-3">
                <legend className="text-[11px] font-extrabold uppercase tracking-wider text-[#2F698B]">Data Klinik</legend>
                <div>
                  <label className={labelCls} htmlFor="reg-clinic">Nama Klinik *</label>
                  <input id="reg-clinic" className={inputCls} placeholder="cth. Klinik Sehat Bersama" value={reg.clinicName} onChange={setRegField('clinicName')} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} htmlFor="reg-type">Jenis Fasilitas</label>
                    <select id="reg-type" className={inputCls} value={reg.facilityType} onChange={setRegField('facilityType')}>
                      <option>Klinik Pratama</option>
                      <option>Klinik Utama</option>
                      <option>Puskesmas</option>
                      <option>Rumah Sakit</option>
                      <option>Praktik Mandiri</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="reg-phone">Telepon Klinik *</label>
                    <input id="reg-phone" className={inputCls} placeholder="(021) …" value={reg.phone} onChange={setRegField('phone')} required />
                  </div>
                </div>
                <div>
                  <label className={labelCls} htmlFor="reg-address">Alamat Klinik *</label>
                  <textarea id="reg-address" rows={2} className={inputCls} placeholder="Jalan, kelurahan, kota" value={reg.address} onChange={setRegField('address')} required />
                </div>
                <div>
                  <label className={labelCls} htmlFor="reg-clinic-email">Email Klinik (opsional)</label>
                  <input id="reg-clinic-email" type="email" className={inputCls} placeholder="info@klinikanda.id" value={reg.clinicEmail} onChange={setRegField('clinicEmail')} />
                </div>
              </fieldset>
              <fieldset className="space-y-3">
                <legend className="text-[11px] font-extrabold uppercase tracking-wider text-[#2F698B]">Akun Administrator</legend>
                <div>
                  <label className={labelCls} htmlFor="reg-admin-name">Nama Admin *</label>
                  <input id="reg-admin-name" className={inputCls} placeholder="Nama penanggung jawab" value={reg.adminName} onChange={setRegField('adminName')} required />
                </div>
                <div>
                  <label className={labelCls} htmlFor="reg-admin-email">Email Admin (untuk masuk) *</label>
                  <input id="reg-admin-email" type="email" className={inputCls} placeholder="admin@klinikanda.id" value={reg.adminEmail} onChange={setRegField('adminEmail')} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} htmlFor="reg-pass">Kata Sandi *</label>
                    <input id="reg-pass" type="password" autoComplete="new-password" className={inputCls} placeholder="Min. 8 karakter" value={reg.adminPassword} onChange={setRegField('adminPassword')} required />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="reg-pass2">Konfirmasi *</label>
                    <input id="reg-pass2" type="password" autoComplete="new-password" className={inputCls} placeholder="Ulangi kata sandi" value={reg.adminPassword2} onChange={setRegField('adminPassword2')} required />
                  </div>
                </div>
              </fieldset>
              {regError && (
                <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5" role="alert">{regError}</p>
              )}
              <button type="submit" disabled={regBusy}
                className="w-full py-3 rounded-xl font-extrabold text-sm text-[#17155E] transition disabled:opacity-60"
                style={{ background: 'linear-gradient(90deg, #84E488, #6BCE90)' }}>
                {regBusy ? 'Membuat ruang kerja…' : 'Buat Klinik & Masuk'}
              </button>
              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                Nomor izin & kode faskes bisa dilengkapi kemudian di Pengaturan Klinik.
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
