import React, { useState } from 'react';
import {
  Building2, Save, Download, CheckCircle2, RefreshCw, ImagePlus, Trash2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { APP_THEMES, themeById } from '../../lib/themes';
import { dataKey } from '../../lib/clinics';
import type { ClinicSettings } from '../../lib/settings';
import { ServerIntegrations } from './ServerIntegrations';
import { SubscriptionPanel } from './SubscriptionPanel';

// Pengaturan Klinik — semua konfigurasi klinik dalam satu halaman bertab.
// Pengaturan perilaku terhubung nyata ke modulnya (tarif → invoice, poli →
// pendaftaran, ambang kadaluarsa → farmasi, kebijakan sandi/sesi → login).
// Pengaturan integrasi (SATUSEHAT/BPJS/API) disimpan sebagai konfigurasi dan
// dilabeli jujur: koneksinya memerlukan backend.

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-clinical-500 focus:outline-none focus:ring-2 focus:ring-clinical-500/25';
const labelCls = 'block text-xs font-bold text-slate-600 mb-1';
const hintCls = 'text-[10px] text-slate-400 mt-1 leading-relaxed';

type TabId = 'profil' | 'tema' | 'operasional' | 'tarif' | 'farmasi' | 'dokumen' | 'keamanan' | 'notifikasi' | 'integrasi' | 'layanan' | 'langganan' | 'backup';

const TABS: { id: TabId; label: string }[] = [
  { id: 'profil', label: 'Profil Klinik' },
  { id: 'tema', label: 'Tema Warna' },
  { id: 'operasional', label: 'Operasional' },
  { id: 'tarif', label: 'Tarif & Kasir' },
  { id: 'farmasi', label: 'Farmasi' },
  { id: 'dokumen', label: 'Dokumen' },
  { id: 'keamanan', label: 'Keamanan' },
  { id: 'notifikasi', label: 'Notifikasi' },
  { id: 'integrasi', label: 'Integrasi' },
  { id: 'layanan', label: 'Cabang & Layanan' },
  { id: 'langganan', label: 'Langganan' },
  { id: 'backup', label: 'Backup Data' }
];

const PAYMENT_OPTIONS = ['Tunai', 'QRIS', 'Debit', 'Kredit', 'Transfer', 'BPJS'];

export const ClinicSettingsView: React.FC = () => {
  const {
    patients, medicalRecords, invoices, medicines, clinicProfile, updateClinicProfile,
    prescriptions, labOrders, radiologyOrders, certificates, queues, schedules,
    auditLogs, notifications, users, clinicId, settings, updateSettings
  } = useStore();

  const [tab, setTab] = useState<TabId>('profil');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const flashSaved = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // ---- Profil ----
  const [p, setP] = useState({
    clinicName: clinicProfile.clinicName,
    licenseNumber: clinicProfile.licenseNumber,
    faskesCode: clinicProfile.faskesCode,
    address: clinicProfile.address,
    phone: clinicProfile.phone,
    email: clinicProfile.email,
    directorName: clinicProfile.directorName,
    npwp: clinicProfile.npwp || '',
    facilityType: clinicProfile.facilityType || 'Klinik Pratama',
    accreditation: clinicProfile.accreditation || ''
  });
  const setPf = (k: keyof typeof p) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setP((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateClinicProfile({ ...clinicProfile, ...p });
    flashSaved();
  };

  const handleLogoFile = (file: File) => {
    if (file.size > 400 * 1024) {
      alert('Ukuran logo maksimal 400 KB agar penyimpanan perangkat tidak penuh.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateClinicProfile({ ...clinicProfile, logoDataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };

  // ---- Settings draft (semua tab berbagi satu draft) ----
  const [draft, setDraft] = useState<ClinicSettings>(settings);
  const setS = <K extends keyof ClinicSettings>(k: K, v: ClinicSettings[K]) =>
    setDraft((prev) => ({ ...prev, [k]: v }));
  const numField = (k: keyof ClinicSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setS(k, (parseInt(e.target.value, 10) || 0) as never);
  const saveSettings = () => {
    updateSettings(draft);
    flashSaved();
  };

  // ---- Backup / Restore ----
  const handleExportBackup = () => {
    const backupData = {
      app: 'rekammedis-web-id',
      version: 3,
      exportDate: new Date().toISOString(),
      facility: clinicProfile,
      settings,
      store: {
        patients, medicalRecords, medicines, invoices, prescriptions,
        labOrders, radiologyOrders, certificates, queues, schedules,
        auditLogs, notifications, users
      }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_rekammedis_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const handleRestoreBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const store = parsed.store || parsed;
        const keyMap: Record<string, string> = {
          patients: 'patients', medicalRecords: 'records', medicines: 'medicines',
          invoices: 'invoices', prescriptions: 'prescriptions', labOrders: 'lab_orders',
          radiologyOrders: 'radiology_orders', certificates: 'certificates', queues: 'queues',
          schedules: 'schedules', auditLogs: 'audit_logs', notifications: 'notifications', users: 'users'
        };
        let restored = 0;
        Object.entries(keyMap).forEach(([field, key]) => {
          if (Array.isArray(store[field])) {
            localStorage.setItem(dataKey(clinicId, key), JSON.stringify(store[field]));
            restored += 1;
          }
        });
        if (parsed.facility) localStorage.setItem(dataKey(clinicId, 'clinic_profile'), JSON.stringify(parsed.facility));
        if (parsed.settings) localStorage.setItem(dataKey(clinicId, 'settings'), JSON.stringify(parsed.settings));
        if (restored === 0) {
          setRestoreMsg('Berkas tidak dikenali sebagai backup RekamMedis — tidak ada data yang diubah.');
          return;
        }
        setRestoreMsg(`Restore berhasil (${restored} kelompok data). Halaman akan dimuat ulang…`);
        setTimeout(() => window.location.reload(), 1200);
      } catch {
        setRestoreMsg('Berkas backup tidak valid (JSON rusak) — tidak ada data yang diubah.');
      }
    };
    reader.readAsText(file);
  };

  const generateApiKey = () => {
    const key = `rm_live_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    setS('apiKey', key);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Pengaturan Klinik</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Seluruh konfigurasi {clinicProfile.clinicName} — identitas, operasional, tarif, keamanan, integrasi, dan data.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan berhasil disimpan!</span>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-bold transition ${tab === t.id ? 'bg-clinical-700 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-clinical-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profil' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <Card title="Identitas Fasilitas Kesehatan" subtitle="Tampil di kop surat resep, karcis antrean, invoice, dan surat keterangan medis">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {clinicProfile.logoDataUrl ? (
                  <img src={clinicProfile.logoDataUrl} alt="Logo klinik" className="w-16 h-16 rounded-xl object-contain bg-white border border-slate-200" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-clinical-50 border border-dashed border-clinical-300 flex items-center justify-center text-clinical-500">
                    <Building2 className="w-7 h-7" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-slate-700">Logo Klinik</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Dipakai di sidebar aplikasi dan kop dokumen. PNG/JPG, maks 400 KB.</p>
                  <div className="flex gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px] font-bold text-slate-700 cursor-pointer hover:bg-slate-50">
                      <ImagePlus className="w-3.5 h-3.5" /> Unggah Logo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); e.target.value = ''; }} />
                    </label>
                    {clinicProfile.logoDataUrl && (
                      <button type="button" onClick={() => updateClinicProfile({ ...clinicProfile, logoDataUrl: undefined })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white text-[11px] font-bold text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelCls}>Nama Klinik / Faskes</label><input className={inputCls} value={p.clinicName} onChange={setPf('clinicName')} required /></div>
                <div><label className={labelCls}>Jenis Fasilitas</label>
                  <select className={inputCls} value={p.facilityType} onChange={setPf('facilityType')}>
                    <option>Klinik Pratama</option><option>Klinik Utama</option><option>Puskesmas</option><option>Rumah Sakit</option><option>Praktik Mandiri</option>
                  </select></div>
                <div><label className={labelCls}>Nomor Izin Operasional</label><input className={inputCls} value={p.licenseNumber} onChange={setPf('licenseNumber')} placeholder="cth. 503/021/KOP-PELKES/2023" /></div>
                <div><label className={labelCls}>Kode Faskes (BPJS)</label><input className={inputCls} value={p.faskesCode} onChange={setPf('faskesCode')} placeholder="cth. 31710502" /></div>
                <div><label className={labelCls}>NPWP Klinik</label><input className={inputCls} value={p.npwp} onChange={setPf('npwp')} placeholder="00.000.000.0-000.000" /></div>
                <div><label className={labelCls}>Status Akreditasi</label><input className={inputCls} value={p.accreditation} onChange={setPf('accreditation')} placeholder="cth. Paripurna / Utama / Madya / Dasar" /></div>
                <div><label className={labelCls}>Telepon</label><input className={inputCls} value={p.phone} onChange={setPf('phone')} /></div>
                <div><label className={labelCls}>Email Resmi</label><input type="email" className={inputCls} value={p.email} onChange={setPf('email')} /></div>
                <div className="md:col-span-2"><label className={labelCls}>Penanggung Jawab / Direktur</label><input className={inputCls} value={p.directorName} onChange={setPf('directorName')} /></div>
                <div className="md:col-span-2"><label className={labelCls}>Alamat Lengkap</label><textarea rows={2} className={inputCls} value={p.address} onChange={setPf('address')} /></div>
              </div>
            </div>
          </Card>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>Simpan Profil</Button>
          </div>
        </form>
      )}

      {tab === 'tema' && (
        <Card title="Tema Warna Aplikasi" subtitle="Hanya mengganti warna — tata letak dan fitur tetap sama. Tersimpan per klinik dan langsung diterapkan. Tema bawaan mengikuti warna landing page RekamMedis.">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {APP_THEMES.map((t) => {
              const active = themeById(clinicProfile.theme).id === t.id;
              return (
                <button key={t.id} type="button" onClick={() => updateClinicProfile({ ...clinicProfile, theme: t.id })}
                  className={`text-left rounded-xl border-2 p-3 transition ${active ? 'border-clinical-600 bg-clinical-50' : 'border-slate-200 bg-white hover:border-slate-300'}`} aria-pressed={active}>
                  <span className="flex -space-x-1.5 mb-2">
                    {t.swatches.map((c) => (<span key={c} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ background: c }} />))}
                  </span>
                  <span className="block text-xs font-extrabold text-slate-800">{t.name}</span>
                  <span className="block text-[10px] text-slate-500 leading-snug mt-0.5">{t.description}</span>
                  {active && <span className="inline-block mt-2 text-[10px] font-bold text-clinical-700 bg-clinical-100 rounded-full px-2 py-0.5">Aktif</span>}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {tab === 'operasional' && (
        <Card title="Operasional Layanan" subtitle="Daftar poli aktif menyaring pilihan di Pendaftaran; jam & durasi menjadi acuan jadwal dan antrean">
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Poli yang Dibuka (satu per baris)</label>
              <textarea rows={4} className={inputCls} value={draft.poliList.join('\n')}
                onChange={(e) => setS('poliList', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} />
              <p className={hintCls}>Poli tetap hanya bisa dipilih bila ada dokter terdaftar untuk poli itu — pengaturan ini menentukan poli mana yang sedang dibuka klinik.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className={labelCls}>Jam Buka</label><input type="time" className={inputCls} value={draft.openTime} onChange={(e) => setS('openTime', e.target.value)} /></div>
              <div><label className={labelCls}>Jam Tutup</label><input type="time" className={inputCls} value={draft.closeTime} onChange={(e) => setS('closeTime', e.target.value)} /></div>
              <div><label className={labelCls}>Durasi Konsultasi (menit)</label><input type="number" min={1} className={inputCls} value={draft.consultDurationMin} onChange={numField('consultDurationMin')} /></div>
              <div><label className={labelCls}>Toleransi Terlambat (menit)</label><input type="number" min={0} className={inputCls} value={draft.lateToleranceMin} onChange={numField('lateToleranceMin')} /></div>
            </div>
            <div>
              <label className={labelCls}>Hari Libur (tanggal ISO, pisahkan koma)</label>
              <input className={inputCls} value={draft.holidays} onChange={(e) => setS('holidays', e.target.value)} placeholder="cth. 2026-12-25, 2027-01-01" />
            </div>
            <div className="flex justify-end"><Button type="button" variant="primary" onClick={saveSettings} leftIcon={<Save className="w-4 h-4" />}>Simpan Operasional</Button></div>
          </div>
        </Card>
      )}

      {tab === 'tarif' && (
        <Card title="Tarif & Kasir" subtitle="Biaya administrasi dan PPN di sini langsung dipakai saat kasir menerbitkan invoice dari kunjungan">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className={labelCls}>Biaya Administrasi per Invoice (Rp)</label><input type="number" min={0} className={inputCls} value={draft.adminFee} onChange={numField('adminFee')} /></div>
              <div><label className={labelCls}>Tarif Konsultasi Bawaan (Rp)</label><input type="number" min={0} className={inputCls} value={draft.defaultConsultFee} onChange={numField('defaultConsultFee')} /></div>
              <div><label className={labelCls}>PPN pada Invoice (%)</label><input type="number" min={0} max={100} className={inputCls} value={draft.taxPercent} onChange={numField('taxPercent')} />
                <p className={hintCls}>0 = invoice tanpa PPN. Bila diisi, baris PPN otomatis ditambahkan dari subtotal.</p></div>
              <div><label className={labelCls}>Diskon Maksimum oleh Kasir (%)</label><input type="number" min={0} max={100} className={inputCls} value={draft.maxDiscountPercent} onChange={numField('maxDiscountPercent')} /></div>
            </div>
            <div>
              <label className={labelCls}>Metode Pembayaran Aktif</label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_OPTIONS.map((m) => {
                  const on = draft.paymentMethods.includes(m);
                  return (
                    <button key={m} type="button" aria-pressed={on}
                      onClick={() => setS('paymentMethods', on ? draft.paymentMethods.filter((x) => x !== m) : [...draft.paymentMethods, m])}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${on ? 'bg-clinical-700 text-white border-clinical-700' : 'bg-white text-slate-500 border-slate-300'}`}>
                      {m}
                    </button>
                  );
                })}
              </div>
              <p className={hintCls}>Pilihan ini menentukan metode yang muncul di jendela pembayaran kasir.</p>
            </div>
            <div className="flex justify-end"><Button type="button" variant="primary" onClick={saveSettings} leftIcon={<Save className="w-4 h-4" />}>Simpan Tarif</Button></div>
          </div>
        </Card>
      )}

      {tab === 'farmasi' && (
        <Card title="Farmasi" subtitle="Ambang peringatan kadaluarsa dipakai panel Farmasi; stok minimum bawaan dipakai saat menambah obat baru">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className={labelCls}>Peringatan Kadaluarsa (hari sebelumnya)</label><input type="number" min={1} className={inputCls} value={draft.expiryWarningDays} onChange={numField('expiryWarningDays')} /></div>
              <div><label className={labelCls}>Stok Minimum Bawaan Obat Baru</label><input type="number" min={0} className={inputCls} value={draft.defaultMinimumStock} onChange={numField('defaultMinimumStock')} /></div>
              <div><label className={labelCls}>Margin Harga Jual Bawaan (%)</label><input type="number" min={0} className={inputCls} value={draft.defaultMarginPercent} onChange={numField('defaultMarginPercent')} />
                <p className={hintCls}>Acuan saat menetapkan harga jual obat baru; harga per obat tetap diatur di data obat masing-masing.</p></div>
            </div>
            <div className="flex justify-end"><Button type="button" variant="primary" onClick={saveSettings} leftIcon={<Save className="w-4 h-4" />}>Simpan Farmasi</Button></div>
          </div>
        </Card>
      )}

      {tab === 'dokumen' && (
        <Card title="Rekam Medis & Dokumen" subtitle="Awalan nomor dipakai penomoran otomatis; teks persetujuan tampil di formulir pendaftaran">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className={labelCls}>Awalan Nomor Rekam Medis</label><input className={inputCls} value={draft.mrPrefix} onChange={(e) => setS('mrPrefix', e.target.value)} />
                <p className={hintCls}>Format: {draft.mrPrefix || 'RM'}-{new Date().getFullYear()}-0001</p></div>
              <div><label className={labelCls}>Awalan Nomor Invoice</label><input className={inputCls} value={draft.invoicePrefix} onChange={(e) => setS('invoicePrefix', e.target.value)} /></div>
              <div><label className={labelCls}>Masa Retensi Rekam Medis (tahun)</label><input type="number" min={1} className={inputCls} value={draft.retentionYears} onChange={numField('retentionYears')} /></div>
            </div>
            <div><label className={labelCls}>Teks Persetujuan Pasien (tampil saat pendaftaran)</label>
              <textarea rows={3} className={inputCls} value={draft.consentText} onChange={(e) => setS('consentText', e.target.value)} /></div>
            <div><label className={labelCls}>Catatan Kaki Surat & Dokumen Resmi</label>
              <textarea rows={2} className={inputCls} value={draft.letterFooter} onChange={(e) => setS('letterFooter', e.target.value)} /></div>
            <div className="flex justify-end"><Button type="button" variant="primary" onClick={saveSettings} leftIcon={<Save className="w-4 h-4" />}>Simpan Dokumen</Button></div>
          </div>
        </Card>
      )}

      {tab === 'keamanan' && (
        <Card title="Keamanan & Akun" subtitle="Kebijakan ini ditegakkan nyata: panjang sandi saat ganti/buat akun, durasi sesi, dan kunci anti brute-force saat masuk">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className={labelCls}>Panjang Minimum Kata Sandi</label><input type="number" min={6} max={32} className={inputCls} value={draft.passwordMinLength} onChange={numField('passwordMinLength')} /></div>
              <div><label className={labelCls}>Durasi Sesi (jam, tanpa "ingat saya")</label><input type="number" min={1} className={inputCls} value={draft.sessionHours} onChange={numField('sessionHours')} /></div>
              <div><label className={labelCls}>Durasi "Ingat Saya" (hari)</label><input type="number" min={1} className={inputCls} value={draft.rememberDays} onChange={numField('rememberDays')} /></div>
              <div><label className={labelCls}>Percobaan Masuk Maksimum</label><input type="number" min={3} className={inputCls} value={draft.maxLoginAttempts} onChange={numField('maxLoginAttempts')} /></div>
              <div><label className={labelCls}>Kunci Formulir Setelah Gagal (menit)</label><input type="number" min={1} className={inputCls} value={draft.lockMinutes} onChange={numField('lockMinutes')} /></div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
              Catatan: penegakan di sini berjalan di perangkat (sisi klien). Untuk produksi, kebijakan yang sama wajib ditegakkan di server, ditambah 2FA dan tanda tangan elektronik dokter.
            </p>
            <div className="flex justify-end"><Button type="button" variant="primary" onClick={saveSettings} leftIcon={<Save className="w-4 h-4" />}>Simpan Keamanan</Button></div>
          </div>
        </Card>
      )}

      {tab === 'notifikasi' && (
        <Card title="Notifikasi & Template Pesan" subtitle="Template tersimpan dan bisa diedit; pengiriman WhatsApp/SMS memerlukan gateway di backend — saat ini belum terkirim otomatis">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input type="checkbox" className="w-4 h-4 accent-clinical-600" checked={draft.notificationsEnabled} onChange={(e) => setS('notificationsEnabled', e.target.checked)} />
              Notifikasi dalam aplikasi aktif
            </label>
            <div><label className={labelCls}>Template Panggilan Antrean</label>
              <input className={inputCls} value={draft.queueCallTemplate} onChange={(e) => setS('queueCallTemplate', e.target.value)} />
              <p className={hintCls}>Variabel: {'{nomor}'} {'{nama}'} {'{poli}'}</p></div>
            <div><label className={labelCls}>Template Pengingat Jadwal (untuk gateway nanti)</label>
              <textarea rows={2} className={inputCls} value={draft.reminderTemplate} onChange={(e) => setS('reminderTemplate', e.target.value)} />
              <p className={hintCls}>Variabel: {'{nama}'} {'{klinik}'} {'{tanggal}'}</p></div>
            <div className="flex justify-end"><Button type="button" variant="primary" onClick={saveSettings} leftIcon={<Save className="w-4 h-4" />}>Simpan Notifikasi</Button></div>
          </div>
        </Card>
      )}

      {tab === 'integrasi' && (<>
        <ServerIntegrations />
        <Card title="Integrasi SATUSEHAT, BPJS & API" subtitle="Konfigurasi tersimpan di perangkat ini. Status koneksi: BELUM TERHUBUNG — pertukaran data sungguhan memerlukan backend agar kredensial tidak terekspos di browser">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelCls}>SATUSEHAT — Organization ID</label><input className={inputCls} value={draft.satusehatOrgId} onChange={(e) => setS('satusehatOrgId', e.target.value)} placeholder="ID organisasi faskes di SATUSEHAT" /></div>
              <div><label className={labelCls}>SATUSEHAT — Environment</label>
                <select className={inputCls} value={draft.satusehatEnv} onChange={(e) => setS('satusehatEnv', e.target.value as ClinicSettings['satusehatEnv'])}>
                  <option value="sandbox">Sandbox (uji coba)</option>
                  <option value="production">Production</option>
                </select></div>
              <div><label className={labelCls}>BPJS — Cons ID (P-Care)</label><input className={inputCls} value={draft.bpjsConsId} onChange={(e) => setS('bpjsConsId', e.target.value)} placeholder="Consumer ID bridging P-Care" /></div>
              <div><label className={labelCls}>Webhook URL (pemberitahuan kejadian)</label><input className={inputCls} value={draft.webhookUrl} onChange={(e) => setS('webhookUrl', e.target.value)} placeholder="https://…" /></div>
            </div>
            <div>
              <label className={labelCls}>Kunci API Klinik</label>
              <div className="flex gap-2">
                <input className={inputCls} value={draft.apiKey} readOnly placeholder="Belum dibuat" />
                <Button type="button" variant="outline" size="sm" onClick={generateApiKey} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                  {draft.apiKey ? 'Buat Ulang' : 'Buat Kunci'}
                </Button>
              </div>
              <p className={hintCls}>Kunci ini untuk integrasi sistem lain setelah backend tersedia. Perlakukan seperti kata sandi — jangan dibagikan sembarangan.</p>
            </div>
            <div className="flex justify-end"><Button type="button" variant="primary" onClick={saveSettings} leftIcon={<Save className="w-4 h-4" />}>Simpan Integrasi</Button></div>
          </div>
        </Card>
      </>)}


      {tab === 'layanan' && (
        <Card title="Cabang, Portal Pasien & Layanan Lanjutan" subtitle="Pengaturan arah jangka panjang klinik — tersimpan per klinik; sebagian berlaku setelah modulnya aktif">
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Cabang / Unit Layanan (satu per baris)</label>
              <textarea rows={3} className={inputCls} value={draft.branches.join('\n')}
                onChange={(e) => setS('branches', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))}
                placeholder={'Klinik Pusat — Jakarta\nKlinik Cabang — Depok'} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelCls}>Paket Langganan Saat Ini</label><input className={inputCls} value={draft.planName} readOnly />
                <p className={hintCls}>Ditetapkan dari sisi platform RekamMedis, bukan oleh klinik.</p></div>
              <div><label className={labelCls}>Kuota Pendaftaran Online (% dari total antrean)</label><input type="number" min={0} max={100} className={inputCls} value={draft.onlineQuotaPercent} onChange={numField('onlineQuotaPercent')} /></div>
              <div><label className={labelCls}>Tarif Telemedicine (Rp)</label><input type="number" min={0} className={inputCls} value={draft.telemedicineFee} onChange={numField('telemedicineFee')} /></div>
            </div>
            <div className="space-y-2.5">
              {([
                ['onlineRegistrationEnabled', 'Pendaftaran Online oleh Pasien', 'Pasien dapat mendaftar & mengambil antrean dari portal pasien (modul portal menyusul).'],
                ['telemedicineEnabled', 'Telemedicine', 'Konsultasi video terjadwal dengan tarif di atas (modul video menyusul).'],
                ['aiAssistEnabled', 'Bantuan AI Klinis', 'Saran pemeriksaan interaksi obat & pengingat klinis saat peresepan (memerlukan backend AI).']
              ] as [keyof ClinicSettings, string, string][]).map(([k, title, desc]) => (
                <label key={k} className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 mt-0.5 accent-clinical-600" checked={Boolean(draft[k])} onChange={(e) => setS(k, e.target.checked as never)} />
                  <span>
                    <span className="block text-xs font-bold text-slate-800">{title}</span>
                    <span className="block text-[11px] text-slate-500 leading-relaxed">{desc}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-end"><Button type="button" variant="primary" onClick={saveSettings} leftIcon={<Save className="w-4 h-4" />}>Simpan Layanan</Button></div>
          </div>
        </Card>
      )}

      {tab === 'langganan' && (
        <Card title="Langganan RekamMedis" subtitle="Paket layanan klinik Anda pada platform RekamMedis">
          <SubscriptionPanel />
        </Card>
      )}

      {tab === 'backup' && (
        <Card title="Pencadangan & Pemulihan Data" subtitle="Unduh salinan SELURUH data klinik ini dalam format JSON. Berkas tidak terenkripsi dan memuat data medis sensitif — simpan di lokasi aman. Backup otomatis terjadwal memerlukan backend.">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleExportBackup} leftIcon={<Download className="w-4 h-4 text-slate-700" />}>
                Unduh File Backup (.JSON)
              </Button>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                Pulihkan dari Backup
                <input type="file" accept="application/json,.json" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRestoreBackup(f); e.target.value = ''; }} />
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              Isi backup: {patients.length} pasien • {medicalRecords.length} rekam medis • {invoices.length} invoice • {medicines.length} obat • pengaturan & profil klinik ini.
              Restore menulis ke ruang data klinik yang sedang aktif.
            </p>
            {restoreMsg && (
              <p className="text-[11px] font-semibold text-clinical-800 bg-clinical-50 border border-clinical-200 rounded-lg px-3 py-2" role="status">{restoreMsg}</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
