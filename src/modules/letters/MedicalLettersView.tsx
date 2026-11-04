import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Printer,
  FileText,
  Building2,
  Calendar,
  UserCheck
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { MedicalCertificate } from '../../types';

/** Terbilang Bahasa Indonesia untuk angka hari istirahat (cukup 1–99). */
const SATUAN = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
export const terbilang = (n: number): string => {
  if (!Number.isFinite(n) || n <= 0) return String(n);
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${terbilang(n - 10)} Belas`;
  if (n < 100) {
    const sisa = n % 10;
    return `${terbilang(Math.floor(n / 10))} Puluh${sisa ? ` ${terbilang(sisa)}` : ''}`;
  }
  return String(n);
};

export const MedicalLettersView: React.FC = () => {
  const { certificates, patients, currentUser, createCertificate, clinicProfile } = useStore();
  // Penerbitan surat medis adalah tindakan dokter — peran lain hanya melihat daftar & pratinjau.
  const isDoctor = currentUser.role === 'doctor';
  const [selectedCert, setSelectedCert] = useState<MedicalCertificate | null>(certificates[0] || null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New certificate state
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [certType, setCertType] = useState<MedicalCertificate['type']>('Surat Keterangan Sakit');
  const [durationDays, setDurationDays] = useState(3);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [diagnosisText, setDiagnosisText] = useState('Cephalgia & Febris');
  const [purpose, setPurpose] = useState('Persyaratan Melamar Pekerjaan');
  const [referralHospital, setReferralHospital] = useState('RSUP Dr. Cipto Mangunkusumo');
  const [referralReason, setReferralReason] = useState('Pemeriksaan penunjang lanjutan CT-Scan');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const p = patients.find((pat) => pat.id === selectedPatientId);
    if (!p) return;

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays - 1);
    const endDateStr = end.toISOString().split('T')[0];

    const created = createCertificate({
      patientId: p.id,
      patientName: p.name,
      mrNumber: p.mrNumber,
      patientAge: p.age,
      patientGender: p.gender,
      patientAddress: p.address,
      doctorName: currentUser.name,
      doctorSip: currentUser.sipNumber || 'SIP.503/442.1/DOKTER/2024',
      type: certType,
      startDate:
        certType === 'Surat Keterangan Sakit' || certType === 'Surat Kontrol Ulang' ? startDate : undefined,
      endDate: certType === 'Surat Keterangan Sakit' ? endDateStr : undefined,
      durationDays: certType === 'Surat Keterangan Sakit' ? durationDays : undefined,
      diagnosis: diagnosisText,
      purpose: certType === 'Surat Keterangan Berbadan Sehat' ? purpose : undefined,
      referralHospital: certType === 'Surat Rujukan' ? referralHospital : undefined,
      referralReason: certType === 'Surat Rujukan' ? referralReason : undefined,
      notes: `Diterbitkan resmi oleh ${currentUser.name}`
    });

    setSelectedCert(created);
    setIsNewModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Generator Surat Keterangan & Rujukan Medis
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Penerbitan surat istirahat sakit, surat sehat, rujukan antar fasilitas, dan resume medis resmi.
          </p>
        </div>

        {isDoctor ? (
          <Button
            variant="primary"
            onClick={() => setIsNewModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4 text-white" />}
          >
            Terbitkan Surat Medis Baru
          </Button>
        ) : (
          <p className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 max-w-xs">
            Penerbitan surat medis hanya dapat dilakukan oleh dokter. Anda dapat melihat
            daftar dan pratinjau surat yang sudah diterbitkan.
          </p>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Certificate List (1 Col) */}
        <div className="space-y-3">
          {certificates.map((c) => {
            const isSelected = selectedCert?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCert(c)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-clinical-50/80 border-clinical-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-xs text-slate-900">{c.type}</span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                    {c.certificateNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-semibold">{c.patientName}</p>
                <div className="flex justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                  <span>{c.issueDate}</span>
                  <span className="font-sans">{c.doctorName}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Printable Official Certificate (2 Cols) */}
        <div className="lg:col-span-2">
          {selectedCert ? (
            <Card
              title={selectedCert.type}
              subtitle={`Nomor: ${selectedCert.certificateNumber}`}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                >
                  Cetak Dokumen Resmi (PDF)
                </Button>
              }
            >
              {/* Paper Sheet Preview */}
              <div className="p-8 bg-white border border-slate-300 rounded-xl space-y-6 font-sans text-xs text-slate-800 shadow-inner max-w-2xl mx-auto">
                {/* Official Letterhead (KOP SURAT) */}
                <div className="text-center border-b-2 border-slate-900 pb-4">
                  <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                    {clinicProfile.clinicName || 'KLINIK TONG FANG ASHIAP'}
                  </h2>
                  <p className="text-[11px] text-slate-600">
                    Izin Operasional No: {clinicProfile.licenseNumber || '503/021/KOP-PELKES/2023'} &bull; Kode Faskes: {clinicProfile.faskesCode || '31710502'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {clinicProfile.address || 'Jl. Jenderal Sudirman Kav. 45, Kebayoran Baru, Jakarta Selatan'} &bull; Telp: {clinicProfile.phone || '(021) 555-0192'} &bull; {clinicProfile.email || 'info@tongfangashiap.id'}
                  </p>
                </div>

                {/* Document Title */}
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 underline underline-offset-4">
                    {selectedCert.type}
                  </h3>
                  <p className="font-mono text-[11px] text-slate-600">
                    Nomor: {selectedCert.certificateNumber}
                  </p>
                </div>

                {/* Doctor Opening Statement */}
                <p className="leading-relaxed">
                  Yang bertanda tangan di bawah ini, Dokter Pemeriksa pada {(clinicProfile.clinicName || 'Klinik Tong Fang Ashiap').toUpperCase()}, menerangkan dengan sebenarnya bahwa:
                </p>

                {/* Patient Information Table */}
                <div className="pl-6 space-y-1.5 text-xs">
                  <div className="grid grid-cols-4">
                    <span className="text-slate-600">Nama Lengkap</span>
                    <strong className="col-span-3 text-slate-900">: {selectedCert.patientName}</strong>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="text-slate-600">No. Rekam Medis</span>
                    <span className="col-span-3 font-mono">: {selectedCert.mrNumber}</span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="text-slate-600">Umur / Jenis Kelamin</span>
                    <span className="col-span-3">: {selectedCert.patientAge} Tahun / {selectedCert.patientGender}</span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="text-slate-600">Alamat Domisili</span>
                    <span className="col-span-3">: {selectedCert.patientAddress}</span>
                  </div>
                </div>

                {/* Specific Certificate Body Content */}
                {selectedCert.type === 'Surat Keterangan Sakit' && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed text-xs space-y-2">
                    <p>
                      Berdasarkan hasil pemeriksaan klinis yang telah dilakukan, pasien tersebut di atas dalam kondisi <strong className="text-slate-900">SAKIT</strong> sehingga memerlukan istirahat fisik selama:
                    </p>
                    <p className="font-bold text-sm text-slate-900 text-center py-2 bg-white rounded border border-slate-200 font-mono">
                      {selectedCert.durationDays} ({terbilang(selectedCert.durationDays ?? 0)}) Hari
                    </p>
                    <p className="text-center text-slate-700">
                      Terhitung mulai tanggal <strong>{selectedCert.startDate}</strong> sampai dengan <strong>{selectedCert.endDate}</strong>.
                    </p>
                  </div>
                )}

                {selectedCert.type === 'Surat Keterangan Berbadan Sehat' && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed text-xs space-y-2">
                    <p>
                      Setelah dilakukan pemeriksaan fisik diagnostik yang teliti, yang bersangkutan dinyatakan dalam keadaan <strong className="text-emerald-800">SEHAT JASMANI DAN ROHANI</strong>.
                    </p>
                    <p>
                      Surat keterangan ini diberikan untuk: <strong>{selectedCert.purpose || 'Keperluan Administrasi'}</strong>.
                    </p>
                  </div>
                )}

                {selectedCert.type === 'Surat Kontrol Ulang' && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed text-xs space-y-2">
                    <p>
                      Berdasarkan hasil pemeriksaan yang telah dilakukan
                      {selectedCert.diagnosis ? (
                        <> dengan diagnosis <strong className="text-slate-900">{selectedCert.diagnosis}</strong></>
                      ) : null}
                      , pasien tersebut di atas diminta untuk <strong className="text-slate-900">kontrol kembali</strong> guna evaluasi lanjutan terhadap hasil pengobatan dan perkembangan kondisi kesehatannya.
                    </p>
                    <p className="text-center text-slate-700">
                      Tanggal kontrol kembali: <strong>{selectedCert.startDate || selectedCert.issueDate}</strong>
                    </p>
                    <p>
                      Pasien diharapkan membawa surat keterangan ini beserta hasil pemeriksaan penunjang sebelumnya pada saat kontrol.
                    </p>
                  </div>
                )}

                {selectedCert.type === 'Surat Rujukan' && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed text-xs space-y-2">
                    <p>
                      Mohon pemeriksaan dan penanganan lebih lanjut terhadap penderita tersebut di atas kepada:
                    </p>
                    <div className="pl-4 font-semibold text-slate-900">
                      Yth. Dokter Spesialis di {selectedCert.referralHospital}
                    </div>
                    <p>
                      <strong>Diagnosa Sementara:</strong> {selectedCert.diagnosis}
                    </p>
                    <p>
                      <strong>Alasan Rujukan:</strong> {selectedCert.referralReason}
                    </p>
                  </div>
                )}

                {/* Closing */}
                <p className="leading-relaxed">
                  Demikian surat keterangan ini kami terbitkan dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.
                </p>

                {/* Date and Signature */}
                <div className="pt-8 flex justify-end">
                  <div className="text-center min-w-[200px] space-y-1">
                    <p className="text-slate-600">Jakarta, {selectedCert.issueDate}</p>
                    <p className="text-slate-600 font-semibold mb-12">Dokter Pemeriksa,</p>
                    <div className="h-12" />
                    <p className="font-bold text-slate-900 border-t border-slate-800 pt-1">
                      {selectedCert.doctorName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      SIP: {selectedCert.doctorSip}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-12 text-slate-400 text-xs">
                Pilih surat medis di samping untuk melihat preview lembaran resmi.
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Letter Modal — hanya dirender untuk dokter */}
      {isDoctor && (
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Terbitkan Surat Medis Baru"
        subtitle="Pilih template surat resmi dan lengkapi rincian keterangan klinis"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsNewModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              Terbitkan Surat
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Pasien</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.mrNumber} - {p.name} ({p.gender}, {p.age} thn)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Jenis Surat Medis</label>
            <select
              value={certType}
              onChange={(e) => setCertType(e.target.value as MedicalCertificate['type'])}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
            >
              <option value="Surat Keterangan Sakit">Surat Keterangan Sakit (Istirahat)</option>
              <option value="Surat Keterangan Berbadan Sehat">Surat Keterangan Berbadan Sehat</option>
              <option value="Surat Rujukan">Surat Rujukan Rumah Sakit / Faskes Lanjutan</option>
              <option value="Surat Kontrol Ulang">Surat Keterangan Kontrol Ulang</option>
            </select>
          </div>

          {certType === 'Surat Keterangan Sakit' && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Lama Istirahat (Hari)"
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
              />
              <Input
                label="Tanggal Mulai Istirahat"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          )}

          {certType === 'Surat Kontrol Ulang' && (
            <Input
              label="Tanggal Kontrol Kembali"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          )}

          {certType === 'Surat Keterangan Berbadan Sehat' && (
            <Input
              label="Keperluan Surat"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Contoh: Melamar Pekerjaan BUMN, Pendaftaran Universitas..."
            />
          )}

          {certType === 'Surat Rujukan' && (
            <div className="space-y-2">
              <Input
                label="Rumah Sakit / Faskes Tujuan Rujukan"
                value={referralHospital}
                onChange={(e) => setReferralHospital(e.target.value)}
              />
              <Input
                label="Alasan Rujukan Medis"
                value={referralReason}
                onChange={(e) => setReferralReason(e.target.value)}
              />
            </div>
          )}

          <Input
            label="Diagnosis Medis"
            value={diagnosisText}
            onChange={(e) => setDiagnosisText(e.target.value)}
          />
        </form>
      </Modal>
      )}
    </div>
  );
};

