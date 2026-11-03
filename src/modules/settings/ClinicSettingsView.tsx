import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Save,
  Download,
  Database,
  CheckCircle2,
  Lock,
  FileCheck
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const ClinicSettingsView: React.FC = () => {
  const {
    patients, medicalRecords, invoices, medicines, clinicProfile, updateClinicProfile,
    prescriptions, labOrders, radiologyOrders, certificates, queues, schedules,
    auditLogs, notifications, users
  } = useStore();
  const [clinicName, setClinicName] = useState(clinicProfile.clinicName);
  const [licenseNumber, setLicenseNumber] = useState(clinicProfile.licenseNumber);
  const [faskesCode, setFaskesCode] = useState(clinicProfile.faskesCode);
  const [address, setAddress] = useState(clinicProfile.address);
  const [phone, setPhone] = useState(clinicProfile.phone);
  const [email, setEmail] = useState(clinicProfile.email);
  const [directorName, setDirectorName] = useState(clinicProfile.directorName);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateClinicProfile({ clinicName, licenseNumber, faskesCode, address, phone, email, directorName });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Export JSON Backup — seluruh entitas data aplikasi.
  // CATATAN: berkas ini JSON polos TANPA enkripsi dan memuat data medis sensitif.
  // Simpan di lokasi aman; jangan kirim lewat kanal yang tidak terproteksi.
  const handleExportBackup = () => {
    const backupData = {
      app: 'rekammedis-web-id',
      version: 3,
      exportDate: new Date().toISOString(),
      facility: clinicProfile,
      store: {
        patients, medicalRecords, medicines, invoices, prescriptions,
        labOrders, radiologyOrders, certificates, queues, schedules,
        auditLogs, notifications, users
      }
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_rekammedis_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);

  // Restore: tulis kembali seluruh kunci data lokal dari berkas backup, lalu muat ulang.
  const handleRestoreBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const store = parsed.store || parsed;
        const keyMap: Record<string, string> = {
          patients: 'patients',
          medicalRecords: 'records',
          medicines: 'medicines',
          invoices: 'invoices',
          prescriptions: 'prescriptions',
          labOrders: 'lab_orders',
          radiologyOrders: 'radiology_orders',
          certificates: 'certificates',
          queues: 'queues',
          schedules: 'schedules',
          auditLogs: 'audit_logs',
          notifications: 'notifications',
          users: 'users'
        };
        let restored = 0;
        Object.entries(keyMap).forEach(([field, key]) => {
          if (Array.isArray(store[field])) {
            localStorage.setItem(`tongfang_v3_${key}`, JSON.stringify(store[field]));
            restored += 1;
          }
        });
        if (parsed.facility) {
          localStorage.setItem('tongfang_v3_clinic_profile', JSON.stringify(parsed.facility));
        }
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Pengaturan Fasilitas Kesehatan & Konfigurasi EMR
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Identitas faskes untuk kop surat resmi resep/dokumen medis, tarif dasar, dan backup basis data.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan fasilitas kesehatan berhasil disimpan!</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <Card
          title="Profil Fasilitas Kesehatan (Klinik / Rumah Sakit)"
          subtitle="Informasi ini dicantumkan pada kop surat resep, karcis antrean, dan surat keterangan medis"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nama Fasilitas Kesehatan"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                requiredIndicator
              />
              <Input
                label="Nomor Izin Operasional Klinik"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                requiredIndicator
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Kode Faskes Nasional (Kemenkes / BPJS)"
                value={faskesCode}
                onChange={(e) => setFaskesCode(e.target.value)}
                requiredIndicator
              />
              <Input
                label="Nomor Telepon Faskes"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Email Resmi"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Input
              label="Alamat Lengkap Faskes"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              requiredIndicator
            />

            <Input
              label="Dokter Penanggung Jawab Klinis (Direktur Klinik)"
              value={directorName}
              onChange={(e) => setDirectorName(e.target.value)}
              requiredIndicator
            />
          </div>
        </Card>

        {/* Database Backup Section */}
        <Card
          title="Pencadangan Basis Data Medis (Database Backup)"
          subtitle="Unduh salinan SELURUH data aplikasi dalam format JSON. Berkas ini tidak terenkripsi dan memuat data medis sensitif — simpan di lokasi yang aman."
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-0.5">
                <Database className="w-4 h-4 text-clinical-600" />
                Snapshot Basis Data Lokal Terkini
              </span>
              <p className="text-slate-500 text-[11px]">
                {patients.length} Pasien &bull; {medicalRecords.length} Rekam Medis &bull; {medicines.length} Obat Farmasi
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportBackup}
                leftIcon={<Download className="w-4 h-4 text-slate-700" />}
              >
                Unduh File Backup (.JSON)
              </Button>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                Pulihkan dari Backup
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleRestoreBackup(f);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
          {restoreMsg && (
            <p className="mt-3 text-[11px] font-semibold text-clinical-800 bg-clinical-50 border border-clinical-200 rounded-lg px-3 py-2" role="status">
              {restoreMsg}
            </p>
          )}
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<Save className="w-4 h-4 text-white" />}
          >
            Simpan Perubahan Profil
          </Button>
        </div>
      </form>
    </div>
  );
};

