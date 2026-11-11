import React, { useState } from 'react';
import {
  Phone,
  MapPin,
  AlertTriangle,
  FileText,
  Clock,
  Pill,
  FlaskConical,
  Scan,
  CreditCard,
  FileSpreadsheet,
  Stethoscope,
  ChevronLeft,
  Plus
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Tabs } from '../../components/common/Tabs';
import { EmptyState } from '../../components/common/EmptyState';

interface PatientDetailViewProps {
  patientId: string;
  onBack: () => void;
  onNavigate: (module: string) => void;
}

export const PatientDetailView: React.FC<PatientDetailViewProps> = ({
  patientId,
  onBack,
  onNavigate
}) => {
  const {
    getPatient,
    medicalRecords,
    prescriptions,
    labOrders,
    radiologyOrders,
    invoices,
    certificates,
    queues,
    currentUser
  } = useStore();

  const [activeTab, setActiveTab] = useState('overview');

  const patient = getPatient(patientId);

  if (!patient) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-base font-bold text-slate-800">Pasien Tidak Ditemukan</h2>
        <Button variant="outline" size="sm" onClick={onBack} className="mt-4">
          Kembali ke Daftar Pasien
        </Button>
      </div>
    );
  }

  // Filter records for this patient
  const patientRecords = medicalRecords.filter((r) => r.patientId === patient.id);
  const patientPrescriptions = prescriptions.filter((p) => p.patientId === patient.id);
  const patientLabOrders = labOrders.filter((l) => l.patientId === patient.id);
  const patientRadOrders = radiologyOrders.filter((r) => r.patientId === patient.id);
  const patientInvoices = invoices.filter((i) => i.patientId === patient.id);
  const patientCertificates = certificates.filter((c) => c.patientId === patient.id);
  const patientQueues = queues.filter((q) => q.patientId === patient.id);

  // Kerahasiaan rekam medis: peran nonklinis (kasir/pendaftaran) hanya
  // memerlukan identitas, kunjungan, dan tagihan — isi klinis (SOAP,
  // diagnosa, resep, lab, radiologi) disembunyikan dari tab mereka.
  const isClinicalRole = ['admin', 'doctor', 'nurse', 'pharmacist', 'lab'].includes(currentUser.role);
  const allTabs = [
    { id: 'overview', label: 'Ringkasan Pasien' },
    { id: 'records', label: 'Rekam Medis (SOAP)', count: patientRecords.length, clinical: true },
    { id: 'visits', label: 'Riwayat Kunjungan', count: patientQueues.length },
    { id: 'diagnoses', label: 'Riwayat Diagnosa', clinical: true },
    { id: 'prescriptions', label: 'Obat & Resep', count: patientPrescriptions.length, clinical: true },
    { id: 'lab', label: 'Laboratorium', count: patientLabOrders.length, clinical: true },
    { id: 'radiology', label: 'Radiologi', count: patientRadOrders.length, clinical: true },
    { id: 'documents', label: 'Surat & Dokumen', count: patientCertificates.length },
    { id: 'billing', label: 'Pembayaran & Invoice', count: patientInvoices.length }
  ];
  const tabs = allTabs.filter((t) => isClinicalRole || !t.clinical);

  return (
    <div className="space-y-5">
      {/* Top Breadcrumb & Return button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-clinical-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar Pasien
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('registration')}
            leftIcon={<Clock className="w-3.5 h-3.5" />}
          >
            Daftarkan Kunjungan
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('examination')}
            leftIcon={<Stethoscope className="w-3.5 h-3.5 text-white" />}
          >
            Pemeriksaan SOAP Baru
          </Button>
        </div>
      </div>

      {/* Patient Master Card Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Avatar Placeholder */}
            <div className="w-16 h-16 rounded-xl bg-clinical-100 text-clinical-800 border border-clinical-200 flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs">
              {patient.name
                .split(' ')
                .map((n) => n[0])
                .filter((_, i) => i < 2)
                .join('')}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  {patient.name}
                </h1>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                  {patient.mrNumber}
                </span>
                <Badge
                  variant={
                    patient.insuranceType.includes('BPJS')
                      ? 'success'
                      : patient.insuranceType.includes('Swasta')
                      ? 'info'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {patient.insuranceType}
                </Badge>
              </div>

              <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-1 text-xs text-slate-600">
                <span>
                  <strong>NIK:</strong> {patient.nik}
                </span>
                <span>
                  <strong>Usia:</strong> {patient.age} Tahun ({patient.gender})
                </span>
                <span>
                  <strong>Gol. Darah:</strong>{' '}
                  <span className="font-bold text-red-600">{patient.bloodType}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {patient.phone}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate max-w-xl">{patient.address}</span>
              </div>
            </div>
          </div>

          <div className="flex md:flex-col items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <Badge
              variant={
                ({
                  Aktif: 'success',
                  Nonaktif: 'neutral',
                  'Rawat Inap': 'warning',
                  Selesai: 'info'
                }[patient.status] as 'success' | 'neutral' | 'warning' | 'info')
              }
              dot
              size="md"
            >
              Pasien {patient.status}
            </Badge>
            <span className="text-[11px] text-slate-400 mt-1">
              Terdaftar sejak: {patient.registeredAt}
            </span>
          </div>
        </div>

        {/* Prominent Allergy Warning Banner */}
        {patient.allergies.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-xs text-red-900">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 animate-pulse" />
            <div className="flex-1">
              <strong className="font-bold uppercase tracking-wider text-red-800 mr-2">
                Peringatan Alergi:
              </strong>
              <span className="font-semibold">{patient.allergies.join(', ')}</span>
              <span className="text-[11px] text-red-700 ml-2 hidden sm:inline">
                &mdash; Hindari peresepan obat golongan terkait.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card title="Data Pribadi & Demografi Pasien">
            <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
              <div>
                <dt className="text-slate-400 font-medium">Nama Lengkap</dt>
                <dd className="font-semibold text-slate-800">{patient.name}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Nomor Rekam Medis</dt>
                <dd className="font-mono font-bold text-slate-800">{patient.mrNumber}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Nomor Induk Kependudukan (NIK)</dt>
                <dd className="font-mono text-slate-800">{patient.nik}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Tanggal Lahir & Usia</dt>
                <dd className="text-slate-800">
                  {patient.birthDate} ({patient.age} Tahun)
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Jenis Kelamin</dt>
                <dd className="text-slate-800">{patient.gender}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Golongan Darah</dt>
                <dd className="font-bold text-red-600">{patient.bloodType}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Pekerjaan</dt>
                <dd className="text-slate-800">{patient.occupation || '-'}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Nomor Telepon</dt>
                <dd className="font-mono text-slate-800">{patient.phone}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-400 font-medium">Alamat Domisili</dt>
                <dd className="text-slate-800 leading-relaxed">{patient.address}</dd>
              </div>
            </dl>
          </Card>

          <div className="space-y-5">
            {/* Penjamin & Kontak Darurat */}
            <Card title="Penjamin & Kontak Darurat">
              <div className="space-y-3.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-slate-400 font-medium mb-1">Status Penjamin</div>
                  <div className="font-semibold text-slate-900">{patient.insuranceType}</div>
                  {patient.insuranceNumber && (
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      No. Kartu: {patient.insuranceNumber}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-slate-400 font-medium mb-1">Kontak Darurat (Keluarga)</div>
                  <div className="font-semibold text-slate-900">
                    {patient.emergencyContact.name} ({patient.emergencyContact.relation})
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                    Telepon: {patient.emergencyContact.phone}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-slate-400 font-medium mb-1">Riwayat Penyakit Kronis</div>
                  {patient.chronicDiseases.length > 0 ? (
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {patient.chronicDiseases.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-900 border border-amber-200"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Tidak ada riwayat penyakit kronis.</span>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Rekam Medis (SOAP) Timeline */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Riwayat Pemeriksaan Klinis (SOAP)
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('examination')}
              leftIcon={<Plus className="w-3.5 h-3.5 text-white" />}
            >
              Tambah Catatan SOAP
            </Button>
          </div>

          {patientRecords.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Belum ada riwayat rekam medis SOAP"
              description="Pasien ini belum memiliki catatan pemeriksaan medis."
              actionLabel="Mulai Pemeriksaan SOAP"
              onAction={() => onNavigate('examination')}
            />
          ) : (
            <div className="space-y-4">
              {patientRecords.map((rec) => (
                <Card key={rec.id} noPadding className="border-l-4 border-l-clinical-600">
                  <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        Pemeriksaan {rec.department} &bull; {rec.visitDate}
                      </span>
                      <span className="text-xs text-slate-500 block">
                        Dokter Pemeriksa: {rec.doctorName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">
                        {rec.visitType}
                      </Badge>
                      <Badge variant="success" size="sm">
                        Status: {rec.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 text-xs">
                    {/* S (Subjective) */}
                    <div>
                      <h4 className="font-bold text-slate-700 flex items-center gap-1.5 mb-1 text-xs">
                        <span className="w-4 h-4 rounded-full bg-clinical-700 text-white flex items-center justify-center text-[10px] font-bold">
                          S
                        </span>
                        Subjective (Keluhan Pasien)
                      </h4>
                      <p className="p-2.5 bg-slate-50 rounded-lg text-slate-800 border border-slate-100 leading-relaxed">
                        <strong>Keluhan Utama:</strong> {rec.subjective.chiefComplaint}
                        <br />
                        <strong>Riwayat Penyakit Sekarang:</strong> {rec.subjective.historyOfPresentIllness}
                      </p>
                    </div>

                    {/* O (Objective) - Vitals */}
                    <div>
                      <h4 className="font-bold text-slate-700 flex items-center gap-1.5 mb-1 text-xs">
                        <span className="w-4 h-4 rounded-full bg-clinical-700 text-white flex items-center justify-center text-[10px] font-bold">
                          O
                        </span>
                        Objective (Tanda Vital & Pemeriksaan Fisik)
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Tekanan Darah</span>
                          <span className="font-mono font-bold text-slate-900">
                            {rec.objective.vitals.systolic}/{rec.objective.vitals.diastolic} mmHg
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Denyut Nadi</span>
                          <span className="font-mono font-bold text-slate-900">
                            {rec.objective.vitals.heartRate} x/mnt
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Suhu Tubuh</span>
                          <span className="font-mono font-bold text-slate-900">
                            {rec.objective.vitals.temperature} °C
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">SpO2</span>
                          <span className="font-mono font-bold text-slate-900">
                            {rec.objective.vitals.spO2}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">BB / TB</span>
                          <span className="font-mono font-bold text-slate-900">
                            {rec.objective.vitals.weight}kg / {rec.objective.vitals.height}cm
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">BMI (Status)</span>
                          <span className="font-mono font-bold text-clinical-700">
                            {rec.objective.vitals.bmi} ({rec.objective.vitals.bmiCategory})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* A (Assessment) */}
                    <div>
                      <h4 className="font-bold text-slate-700 flex items-center gap-1.5 mb-1 text-xs">
                        <span className="w-4 h-4 rounded-full bg-clinical-700 text-white flex items-center justify-center text-[10px] font-bold">
                          A
                        </span>
                        Assessment & Diagnosis
                      </h4>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        {rec.assessment.diagnoses.map((d, i) => (
                          <div key={i} className="flex items-center gap-2 font-semibold text-slate-900">
                            <span className="font-mono px-1.5 py-0.5 bg-clinical-100 text-clinical-800 rounded text-xs">
                              {d.icd10Code}
                            </span>
                            <span>{d.nameIndonesian}</span>
                            {d.isPrimary && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                                Diagnosa Utama
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* P (Plan) */}
                    <div>
                      <h4 className="font-bold text-slate-700 flex items-center gap-1.5 mb-1 text-xs">
                        <span className="w-4 h-4 rounded-full bg-clinical-700 text-white flex items-center justify-center text-[10px] font-bold">
                          P
                        </span>
                        Plan (Rencana Terapi & Resep)
                      </h4>
                      <p className="p-2.5 bg-slate-50 rounded-lg text-slate-800 border border-slate-100 leading-relaxed">
                        {rec.plan.therapyPlan}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Visits */}
      {activeTab === 'visits' && (
        <Card title="Riwayat Kunjungan Poliklinik">
          {patientQueues.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Belum ada riwayat antrean kunjungan pasien.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">No. Antrian</th>
                    <th className="py-2.5 px-4">Poliklinik</th>
                    <th className="py-2.5 px-4">Dokter</th>
                    <th className="py-2.5 px-4">Jam Kedatangan</th>
                    <th className="py-2.5 px-4">Penjamin</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patientQueues.map((q) => (
                    <tr key={q.id}>
                      <td className="py-2.5 px-4 font-mono font-bold">{q.queueNumber}</td>
                      <td className="py-2.5 px-4">{q.department}</td>
                      <td className="py-2.5 px-4">{q.doctorName}</td>
                      <td className="py-2.5 px-4 font-mono">{q.registeredTime} WIB</td>
                      <td className="py-2.5 px-4">{q.insuranceType}</td>
                      <td className="py-2.5 px-4">
                        <Badge variant="success" size="sm">
                          {q.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: Diagnoses */}
      {activeTab === 'diagnoses' && (
        <Card title="Riwayat Seluruh Diagnosa Pasien (ICD-10)">
          <div className="space-y-2">
            {patientRecords.flatMap((r) => r.assessment.diagnoses).length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Belum ada rekaman diagnosa ICD-10 untuk pasien ini.
              </div>
            ) : (
              patientRecords.flatMap((r) =>
                r.assessment.diagnoses.map((d, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-clinical-700 bg-clinical-50 border border-clinical-200 px-2 py-1 rounded">
                        {d.icd10Code}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 block">{d.nameIndonesian}</span>
                        {d.notes && <span className="text-slate-500 text-[11px]">{d.notes}</span>}
                      </div>
                    </div>
                    {d.isPrimary && (
                      <Badge variant="primary" size="sm">
                        Diagnosa Utama
                      </Badge>
                    )}
                  </div>
                ))
              )
            )}
          </div>
        </Card>
      )}

      {/* Tab 5: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <Card title="Riwayat Resep & Pengobatan Pasien">
          {patientPrescriptions.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="Belum ada resep obat"
              description="Pasien belum memiliki riwayat peresepan obat dari dokter."
              actionLabel="Buat Resep Baru"
              onAction={() => onNavigate('prescription')}
            />
          ) : (
            <div className="space-y-4">
              {patientPrescriptions.map((rx) => (
                <div key={rx.id} className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900">Resep No. {rx.id}</span>
                      <span className="text-slate-500 block text-[11px]">
                        Tanggal: {rx.date} &bull; Dokter: {rx.doctorName}
                      </span>
                    </div>
                    <Badge variant="success" size="sm">
                      {rx.status}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    {rx.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                        <div>
                          <span className="font-bold text-slate-800">{item.medicineName}</span>
                          <span className="text-slate-500 text-[11px] block">
                            Dosis: {item.dosage} &bull; {item.frequency} &bull; {item.timing}
                          </span>
                        </div>
                        <div className="text-right font-mono font-semibold text-slate-700">
                          {item.quantity} {item.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 6: Lab */}
      {activeTab === 'lab' && (
        <Card title="Hasil Pemeriksaan Laboratorium">
          {patientLabOrders.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="Belum ada order laboratorium"
              description="Tidak ada hasil uji patologi klinik untuk pasien ini."
              actionLabel="Order Laboratorium"
              onAction={() => onNavigate('laboratory')}
            />
          ) : (
            <div className="space-y-4">
              {patientLabOrders.map((lab) => (
                <div key={lab.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900">{lab.orderNumber}</span>
                      <span className="text-slate-500 block text-[11px]">Tanggal: {lab.orderDate}</span>
                    </div>
                    <Badge
                      variant={lab.status === 'Validated' ? 'success' : lab.status === 'Processing' ? 'warning' : 'neutral'}
                      size="sm"
                    >
                      {lab.status === 'Validated' ? 'Tervalidasi' : lab.status === 'Processing' ? 'Sedang Diproses — hasil belum resmi' : lab.status}
                    </Badge>
                  </div>

                  {lab.status !== 'Validated' ? (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-semibold">
                      Hasil laboratorium ini BELUM divalidasi analis/penanggung jawab lab, sehingga angka hasil tidak ditampilkan.
                      Nilai mentah yang belum tervalidasi tidak boleh menjadi dasar keputusan klinis.
                    </p>
                  ) : (
                  <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Parameter Uji</th>
                        <th className="py-2 px-3">Hasil Nilai</th>
                        <th className="py-2 px-3">Nilai Rujukan / Normal</th>
                        <th className="py-2 px-3">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lab.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.testName}</td>
                          <td className={`py-2 px-3 font-mono font-bold ${item.isAbnormal ? 'text-red-600 bg-red-50' : 'text-slate-800'}`}>
                            {item.resultValue} {item.unit}
                          </td>
                          <td className="py-2 px-3 text-slate-500 font-mono">{item.referenceRange}</td>
                          <td className="py-2 px-3 text-slate-600">{item.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 7: Radiology */}
      {activeTab === 'radiology' && (
        <Card title="Hasil Pemeriksaan Radiologi & Imaging">
          {patientRadOrders.length === 0 ? (
            <EmptyState
              icon={Scan}
              title="Belum ada order radiologi"
              description="Tidak ada pemeriksaan rontgen atau USG tercatat."
              actionLabel="Permintaan Radiologi"
              onAction={() => onNavigate('radiology')}
            />
          ) : (
            <div className="space-y-4">
              {patientRadOrders.map((rad) => (
                <div key={rad.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900">{rad.orderNumber} - {rad.examinationType}</span>
                      <span className="text-slate-500 block text-[11px]">Tanggal: {rad.orderDate}</span>
                    </div>
                    <Badge variant="success" size="sm">
                      {rad.status}
                    </Badge>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <div>
                      <strong className="text-slate-700">Hasil Temuan (Findings):</strong>
                      <p className="text-slate-800 mt-0.5 leading-relaxed">{rad.findings}</p>
                    </div>
                    <div>
                      <strong className="text-slate-700">Kesan (Impression):</strong>
                      <p className="text-clinical-800 font-semibold mt-0.5">{rad.impression}</p>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      Radiolog: {rad.radiologistName} &bull; Tanggal Pembacaan: {rad.readingDate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 8: Documents */}
      {activeTab === 'documents' && (
        <Card title="Surat Keterangan Medis Pasien">
          {patientCertificates.length === 0 ? (
            <EmptyState
              icon={FileSpreadsheet}
              title="Belum ada surat medis yang diterbitkan"
              description="Surat keterangan sakit, berbadan sehat, atau rujukan akan muncul di sini."
              actionLabel="Terbitkan Surat Medis"
              onAction={() => onNavigate('letters')}
            />
          ) : (
            <div className="space-y-3">
              {patientCertificates.map((cert) => (
                <div key={cert.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{cert.type}</span>
                    <span className="text-[11px] font-mono text-slate-500 block">
                      No: {cert.certificateNumber} &bull; Tanggal: {cert.issueDate}
                    </span>
                    <span className="text-slate-600 mt-0.5 block">{cert.notes}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('letters')}
                  >
                    Buka Dokumen
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 9: Billing */}
      {activeTab === 'billing' && (
        <Card title="Riwayat Tagihan & Pembayaran">
          {patientInvoices.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Belum ada riwayat tagihan"
              description="Tidak ada tagihan atau pembayaran terdaftar untuk pasien ini."
            />
          ) : (
            <div className="space-y-3">
              {patientInvoices.map((inv) => (
                <div key={inv.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                    <span className="text-slate-500 block text-[11px]">
                      Tanggal: {inv.date} &bull; Metode: {inv.paymentMethod || 'Belum Lunas'}
                    </span>
                    <div className="text-slate-700 font-medium mt-1">
                      Total: <strong className="text-slate-900 font-mono">Rp {inv.total.toLocaleString('id-ID')}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={inv.status === 'Paid' ? 'success' : 'warning'} size="sm">
                      {inv.status === 'Paid' ? 'LUNAS' : inv.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
