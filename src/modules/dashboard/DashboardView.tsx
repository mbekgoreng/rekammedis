import React from 'react';
import {
  Users,
  UserPlus,
  Clock,
  CheckCircle2,
  Calendar,
  DollarSign,
  Volume2,
  Stethoscope,
  ArrowRight,
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

interface DashboardViewProps {
  onNavigate: (module: string) => void;
  onSelectPatient: (patientId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectPatient
}) => {
  const {
    patients,
    queues,
    schedules,
    invoices,
    auditLogs,
    medicalRecords,
    callQueuePatient,
    updateQueueStatus
  } = useStore();

  // Tren kunjungan nyata: 7 tanggal kunjungan terakhir pada rekam medis,
  // dipecah BPJS vs umum/asuransi dari data penjamin pasien.
  const insuranceByPatient = new Map(patients.map((p) => [p.id, p.insuranceType]));
  const visitDates = Array.from(new Set(medicalRecords.map((r) => r.visitDate.split(' ')[0]))).sort();
  const chartDays = visitDates.slice(-7).map((date) => {
    const dayRecords = medicalRecords.filter((r) => r.visitDate.split(' ')[0] === date);
    const bpjs = dayRecords.filter((r) => (insuranceByPatient.get(r.patientId) || '').startsWith('BPJS')).length;
    const label = new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
    return { day: label, count: dayRecords.length, bpjs, umum: dayRecords.length - bpjs };
  });
  const chartMax = Math.max(1, ...chartDays.map((d) => d.count));
  const chartTotal = chartDays.reduce((s, d) => s + d.count, 0);

  // Statistik "hari ini" hanya menghitung antrean bertanggal hari ini
  // (antrean lama tanpa tanggal dari data awal dianggap antrean berjalan)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayQueues = queues.filter((q) => !q.queueDate || q.queueDate === todayStr);
  const totalPatientsToday = todayQueues.filter((q) => q.status !== 'Dibatalkan').length;
  const waitingPatients = todayQueues.filter((q) => q.status === 'Menunggu').length;
  const inProgressPatients = todayQueues.filter((q) => q.status === 'Sedang Diperiksa' || q.status === 'Dipanggil').length;
  const completedPatients = todayQueues.filter((q) => q.status === 'Selesai').length;
  // "Bulan ini" diukur dari bulan pendaftaran pasien terakhir pada data
  const latestRegMonth = patients.reduce((max, p) => (p.registeredAt > max ? p.registeredAt : max), '');
  const newPatientsCount = patients.filter((p) => p.registeredAt.slice(0, 7) === latestRegMonth.slice(0, 7)).length;
  const latestRegLabel = latestRegMonth
    ? new Date(latestRegMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : '';
  
  const todayRevenue = invoices
    .filter((inv) => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  const stats = [
    {
      title: 'Total Pasien Hari Ini',
      value: totalPatientsToday,
      subtitle: 'Antrian terdaftar hari ini',
      icon: Users,
      color: 'bg-clinical-50 text-clinical-700 border-clinical-200'
    },
    {
      title: 'Pasien Baru',
      value: newPatientsCount,
      subtitle: `Terdaftar pada ${latestRegLabel}`,
      icon: UserPlus,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      title: 'Menunggu di Poli',
      value: waitingPatients,
      subtitle: 'Memerlukan pemanggilan',
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      title: 'Selesai Pelayanan',
      value: completedPatients,
      subtitle: 'Pemeriksaan tuntas',
      icon: CheckCircle2,
      color: 'bg-clinical-50 text-clinical-700 border-clinical-200'
    },
    {
      title: 'Pendapatan Lunas',
      value: `Rp ${todayRevenue.toLocaleString('id-ID')}`,
      subtitle: 'Total seluruh faktur berstatus Paid',
      icon: DollarSign,
      color: 'bg-clinical-50 text-clinical-700 border-clinical-200'
    },
    {
      title: 'Dokter Bertugas',
      value: schedules.filter((s) => s.isActive).length,
      subtitle: 'Sesi aktif di poliklinik',
      icon: Calendar,
      color: 'bg-clinical-50 text-clinical-700 border-clinical-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-clinical-700 uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5" /> Sistem Informasi Rekam Medis Elektronik
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Dashboard Pelayanan Klinis
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan operasional medis, antrian pasien, jadwal poliklinik, dan aktivitas hari ini.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('registration')}
            leftIcon={<UserPlus className="w-4 h-4 text-slate-600" />}
          >
            Pendaftaran Pasien
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('queue')}
            leftIcon={<Clock className="w-4 h-4 text-white" />}
          >
            Kelola Antrian Real-Time
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 line-clamp-1">
                  {stat.title}
                </span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${stat.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {stat.value}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">{stat.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Antrian Hari Ini & Jadwal Dokter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Antrian Hari Ini (2 Cols) */}
        <div className="lg:col-span-2">
          <Card
            title="Antrian Pasien Hari Ini"
            subtitle={`${todayQueues.length} pasien terdaftar &bull; ${waitingPatients} menunggu giliran`}
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('queue')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Lihat Seluruh Antrian
              </Button>
            }
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No. Antrian</th>
                    <th className="py-3 px-4">Nama Pasien</th>
                    <th className="py-3 px-4">Poliklinik & Dokter</th>
                    <th className="py-3 px-4">Jam</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queues.slice(0, 5).map((q) => {
                    const statusVariant = {
                      Menunggu: 'warning',
                      Dipanggil: 'info',
                      'Sedang Diperiksa': 'primary',
                      Selesai: 'success',
                      Dibatalkan: 'danger'
                    }[q.status] as 'warning' | 'info' | 'primary' | 'success' | 'danger';

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 text-sm">
                          {q.queueNumber}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => onSelectPatient(q.patientId)}
                            className="font-semibold text-slate-900 hover:text-clinical-700 text-left block"
                          >
                            {q.patientName}
                          </button>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {q.mrNumber} &bull; {q.insuranceType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800 block">{q.department}</span>
                          <span className="text-[11px] text-slate-500">{q.doctorName}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {q.registeredTime}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={statusVariant} size="sm" dot>
                            {q.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {q.status === 'Menunggu' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => callQueuePatient(q.id)}
                                leftIcon={<Volume2 className="w-3.5 h-3.5 text-amber-600" />}
                              >
                                Panggil
                              </Button>
                            )}
                            {q.status === 'Dipanggil' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  updateQueueStatus(q.id, 'Sedang Diperiksa');
                                  onSelectPatient(q.patientId);
                                  onNavigate('examination');
                                }}
                                leftIcon={<Stethoscope className="w-3.5 h-3.5 text-white" />}
                              >
                                Periksa
                              </Button>
                            )}
                            {q.status === 'Sedang Diperiksa' && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => updateQueueStatus(q.id, 'Selesai')}
                                leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                              >
                                Selesai
                              </Button>
                            )}
                            {q.status === 'Selesai' && (
                              <span className="text-xs text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 rounded">
                                Selesai
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Jadwal Dokter Hari Ini (1 Col) */}
        <div className="space-y-6">
          <Card
            title="Jadwal Dokter Hari Ini"
            subtitle="Poliklinik beroperasi saat ini"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('schedule')}
              >
                Lihat Jadwal
              </Button>
            }
          >
            <div className="space-y-3">
              {schedules.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{s.doctorName}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{s.department}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600 font-mono">
                      <span>{s.startTime} - {s.endTime} WIB</span>
                      <span>&bull;</span>
                      <span>{s.room}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-clinical-700">
                      {s.bookedCount} / {s.maxPatients}
                    </span>
                    <span className="block text-[10px] text-slate-400">Kuota Pasien</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Notice / Alert */}
          <div className="p-4 rounded-xl border border-clinical-200 bg-clinical-50/50 flex gap-3 text-xs text-clinical-900">
            <AlertCircle className="w-5 h-5 text-clinical-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Standar Pelayanan EMR Klinik Tong Fang Ashiap</span>
              <p className="mt-0.5 text-clinical-800 leading-relaxed">
                Pastikan identifikasi pasien menggunakan 2 parameter (Nama & Tanggal Lahir) sebelum memulai anamnesis atau pemeriksaan fisik.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Grafik Kunjungan & Log Aktivitas Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Kunjungan Pasien (2 Cols) */}
        <div className="lg:col-span-2">
          <Card
            title="Tren Kunjungan 7 Tanggal Terakhir"
            subtitle="Dihitung dari tanggal kunjungan pada rekam medis"
            action={
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <TrendingUp className="w-3.5 h-3.5" /> {chartTotal} kunjungan tercatat
              </div>
            }
          >
            {/* Simple Clinical Bar Chart */}
            <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
              {chartDays.length === 0 && (
                <p className="text-xs text-slate-400 self-center mx-auto">Belum ada rekam medis tercatat.</p>
              )}
              {chartDays.map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {bar.count}
                  </span>
                  <div
                    className="w-full max-w-[36px] bg-slate-100 rounded-t-sm overflow-hidden flex flex-col justify-end transition-all group-hover:brightness-95"
                    style={{ height: `${(bar.count / chartMax) * 100}%` }}
                  >
                    <div
                      className="bg-clinical-700 w-full"
                      style={{ height: `${bar.count ? (bar.bpjs / bar.count) * 100 : 0}%` }}
                      title={`BPJS: ${bar.bpjs}`}
                    />
                    <div
                      className="bg-clinical-500 w-full"
                      style={{ height: `${bar.count ? (bar.umum / bar.count) * 100 : 0}%` }}
                      title={`Umum/Swasta: ${bar.umum}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 truncate text-center block w-full">
                    {bar.day.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-clinical-700" />
                <span>Pasien BPJS Kesehatan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-clinical-500" />
                <span>Pasien Umum / Asuransi Swasta</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Audit Log / Aktivitas Terbaru (1 Col) */}
        <div>
          <Card
            title="Aktivitas Klinis Terbaru"
            subtitle="Audit trail operasional rekam medis"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('audit')}
              >
                Log Lengkap
              </Button>
            }
          >
            <div className="space-y-3.5">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                    <span className="font-semibold text-clinical-700">{log.module}</span>
                    <span>{log.timestamp.split(' ')[1]} WIB</span>
                  </div>
                  <p className="font-semibold text-slate-800 leading-snug">{log.action}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">{log.details}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Oleh: {log.userName}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

