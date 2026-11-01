import React, { useState } from 'react';
import {
  Volume2,
  CheckCircle2,
  Stethoscope,
  Clock,
  ArrowRight,
  UserX,
  RefreshCw,
  Share2,
  UserCheck,
  Building2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { QueueItem } from '../../types';

interface QueueViewProps {
  onNavigate: (module: string) => void;
  onSelectPatient: (patientId: string) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  onNavigate,
  onSelectPatient
}) => {
  const {
    queues,
    callQueuePatient,
    updateQueueStatus
  } = useStore();

  const [activeDeptFilter, setActiveDeptFilter] = useState('ALL');

  // Filter queues
  const filteredQueues = activeDeptFilter === 'ALL'
    ? queues
    : queues.filter((q) => q.department === activeDeptFilter);

  // Active serving patient
  const currentlyServing = filteredQueues.find((q) => q.status === 'Sedang Diperiksa') ||
    filteredQueues.find((q) => q.status === 'Dipanggil') ||
    null;

  // Next waiting patients
  const waitingList = filteredQueues.filter((q) => q.status === 'Menunggu');
  const calledList = filteredQueues.filter((q) => q.status === 'Dipanggil');
  const finishedList = filteredQueues.filter((q) => q.status === 'Selesai');

  const departments = ['ALL', 'Poli Penyakit Dalam', 'Poli Gizi & Spesialis', 'Poli Umum'];

  const handleStartExam = (queueItem: QueueItem) => {
    updateQueueStatus(queueItem.id, 'Sedang Diperiksa');
    onSelectPatient(queueItem.patientId);
    onNavigate('examination');
  };

  return (
    <div className="space-y-6">
      {/* Header & Poliklinik Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Manajemen Antrian Poliklinik Real-Time
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor pemanggilan antrean pasien rawat jalan dengan audio bel chime otomatis.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setActiveDeptFilter(dept)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeDeptFilter === dept
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {dept === 'ALL' ? 'Semua Poliklinik' : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Main Display: Sekarang Dilayani & Antrean Berikutnya */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Big TV Screen Display for Waiting Room (2 Cols) */}
        <div className="lg:col-span-2">
          <div className="bg-[#0b1d33] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden flex flex-col justify-between min-h-[320px]">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-clinical-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* TV Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <span className="font-extrabold tracking-tight text-sm uppercase text-slate-300">
                  MONITOR RUANG TUNGGU &bull; KLINIK TONG FANG ASHIAP
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
                LIVE QUEUE
              </span>
            </div>

            {/* Serving Details */}
            {currentlyServing ? (
              <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="text-xs uppercase font-bold tracking-widest text-cyan-400 block mb-1">
                    SEKARANG DILAYANI
                  </span>
                  <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white mb-2">
                    {currentlyServing.queueNumber}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {currentlyServing.patientName}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    No. RM: {currentlyServing.mrNumber} &bull; Penjamin: {currentlyServing.insuranceType}
                  </p>
                </div>

                <div className="bg-[#071526] p-5 rounded-xl border border-slate-800 text-left min-w-[220px]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    RUANG PEMERIKSAAN
                  </span>
                  <span className="text-lg font-bold text-cyan-300 block leading-tight">
                    {currentlyServing.department}
                  </span>
                  <span className="text-xs text-slate-300 mt-1 block">
                    {currentlyServing.doctorName}
                  </span>
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <Badge variant="primary" size="sm" dot>
                      Status: {currentlyServing.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Clock className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                <p className="text-base font-bold text-slate-300">Belum Ada Antrean yang Sedang Dilayani</p>
                <p className="text-xs text-slate-500 mt-1">
                  Silakan panggil nomor antrean berikutnya dari daftar tunggu di bawah.
                </p>
              </div>
            )}

            {/* TV Footer Next List */}
            <div className="border-t border-slate-800 pt-4 flex items-center justify-between flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-400 uppercase text-[11px]">Nomor Berikutnya:</span>
                <div className="flex gap-2">
                  {waitingList.slice(0, 4).map((w) => (
                    <span
                      key={w.id}
                      className="px-2.5 py-1 rounded bg-slate-800 font-mono font-bold text-cyan-300 border border-slate-700"
                    >
                      {w.queueNumber}
                    </span>
                  ))}
                  {waitingList.length === 0 && (
                    <span className="text-slate-500 text-xs italic">Tidak ada antrean tunggu</span>
                  )}
                </div>
              </div>

              {currentlyServing && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-white hover:bg-slate-800"
                    onClick={() => callQueuePatient(currentlyServing.id)}
                    leftIcon={<Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                  >
                    Panggil Ulang Suara
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStartExam(currentlyServing)}
                    leftIcon={<Stethoscope className="w-3.5 h-3.5 text-white" />}
                  >
                    Mulai Pemeriksaan SOAP
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Call Action Panel (1 Col) */}
        <div className="space-y-4">
          <Card title="Panggilan Cepat Pasien" subtitle="Panggil otomatis urutan antrean terdepan">
            <div className="space-y-3">
              {waitingList.length > 0 ? (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">
                    ANTREAN PALING DEPAN
                  </span>
                  <div className="text-3xl font-black font-mono text-amber-950 my-1">
                    {waitingList[0].queueNumber}
                  </div>
                  <p className="text-xs font-bold text-slate-900">{waitingList[0].patientName}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {waitingList[0].department} &bull; {waitingList[0].registeredTime} WIB
                  </p>
                  <div className="mt-3">
                    <Button
                      variant="primary"
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      size="md"
                      onClick={() => callQueuePatient(waitingList[0].id)}
                      leftIcon={<Volume2 className="w-4 h-4 text-white animate-pulse" />}
                    >
                      Panggil Sekarang (Bel Audio)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Semua pasien dalam antrean telah dipanggil.
                </div>
              )}

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span>Menunggu Giliran:</span>
                  <strong className="font-mono text-amber-700">{waitingList.length} Pasien</strong>
                </div>
                <div className="flex justify-between">
                  <span>Sedang / Baru Dipanggil:</span>
                  <strong className="font-mono text-blue-700">{calledList.length} Pasien</strong>
                </div>
                <div className="flex justify-between">
                  <span>Selesai Hari Ini:</span>
                  <strong className="font-mono text-emerald-700">{finishedList.length} Pasien</strong>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Full Queue Table with Status Management */}
      <Card
        title="Daftar Lengkap Antrean Hari Ini"
        subtitle="Kelola status pergerakan pasien dari menunggu hingga selesai pemeriksaan"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Antrian</th>
                <th className="py-3 px-4">Nama Pasien & No. RM</th>
                <th className="py-3 px-4">Poliklinik Tujuan</th>
                <th className="py-3 px-4">Dokter Bertugas</th>
                <th className="py-3 px-4">Prioritas</th>
                <th className="py-3 px-4">Waktu Daftar</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Tindakan Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Tidak ada antrean terdaftar di poliklinik ini.
                  </td>
                </tr>
              ) : (
                filteredQueues.map((q) => {
                  const statusVariant = {
                    Menunggu: 'warning',
                    Dipanggil: 'info',
                    'Sedang Diperiksa': 'primary',
                    Selesai: 'success',
                    Dibatalkan: 'danger'
                  }[q.status] as 'warning' | 'info' | 'primary' | 'success' | 'danger';

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                        {q.queueNumber}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectPatient(q.patientId)}
                          className="font-bold text-slate-900 hover:text-clinical-700 text-left block"
                        >
                          {q.patientName}
                        </button>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {q.mrNumber} &bull; {q.insuranceType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {q.department}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {q.doctorName}
                      </td>
                      <td className="py-3 px-4">
                        {q.priority === 'Darurat / Cito' ? (
                          <Badge variant="danger" size="sm">
                            CITO / DARURAT
                          </Badge>
                        ) : q.priority === 'Lansia/Disabilitas' ? (
                          <Badge variant="warning" size="sm">
                            Lansia / Disabilitas
                          </Badge>
                        ) : (
                          <span className="text-slate-500 text-xs">Reguler</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {q.registeredTime} WIB
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusVariant} size="sm" dot>
                          {q.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Call Patient */}
                          {q.status !== 'Selesai' && q.status !== 'Dibatalkan' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => callQueuePatient(q.id)}
                              leftIcon={<Volume2 className="w-3 h-3 text-amber-600" />}
                              title="Panggil Antrean (Audio Chime)"
                            >
                              Panggil
                            </Button>
                          )}

                          {/* Start Examination */}
                          {q.status !== 'Selesai' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleStartExam(q)}
                              leftIcon={<Stethoscope className="w-3 h-3 text-white" />}
                              title="Buka Form Pemeriksaan SOAP"
                            >
                              Periksa
                            </Button>
                          )}

                          {/* Mark Done */}
                          {q.status !== 'Selesai' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQueueStatus(q.id, 'Selesai')}
                              title="Tandai Selesai"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            </Button>
                          )}

                          {/* Cancel / Skip */}
                          {q.status !== 'Selesai' && q.status !== 'Dibatalkan' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQueueStatus(q.id, 'Dibatalkan')}
                              title="Batalkan / Lewati"
                            >
                              <UserX className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          )}

                          {q.status === 'Selesai' && (
                            <span className="text-xs text-emerald-600 font-semibold px-2 py-0.5 bg-emerald-50 rounded">
                              Tuntas
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
