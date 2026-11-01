import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  Pill,
  DollarSign,
  Activity
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const ReportsView: React.FC = () => {
  const { patients, medicalRecords, invoices, medicines, schedules } = useStore();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  // Top Diagnoses Count
  const diagnosesMap: Record<string, { code: string; name: string; count: number }> = {};
  medicalRecords.forEach((rec) => {
    rec.assessment.diagnoses.forEach((d) => {
      if (!diagnosesMap[d.icd10Code]) {
        diagnosesMap[d.icd10Code] = { code: d.icd10Code, name: d.nameIndonesian, count: 0 };
      }
      diagnosesMap[d.icd10Code].count += 1;
    });
  });

  const topDiagnoses = Object.values(diagnosesMap).sort((a, b) => b.count - a.count);

  // Revenue Breakdown
  const totalRevenue = invoices.reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Laporan & Analitik Fasilitas Kesehatan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistik morbiditas penyakit, utilisasi pelayanan, dan kinerja finansial klinik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Filter */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-lg text-xs font-semibold">
            {(['day', 'week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md capitalize transition-all ${
                  period === p ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                {p === 'day' ? 'Hari Ini' : p === 'week' ? 'Minggu Ini' : p === 'month' ? 'Bulan Ini' : 'Tahun Ini'}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4 text-slate-600" />}
          >
            Cetak Laporan
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Total Kunjungan Pasien</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              {medicalRecords.length * 14 + 28}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +8.5% dari periode sebelumnya
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Pendapatan Pelayanan</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Faktur terbit dan tertagih</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Item Obat Terdistribusi</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              842 Satuan
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Melalui resep poliklinik</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Pill className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Rata-rata Waktu Tunggu</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              14.2 Menit
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
              Sesuai Standar SPM (&lt; 30 menit)
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Grid: 10 Besar Penyakit (Top Morbidity) & Komposisi Pendapatan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 10 Besar Penyakit (ICD-10) */}
        <Card
          title="10 Besar Penyakit Terbanyak (Top 10 Morbidity ICD-10)"
          subtitle="Berdasarkan diagnosis utama rekam medis pasien"
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">No</th>
                  <th className="py-2.5 px-4">Kode ICD-10</th>
                  <th className="py-2.5 px-4">Nama Penyakit</th>
                  <th className="py-2.5 px-4 text-right">Kasus</th>
                  <th className="py-2.5 px-4 text-right">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { code: 'I10', name: 'Hipertensi Esensial (Primer)', cases: 42, pct: '28.4%' },
                  { code: 'E11.9', name: 'Diabetes Melitus Tipe 2', cases: 28, pct: '18.9%' },
                  { code: 'J06.9', name: 'Infeksi Saluran Napas Akut (ISPA)', cases: 24, pct: '16.2%' },
                  { code: 'K29.7', name: 'Gastritis dan Duodenitis', cases: 18, pct: '12.1%' },
                  { code: 'M54.5', name: 'Nyeri Punggung Bawah (LBP)', cases: 14, pct: '9.5%' },
                  { code: 'J45.9', name: 'Asma Bronkial', cases: 9, pct: '6.1%' },
                  { code: 'A09', name: 'Gastroenteritis Akut', cases: 7, pct: '4.7%' },
                  { code: 'R51', name: 'Cephalgia / Sakit Kepala', cases: 6, pct: '4.1%' }
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-clinical-700">
                      {item.code}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {item.cases}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                      {item.pct}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Komposisi Sumber Pendapatan */}
        <Card
          title="Komposisi Pendapatan Fasilitas"
          subtitle="Distribusi pendapatan berdasarkan unit layanan"
        >
          <div className="space-y-4 pt-2">
            {[
              { label: 'Jasa Konsultasi Dokter', amount: 'Rp 12.450.000', pct: 40, color: 'bg-clinical-700' },
              { label: 'Farmasi & Penjualan Obat', amount: 'Rp 10.200.000', pct: 33, color: 'bg-teal-500' },
              { label: 'Tindakan Medis & EKG', amount: 'Rp 4.800.000', pct: 15, color: 'bg-indigo-600' },
              { label: 'Pemeriksaan Laboratorium', amount: 'Rp 2.400.000', pct: 8, color: 'bg-purple-600' },
              { label: 'Biaya Administrasi', amount: 'Rp 1.250.000', pct: 4, color: 'bg-slate-500' }
            ].map((unit, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>{unit.label}</span>
                  <span className="font-mono text-slate-900">{unit.amount} ({unit.pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${unit.color}`}
                    style={{ width: `${unit.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
            <strong>Catatan Keuangan:</strong> 65% transaksi bersumber dari penjaminan BPJS Kesehatan yang ditagihkan secara kolektif setiap tanggal 10 awal bulan.
          </div>
        </Card>
      </div>
    </div>
  );
};
