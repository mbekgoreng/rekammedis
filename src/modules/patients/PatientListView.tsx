import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  Filter,
  ArrowUpDown,
  FileText,
  Clock,
  Edit,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PatientFormModal } from './PatientFormModal';
import { Patient } from '../../types';

interface PatientListViewProps {
  onSelectPatient: (patientId: string) => void;
  onNavigate: (module: string) => void;
}

export const PatientListView: React.FC<PatientListViewProps> = ({
  onSelectPatient,
  onNavigate
}) => {
  const { patients, addPatient, updatePatient } = useStore();
  const [search, setSearch] = useState('');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterInsurance, setFilterInsurance] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'mrNumber' | 'age' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Filter & Search
  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.mrNumber.toLowerCase().includes(q) ||
      p.nik.includes(q) ||
      p.phone.includes(q);

    const matchesGender = filterGender === 'ALL' || p.gender === filterGender;
    const matchesInsurance = filterInsurance === 'ALL' || p.insuranceType === filterInsurance;

    return matchesSearch && matchesGender && matchesInsurance;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
    if (sortBy === 'mrNumber') comparison = a.mrNumber.localeCompare(b.mrNumber);
    if (sortBy === 'age') comparison = a.age - b.age;
    if (sortBy === 'date') comparison = a.registeredAt.localeCompare(b.registeredAt);

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSavePatient = (data: Omit<Patient, 'id' | 'mrNumber' | 'registeredAt'>) => {
    setSaveNotice(null);
    // Cegah duplikat: NIK yang sama tidak boleh dimiliki dua pasien berbeda
    // (pasien yang sedang diedit dikecualikan dari pemeriksaan).
    const duplicate = patients.find((p) => p.nik === data.nik && p.id !== editingPatient?.id);
    if (duplicate) {
      setSaveNotice(
        `NIK ${data.nik} sudah terdaftar atas nama ${duplicate.name} (${duplicate.mrNumber}). ` +
          'Penyimpanan ditolak — gunakan data pasien yang sudah ada atau periksa kembali NIK yang diinput.'
      );
      setEditingPatient(undefined);
      return;
    }
    if (editingPatient) {
      updatePatient(editingPatient.id, data);
    } else {
      const created = addPatient(data);
      onSelectPatient(created.id);
    }
    setEditingPatient(undefined);
  };

  // Variant badge mengikuti status pasien (tidak lagi selalu success)
  const statusVariant = (status: Patient['status']) =>
    ({
      Aktif: 'success',
      Nonaktif: 'neutral',
      'Rawat Inap': 'warning',
      Selesai: 'info'
    })[status] as 'success' | 'neutral' | 'warning' | 'info';

  return (
    <div className="space-y-5">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Direktori Pasien & Rekam Medis
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {patients.length} pasien terdaftar dalam database fasilitas kesehatan.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingPatient(undefined);
            setIsFormModalOpen(true);
          }}
          leftIcon={<UserPlus className="w-4 h-4 text-white" />}
        >
          Tambah Pasien Baru
        </Button>
      </div>

      {saveNotice && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-xs font-semibold flex items-start gap-2" role="alert">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{saveNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card noPadding className="p-4 bg-white border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NIK, No. RM..."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-clinical-500"
            />
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Jenis Kelamin</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          {/* Insurance Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={filterInsurance}
              onChange={(e) => setFilterInsurance(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Penjamin</option>
              <option value="BPJS Kesehatan">BPJS Kesehatan</option>
              <option value="Asuransi Swasta">Asuransi Swasta</option>
              <option value="Umum / Mandiri">Umum / Mandiri</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'mrNumber' | 'age' | 'date')}
              className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none"
            >
              <option value="date">Tanggal Terdaftar</option>
              <option value="name">Nama Pasien</option>
              <option value="mrNumber">No. Rekam Medis</option>
              <option value="age">Usia Pasien</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 border border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600"
              title="Balik Urutan"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Patient Table */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Rekam Medis</th>
                <th className="py-3 px-4">Nama Pasien & NIK</th>
                <th className="py-3 px-4">Usia / JK</th>
                <th className="py-3 px-4">Penjamin</th>
                <th className="py-3 px-4">Alergi & Riwayat Kronis</th>
                <th className="py-3 px-4">Telepon</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Tidak ada data pasien yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                sorted.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                      {patient.mrNumber}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onSelectPatient(patient.id)}
                        className="font-bold text-slate-900 hover:text-clinical-700 text-left block"
                      >
                        {patient.name}
                      </button>
                      <span className="text-[11px] text-slate-400 font-mono">
                        NIK: {patient.nik}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">{patient.age} thn</span>
                      <span className="text-[11px] text-slate-400 block">{patient.gender}</span>
                    </td>
                    <td className="py-3 px-4">
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
                      {patient.insuranceNumber && (
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                          {patient.insuranceNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      {patient.allergies.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          {patient.allergies.map((a, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.2 rounded"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 block">Tidak ada alergi</span>
                      )}
                      {patient.chronicDiseases.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {patient.chronicDiseases.map((c, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {patient.phone}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={statusVariant(patient.status)} size="sm" dot>
                        {patient.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectPatient(patient.id)}
                          title="Buka Rekam Medis Pasien"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Detail
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingPatient(patient);
                            setIsFormModalOpen(true);
                          }}
                          title="Ubah Data Pasien"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onSelectPatient(patient.id);
                            onNavigate('registration');
                          }}
                          title="Daftarkan ke Antrian Poli"
                        >
                          <Clock className="w-3.5 h-3.5 text-clinical-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Menampilkan <strong className="text-slate-800">{sorted.length}</strong> dari{' '}
            <strong className="text-slate-800">{patients.length}</strong> pasien
          </span>
          <span className="text-[11px] text-slate-400">
            Standar format Rekam Medis Elektronik Nasional
          </span>
        </div>
      </Card>

      {/* Patient Form Modal (Create / Edit) */}
      <PatientFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingPatient(undefined);
        }}
        onSave={handleSavePatient}
        initialData={editingPatient}
      />
    </div>
  );
};
