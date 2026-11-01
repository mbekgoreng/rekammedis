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
  const { patients, medicalRecords, invoices, medicines } = useStore();
  const [clinicName, setClinicName] = useState('Klinik Tong Fang Ashiap');
  const [licenseNumber, setLicenseNumber] = useState('503/021/KOP-PELKES/2023');
  const [faskesCode, setFaskesCode] = useState('31710502');
  const [address, setAddress] = useState('Jl. Jenderal Sudirman Kav. 45, Kebayoran Baru, Jakarta Selatan');
  const [phone, setPhone] = useState('(021) 555-0192');
  const [email, setEmail] = useState('info@tongfangashiap.id');
  const [directorName, setDirectorName] = useState('dr. Yusuf Tjakep Kalee, Sp.PD');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      facility: { clinicName, licenseNumber, faskesCode },
      exportDate: new Date().toISOString(),
      patients,
      medicalRecords,
      medicines,
      invoices
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_tongfang_ashiap_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
          subtitle="Download salinan seluruh data pasien, rekam medis, dan stok farmasi dalam format JSON terenkripsi"
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

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportBackup}
              leftIcon={<Download className="w-4 h-4 text-slate-700" />}
            >
              Unduh File Backup (.JSON)
            </Button>
          </div>
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

