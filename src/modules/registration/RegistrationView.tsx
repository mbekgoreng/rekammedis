import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  CheckCircle2,
  Printer,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { PatientFormModal } from '../patients/PatientFormModal';
import { Patient, QueueItem } from '../../types';

interface RegistrationViewProps {
  /** Pasien serah-terima dari daftar/detail pasien (pola sama seperti ExaminationView). */
  selectedPatientId?: string;
  onNavigate: (module: string) => void;
  onSelectPatient: (patientId: string) => void;
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  selectedPatientId,
  onNavigate,
  onSelectPatient
}) => {
  const {
    patients,
    schedules,
    queues,
    addQueue,
    addPatient,
    currentUser,
    settings
  } = useStore();

  // Handoff: bila dibuka dari daftar/detail pasien, pasien itu langsung terpilih.
  // Dibuka langsung dari menu → selectedPatientId kosong → perilaku normal (cari manual).
  const handoffPatient = selectedPatientId
    ? patients.find((p) => p.id === selectedPatientId) ?? null
    : null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(handoffPatient);
  const [selectedDepartment, setSelectedDepartment] = useState('Poli Umum');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [visitType, setVisitType] = useState<'Baru' | 'Kontrol Rutin' | 'Rujukan' | 'Darurat'>('Kontrol Rutin');
  const [insuranceType, setInsuranceType] = useState<Patient['insuranceType']>(
    handoffPatient?.insuranceType ?? 'BPJS Kesehatan'
  );
  const [priority, setPriority] = useState<'Biasa' | 'Lansia/Disabilitas' | 'Darurat / Cito'>(
    handoffPatient && handoffPatient.age >= 60 ? 'Lansia/Disabilitas' : 'Biasa'
  );
  const [complaint, setComplaint] = useState('');

  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [registeredQueue, setRegisteredQueue] = useState<QueueItem | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);

  // Filter patients by query
  const filteredPatients = searchQuery.trim()
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.mrNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.nik.includes(searchQuery) ||
          p.phone.includes(searchQuery)
      )
    : [];

  // Available departments — hanya poli yang benar-benar memiliki dokter praktik.
  // (Poli Bedah & Poli Gigi tidak ditawarkan sampai dokternya terdaftar di sistem,
  // agar karcis antrean tidak menampilkan dokter yang salah.)
  const allDepartments = [
    { value: 'Poli Penyakit Dalam', label: 'Poli Penyakit Dalam (dr. Yusuf Tjakep Kalee, Sp.PD)' },
    { value: 'Poli Gizi & Spesialis', label: 'Poli Gizi & Spesialis (dr. Avivien Slebew, Sp.G)' },
    { value: 'Poli Umum', label: 'Poli Umum (Prabowo Jokowow, S teh dua gelas)' }
  ];
  // Daftar poli yang aktif diatur di Pengaturan → Operasional.
  // Hanya poli yang memiliki dokter terdaftar yang bisa dipilih; pengaturan
  // menyaring poli mana yang sedang dibuka klinik.
  const departments = settings.poliList.length > 0
    ? allDepartments.filter((d) =>
        settings.poliList.some((p) => {
          const token = p.replace(/^Poli\s+/i, '').split(' ')[0];
          return token.length > 0 && d.value.toLowerCase().includes(token.toLowerCase());
        })
      )
    : allDepartments;
  const visibleDepartments = departments.length > 0 ? departments : allDepartments;

  // Select patient
  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setInsuranceType(p.insuranceType);
    setSearchQuery('');
    if (p.age >= 60) setPriority('Lansia/Disabilitas');
  };

  const handleCreateNewPatient = (data: Omit<Patient, 'id' | 'mrNumber' | 'registeredAt'>) => {
    // Cegah duplikat: NIK yang sama tidak boleh menjadi dua rekam medis
    const existing = patients.find((p) => p.nik === data.nik);
    if (existing) {
      handleSelectPatient(existing);
      setIsNewPatientModalOpen(false);
      setFormNotice(
        `NIK ${data.nik} sudah terdaftar atas nama ${existing.name} (${existing.mrNumber}). Data lama dipakai — tidak dibuat duplikat.`
      );
      return;
    }
    const newP = addPatient(data);
    handleSelectPatient(newP);
    setIsNewPatientModalOpen(false);
    setFormNotice(null);
  };

  // Submit registration
  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setFormNotice(null);

    // Cegah antrian ganda: pasien yang masih aktif mengantre tidak didaftarkan lagi
    const activeQueue = queues.find(
      (q) =>
        q.patientId === selectedPatient.id &&
        (q.status === 'Menunggu' || q.status === 'Dipanggil' || q.status === 'Sedang Diperiksa')
    );
    if (activeQueue) {
      setFormNotice(
        `${selectedPatient.name} masih memiliki antrian aktif ${activeQueue.queueNumber} (${activeQueue.status}) di ${activeQueue.department}. Selesaikan atau batalkan antrian tersebut sebelum mendaftar lagi.`
      );
      return;
    }

    // Determine doctor
    let doctorName = 'Prabowo Jokowow, S teh dua gelas';
    let docId = 'u-3';

    if (selectedDepartment === 'Poli Penyakit Dalam') {
      doctorName = 'dr. Yusuf Tjakep Kalee, Sp.PD';
      docId = 'u-1';
    } else if (selectedDepartment === 'Poli Gizi & Spesialis') {
      doctorName = 'dr. Avivien Slebew, Sp.G';
      docId = 'u-2';
    }

    // Validasi kuota jadwal dokter pada hari berjalan
    const todayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    const todaySchedule = schedules.find((s) => s.doctorId === docId && s.dayOfWeek === todayName);
    if (todaySchedule && todaySchedule.bookedCount >= todaySchedule.maxPatients) {
      setFormNotice(
        `Kuota ${doctorName} untuk hari ${todayName} sudah penuh (${todaySchedule.bookedCount}/${todaySchedule.maxPatients} pasien). Pilih dokter atau hari lain.`
      );
      return;
    }

    const created = addQueue({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      mrNumber: selectedPatient.mrNumber,
      doctorName,
      doctorId: docId,
      department: selectedDepartment,
      priority,
      insuranceType,
      visitType,
      chiefComplaint: complaint.trim() || undefined
    });

    setRegisteredQueue(created);
  };

  const handlePrintTicket = () => {
    window.print();
  };

  const handleReset = () => {
    setRegisteredQueue(null);
    setSelectedPatient(null);
    setComplaint('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Pendaftaran Pasien & Admisi Rawat Jalan
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Daftarkan pasien ke poliklinik tujuan untuk mendapatkan nomor antrean pemeriksaan.
        </p>
      </div>

      {formNotice && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-xs font-semibold flex items-start gap-2" role="alert">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{formNotice}</span>
        </div>
      )}

      {/* Success Modal / Ticket Card if registered */}
      {registeredQueue ? (
        <Card className="bg-white border-2 border-emerald-500 shadow-md">
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Pendaftaran Berhasil Terverifikasi
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                Karcis Antrean Poliklinik
              </h2>
            </div>

            {/* Printable Ticket Box */}
            <div className="max-w-md mx-auto p-6 bg-slate-50 border border-slate-300 rounded-xl text-center space-y-3 font-mono shadow-inner print-only">
              <div className="text-xs text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">
                KLINIK TONG FANG ASHIAP
              </div>

              <div>
                <span className="text-xs text-slate-500 block">NOMOR ANTREAN</span>
                <span className="text-4xl font-black text-clinical-800 tracking-wider">
                  {registeredQueue.queueNumber}
                </span>
              </div>

              <div className="py-2 border-y border-dashed border-slate-300 text-xs space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Pasien:</span>
                  <strong className="text-slate-900 font-sans">{registeredQueue.patientName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Rekam Medis:</span>
                  <strong>{registeredQueue.mrNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tujuan Poli:</span>
                  <strong className="text-slate-900 font-sans">{registeredQueue.department}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dokter:</span>
                  <span className="font-sans">{registeredQueue.doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jam Pendaftaran:</span>
                  <span>{registeredQueue.registeredTime} WIB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Penjamin:</span>
                  <span className="font-sans">{registeredQueue.insuranceType}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 font-sans italic">
                Harap menunggu di ruang tunggu poliklinik hingga nomor dipanggil.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2 no-print">
              <Button
                variant="outline"
                size="md"
                onClick={handlePrintTicket}
                leftIcon={<Printer className="w-4 h-4 text-slate-700" />}
              >
                Cetak Karcis Antrean
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('queue')}
                leftIcon={<Clock className="w-4 h-4 text-white" />}
              >
                Buka Monitor Antrian
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleReset}
              >
                Daftarkan Pasien Lain
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        /* Registration Multi-step Form */
        <div className="space-y-6">
          {/* Step 1: Pasien Selection */}
          <Card
            title="Langkah 1: Identifikasi & Pencarian Pasien"
            subtitle="Cari pasien yang sudah terdaftar atau input data pasien baru"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNewPatientModalOpen(true)}
                leftIcon={<UserPlus className="w-4 h-4 text-clinical-600" />}
              >
                Tambah Pasien Baru
              </Button>
            }
          >
            {!selectedPatient ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketikkan Nama Pasien, NIK 16-digit, atau Nomor RM..."
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinical-500"
                  />
                </div>

                {searchQuery.trim() && (
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto bg-white shadow-2xs">
                    {filteredPatients.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Pasien tidak ditemukan. Silakan klik tombol <strong>Tambah Pasien Baru</strong> di atas.
                      </div>
                    ) : (
                      filteredPatients.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPatient(p)}
                          className="p-3 hover:bg-clinical-50 cursor-pointer flex items-center justify-between transition-colors text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{p.name}</span>
                              <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                {p.mrNumber}
                              </span>
                            </div>
                            <span className="text-slate-500 text-[11px]">
                              NIK: {p.nik} &bull; Usia: {p.age} thn ({p.gender}) &bull; Telp: {p.phone}
                            </span>
                          </div>
                          <Button variant="primary" size="sm">
                            Pilih Pasien
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Selected Patient Summary Card */
              <div className="p-4 rounded-xl bg-clinical-50/60 border border-clinical-200 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-clinical-700 text-white flex items-center justify-center font-bold text-base shadow-2xs">
                    {selectedPatient.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{selectedPatient.name}</h3>
                      <span className="font-mono text-xs font-bold text-clinical-800 bg-clinical-100 px-2 py-0.5 rounded">
                        {selectedPatient.mrNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      NIK: {selectedPatient.nik} &bull; {selectedPatient.age} thn ({selectedPatient.gender}) &bull; {selectedPatient.phone}
                    </p>
                    {selectedPatient.allergies.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-red-700 font-bold">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        Alergi: {selectedPatient.allergies.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectPatient(selectedPatient.id)}
                  >
                    Lihat Rekam Medis
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Ganti Pasien
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Step 2: Layanan Poliklinik & Dokter */}
          {selectedPatient && (
            <form onSubmit={handleSubmitRegistration} className="space-y-6 animate-in fade-in">
              <Card title="Langkah 2: Poliklinik Tujuan & Dokter Praktik">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Pilih Poliklinik"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    options={visibleDepartments}
                    requiredIndicator
                  />

                  <Select
                    label="Jenis Kunjungan"
                    value={visitType}
                    onChange={(e) => setVisitType(e.target.value as typeof visitType)}
                    options={[
                      { value: 'Kontrol Rutin', label: 'Kontrol Rutin' },
                      { value: 'Baru', label: 'Kunjungan Baru' },
                      { value: 'Rujukan', label: 'Pasien Rujukan Faskes Lain' },
                      { value: 'Darurat', label: 'Darurat / Cito' }
                    ]}
                    requiredIndicator
                  />

                  <Select
                    label="Penjamin Pelayanan"
                    value={insuranceType}
                    onChange={(e) => setInsuranceType(e.target.value as Patient['insuranceType'])}
                    options={[
                      { value: 'BPJS Kesehatan', label: 'BPJS Kesehatan' },
                      { value: 'Asuransi Swasta', label: 'Asuransi Swasta' },
                      { value: 'Umum / Mandiri', label: 'Umum / Pembayaran Mandiri' }
                    ]}
                    requiredIndicator
                  />

                  <Select
                    label="Prioritas Pelayanan"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as typeof priority)}
                    options={[
                      { value: 'Biasa', label: 'Antrean Reguler / Biasa' },
                      { value: 'Lansia/Disabilitas', label: 'Lansia / Ibu Hamil / Disabilitas' },
                      { value: 'Darurat / Cito', label: 'Gawat Darurat / Cito' }
                    ]}
                  />
                </div>

                <div className="mt-4">
                  <Input
                    label="Keluhan Utama Singkat (Anamnesis Awal Pendaftaran)"
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    placeholder="Contoh: Sakit kepala berdenyut dan demam sejak kemarin malam"
                  />
                </div>
              </Card>

              {/* Persetujuan pemrosesan data (teks diatur di Pengaturan → Dokumen) */}
              <p className="text-[11px] text-slate-500 leading-relaxed bg-clinical-50 border border-clinical-100 rounded-xl px-4 py-3">
                {settings.consentText}
              </p>

              {/* Confirmation & Submit */}
              <div className="p-4 bg-slate-100 rounded-xl flex items-center justify-between border border-slate-200">
                <div className="text-xs text-slate-600">
                  <span>Petugas Pendaftaran: </span>
                  <strong className="text-slate-800 font-semibold">{currentUser.name}</strong>
                  <span className="text-slate-400 ml-2">&bull; Loket Pendaftaran 1</span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4 text-white" />}
                >
                  Konfirmasi & Terbitkan Antrean
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* New Patient Form Modal */}
      <PatientFormModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onSave={handleCreateNewPatient}
      />
    </div>
  );
};

