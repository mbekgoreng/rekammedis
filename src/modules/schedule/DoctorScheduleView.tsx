import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  User,
  Plus,
  Building2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { DoctorSchedule } from '../../types';

export const DoctorScheduleView: React.FC = () => {
  const { schedules } = useStore();
  const [selectedDay, setSelectedDay] = useState<string>('Senin');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const filteredSchedules = selectedDay === 'ALL'
    ? schedules
    : schedules.filter((s) => s.dayOfWeek === selectedDay);

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
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4 text-white" />}
        >
          Tambah Jadwal Praktik
        </Button>
      </div>

      {/* Days Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {daysOfWeek.map((day) => (
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSchedules.map((sch) => {
          const quotaPercent = Math.round((sch.bookedCount / sch.maxPatients) * 100);
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

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  Sisa {Math.max(0, sch.maxPatients - sch.bookedCount)} slot antrean
                </span>
                <Button variant="ghost" size="sm">
                  Kelola Jadwal
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Schedule Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Jadwal Praktik Dokter"
        subtitle="Alokasikan sesi dokter ke dalam kalender poliklinik"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Simpan Jadwal
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Nama Dokter & Gelar" placeholder="dr. ..." />
          <Input label="Spesialisasi" placeholder="Spesialis ..." />
          <Select
            label="Hari Praktik"
            options={daysOfWeek.map((d) => ({ value: d, label: d }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Jam Mulai" placeholder="08:00" />
            <Input label="Jam Selesai" placeholder="13:00" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ruang Periksa" placeholder="Ruang 101" />
            <Input label="Kapasitas / Kuota Maksimal" type="number" defaultValue="25" />
          </div>
        </div>
      </Modal>
    </div>
  );
};
