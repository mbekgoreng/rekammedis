import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Building2,
  Pencil,
  Trash2,
  Power,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { DoctorSchedule } from '../../types';

type DayName = DoctorSchedule['dayOfWeek'];

const DAYS_OF_WEEK: DayName[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

interface ScheduleForm {
  doctorId: string;
  specialty: string;
  department: string;
  dayOfWeek: DayName;
  startTime: string;
  endTime: string;
  room: string;
  maxPatients: string;
}

const emptyForm = (day: DayName): ScheduleForm => ({
  doctorId: '',
  specialty: '',
  department: '',
  dayOfWeek: day,
  startTime: '08:00',
  endTime: '12:00',
  room: '',
  maxPatients: '20'
});

export const DoctorScheduleView: React.FC = () => {
  const { schedules, users, addSchedule, updateSchedule, deleteSchedule } = useStore();
  const [selectedDay, setSelectedDay] = useState<string>('Senin');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<DoctorSchedule | null>(null);
  const [form, setForm] = useState<ScheduleForm>(() => emptyForm('Senin'));
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<DoctorSchedule | null>(null);

  const doctors = users.filter((u) => u.role === 'doctor' && u.isActive !== false);

  const filteredSchedules = selectedDay === 'ALL'
    ? schedules
    : schedules.filter((s) => s.dayOfWeek === selectedDay);

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm(DAYS_OF_WEEK.includes(selectedDay as DayName) ? (selectedDay as DayName) : 'Senin'));
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (sch: DoctorSchedule) => {
    setEditing(sch);
    setForm({
      doctorId: sch.doctorId,
      specialty: sch.specialty,
      department: sch.department,
      dayOfWeek: sch.dayOfWeek,
      startTime: sch.startTime,
      endTime: sch.endTime,
      room: sch.room,
      maxPatients: String(sch.maxPatients)
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleDoctorChange = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    setForm((prev) => ({
      ...prev,
      doctorId,
      // Poli mengikuti departemen dokter terpilih (tetap bisa diubah manual)
      department: doctor?.department || prev.department
    }));
  };

  const handleSave = () => {
    const doctor = doctors.find((d) => d.id === form.doctorId);
    if (!doctor) {
      setFormError('Dokter wajib dipilih dari daftar dokter yang terdaftar.');
      return;
    }
    if (!form.department.trim()) {
      setFormError('Poliklinik wajib diisi.');
      return;
    }
    if (!form.startTime || !form.endTime) {
      setFormError('Jam mulai dan jam selesai wajib diisi.');
      return;
    }
    if (form.endTime <= form.startTime) {
      setFormError('Jam selesai harus lebih besar dari jam mulai.');
      return;
    }
    const maxPatients = parseInt(form.maxPatients, 10);
    if (!Number.isFinite(maxPatients) || maxPatients < 1) {
      setFormError('Kuota pasien harus minimal 1.');
      return;
    }

    const payload = {
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: form.specialty.trim(),
      department: form.department.trim(),
      dayOfWeek: form.dayOfWeek,
      startTime: form.startTime,
      endTime: form.endTime,
      room: form.room.trim(),
      maxPatients
    };

    if (editing) {
      updateSchedule(editing.id, payload);
    } else {
      addSchedule(payload);
    }
    setIsFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleting) return;
    deleteSchedule(deleting.id);
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Jadwal Praktik Dokter & Poliklinik
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen jam operasional dokter spesialis, alokasi ruang periksa, dan kuota pasien.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openAddModal}
          leftIcon={<Plus className="w-4 h-4 text-white" />}
        >
          Tambah Jadwal Praktik
        </Button>
      </div>

      {/* Days Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedDay('ALL')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            selectedDay === 'ALL'
              ? 'bg-clinical-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Semua Hari
        </button>
        {DAYS_OF_WEEK.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedDay === day
                ? 'bg-clinical-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule Cards Grid */}
      {filteredSchedules.length === 0 ? (
        <Card className="border-slate-200">
          <p className="text-sm text-slate-500 text-center py-8">
            Belum ada jadwal praktik {selectedDay === 'ALL' ? 'yang terdaftar' : `pada hari ${selectedDay}`}.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchedules.map((sch) => {
            const quotaPercent = sch.maxPatients > 0 ? Math.round((sch.bookedCount / sch.maxPatients) * 100) : 0;
            const isFull = sch.bookedCount >= sch.maxPatients;

            return (
              <Card key={sch.id} className="relative overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                      {sch.doctorName}
                    </h3>
                    <span className="text-xs text-clinical-700 font-semibold mt-0.5 block">
                      {sch.specialty}
                    </span>
                  </div>
                  <Badge variant={sch.isActive ? 'success' : 'neutral'} size="sm" dot>
                    {sch.isActive ? 'Praktik' : 'Libur'}
                  </Badge>
                </div>

                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Poliklinik:
                    </span>
                    <strong className="font-semibold">{sch.department}</strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Jam Praktik:
                    </span>
                    <strong className="font-mono">{sch.startTime} - {sch.endTime} WIB</strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span>Ruang Periksa:</span>
                    <span className="font-semibold text-slate-900">{sch.room}</span>
                  </div>
                </div>

                {/* Kuota Progress */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Kuota Terisi:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {sch.bookedCount} / {sch.maxPatients} Pasien ({quotaPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isFull ? 'bg-red-500' : quotaPercent > 70 ? 'bg-amber-500' : 'bg-clinical-600'
                      }`}
                      style={{ width: `${Math.min(100, quotaPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      Sisa {Math.max(0, sch.maxPatients - sch.bookedCount)} slot antrean
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateSchedule(sch.id, { isActive: !sch.isActive })}
                      leftIcon={<Power className="w-3.5 h-3.5" />}
                    >
                      {sch.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditModal(sch)}
                      leftIcon={<Pencil className="w-3.5 h-3.5" />}
                    >
                      Edit Jadwal
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setDeleting(sch)}
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Schedule Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? 'Edit Jadwal Praktik Dokter' : 'Tambah Jadwal Praktik Dokter'}
        subtitle="Alokasikan sesi dokter ke dalam kalender poliklinik"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {editing ? 'Simpan Perubahan' : 'Simpan Jadwal'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {formError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
              <span>{formError}</span>
            </div>
          )}
          <Select
            label="Dokter"
            requiredIndicator
            value={form.doctorId}
            onChange={(e) => handleDoctorChange(e.target.value)}
            options={[
              { value: '', label: '— Pilih Dokter —' },
              ...doctors.map((d) => ({ value: d.id, label: d.name }))
            ]}
          />
          <Input
            label="Spesialisasi"
            placeholder="Spesialis ..."
            value={form.specialty}
            onChange={(e) => setForm((prev) => ({ ...prev, specialty: e.target.value }))}
          />
          <Input
            label="Poliklinik"
            placeholder="Poli ..."
            requiredIndicator
            value={form.department}
            onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
          />
          <Select
            label="Hari Praktik"
            value={form.dayOfWeek}
            onChange={(e) => setForm((prev) => ({ ...prev, dayOfWeek: e.target.value as DayName }))}
            options={DAYS_OF_WEEK.map((d) => ({ value: d, label: d }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Jam Mulai"
              type="time"
              requiredIndicator
              value={form.startTime}
              onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
            />
            <Input
              label="Jam Selesai"
              type="time"
              requiredIndicator
              value={form.endTime}
              onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ruang Periksa"
              placeholder="Ruang 101"
              value={form.room}
              onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))}
            />
            <Input
              label="Kapasitas / Kuota Maksimal"
              type="number"
              min={1}
              requiredIndicator
              value={form.maxPatients}
              onChange={(e) => setForm((prev) => ({ ...prev, maxPatients: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Hapus Jadwal Praktik"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleting(null)}>
              Batal
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
              Hapus Jadwal
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Hapus jadwal <strong className="text-slate-800">{deleting?.doctorName}</strong> di{' '}
          <strong className="text-slate-800">{deleting?.department}</strong> — hari{' '}
          {deleting?.dayOfWeek} pukul {deleting?.startTime}–{deleting?.endTime} WIB?
        </p>
      </Modal>
    </div>
  );
};
