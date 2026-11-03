import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Users,
  Pill,
  DollarSign,
  FileWarning
} from 'lucide-react';
import { computeBpjsStats } from '../../lib/bpjs';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

type Period = 'day' | 'week' | 'month' | 'year';

const PERIOD_DAYS: Record<Period, number> = { day: 1, week: 7, month: 30, year: 365 };
const PERIOD_LABEL: Record<Period, string> = {
  day: 'Hari Terakhir',
  week: '7 Hari Terakhir',
  month: '30 Hari Terakhir',
  year: '12 Bulan Terakhir'
};
const CATEGORY_COLORS: Record<string, string> = {
  Konsultasi: 'bg-clinical-700',
  Farmasi: 'bg-teal-500',
  Tindakan: 'bg-indigo-600',
  Laboratorium: 'bg-purple-600',
  Radiologi: 'bg-amber-500',
  Administrasi: 'bg-slate-500'
};

const parseDate = (value: string): Date | null => {
  const d = new Date(value.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
};

export const ReportsView: React.FC = () => {
  const { patients, medicalRecords, invoices, prescriptions, certificates } = useStore();
  const kbk = computeBpjsStats(patients, medicalRecords, certificates);
  const [period, setPeriod] = useState<Period>('month');

  // Jangkar periode = tanggal data terbaru yang ada (dengan data live, ini ~hari ini),
  // supaya filter selalu bekerja terhadap rentang yang benar-benar berisi data.
  const anchor = useMemo(() => {
    let max: Date | null = null;
    const consider = (value: string) => {
      const d = parseDate(value);
      if (d && (!max || d > max)) max = d;
    };
    medicalRecords.forEach((r) => consider(r.visitDate));
    invoices.forEach((i) => consider(i.date));
    prescriptions.forEach((p) => consider(p.date));
    return max ?? new Date();
  }, [medicalRecords, invoices, prescriptions]);

  const rangeStart = useMemo(() => {
    const start = new Date(anchor);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (PERIOD_DAYS[period] - 1));
    return start;
  }, [anchor, period]);

  const inPeriod = (value: string) => {
    const d = parseDate(value);
    if (!d) return false;
    const end = new Date(anchor);
    end.setHours(23, 59, 59, 999);
    return d >= rangeStart && d <= end;
  };

  const periodRecords = medicalRecords.filter((r) => inPeriod(r.visitDate));
  const periodInvoices = invoices.filter((i) => inPeriod(i.date));
  const periodPrescriptions = prescriptions.filter((p) => inPeriod(p.date));

  // KPI — semua dihitung dari data
  const visitCount = periodRecords.length;
  const paidRevenue = periodInvoices
    .filter((i) => i.status === 'Paid')
    .reduce((sum, i) => sum + i.total, 0);
  const outstanding = periodInvoices
    .filter((i) => i.status === 'Unpaid' || i.status === 'Partial')
    .reduce((sum, i) => sum + (i.total - i.paidAmount), 0);
  const medicinesDistributed = periodPrescriptions
    .filter((p) => p.status === 'Selesai')
    .reduce((sum, p) => sum + p.items.reduce((s, item) => s + item.quantity, 0), 0);

  // Morbiditas dari diagnosis nyata pada periode terpilih
  const diagnosesMap: Record<string, { code: string; name: string; count: number }> = {};
  periodRecords.forEach((rec) => {
    rec.assessment.diagnoses.forEach((d) => {
      if (!diagnosesMap[d.icd10Code]) {
        diagnosesMap[d.icd10Code] = { code: d.icd10Code, name: d.nameIndonesian, count: 0 };
      }
      diagnosesMap[d.icd10Code].count += 1;
    });
  });
  const topDiagnoses = Object.values(diagnosesMap).sort((a, b) => b.count - a.count);
  const totalDiagnoses = topDiagnoses.reduce((s, d) => s + d.count, 0);

  // Komposisi pendapatan dari kategori item faktur (faktur lunas, periode terpilih)
  const categoryMap: Record<string, number> = {};
  periodInvoices
    .filter((i) => i.status === 'Paid')
    .forEach((inv) => {
      inv.items.forEach((item) => {
        categoryMap[item.category] = (categoryMap[item.category] || 0) + item.subtotal;
      });
    });
  const categoryRows = Object.entries(categoryMap)
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount);
  const categoryTotal = categoryRows.reduce((s, r) => s + r.amount, 0);

  const patientName = (id: string) => patients.find((p) => p.id === id)?.name || id;

  const handleExportCsv = () => {
    const lines: string[] = [
      `Laporan RekamMedis — Periode ${PERIOD_LABEL[period]} (jangkar data: ${anchor.toISOString().split('T')[0]})`,
      '',
      'RINGKASAN',
      `Kunjungan (rekam medis final/draft pada periode),${visitCount}`,
      `Pendapatan lunas (Rp),${paidRevenue}`,
      `Piutang belum tertagih (Rp),${outstanding}`,
      `Item obat terdistribusi (resep selesai),${medicinesDistributed}`,
      '',
      'MORBIDITAS ICD-10,Kode,Nama,Kasus,Persentase',
      ...topDiagnoses.map(
        (d) => `,${d.code},"${d.name}",${d.count},${totalDiagnoses ? ((d.count / totalDiagnoses) * 100).toFixed(1) : '0.0'}%`
      ),
      '',
      'KOMPOSISI PENDAPATAN LUNAS PER KATEGORI,Kategori,Jumlah (Rp),Persentase',
      ...categoryRows.map(
        (r) => `,${r.label},${r.amount},${categoryTotal ? ((r.amount / categoryTotal) * 100).toFixed(1) : '0.0'}%`
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_rekammedis_${period}_${anchor.toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Laporan &amp; Analitik Fasilitas Kesehatan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Seluruh angka dihitung langsung dari data rekam medis, resep, dan faktur.{' '}
            Rentang {PERIOD_LABEL[period].toLowerCase()} dihitung dari tanggal data terakhir:{' '}
            {anchor.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-200/80 p-1 rounded-lg text-xs font-semibold">
            {(['day', 'week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  period === p ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                {p === 'day' ? 'Hari' : p === 'week' ? 'Minggu' : p === 'month' ? 'Bulan' : 'Tahun'}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-4 h-4 text-slate-600" />}
          >
            Unduh CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4 text-slate-600" />}
          >
            Cetak
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Kunjungan Pasien</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{visitCount}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Rekam medis pada periode ini</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Pendapatan Lunas</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              Rp {paidRevenue.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Faktur berstatus Paid pada periode ini</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Item Obat Terdistribusi</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              {medicinesDistributed} Satuan
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Dari resep berstatus Selesai</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Pill className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Piutang Belum Tertagih</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              Rp {outstanding.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Sisa faktur Unpaid / Partial</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <FileWarning className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Indikator KBK (BPJS) — ringkasan, detail di menu BPJS & Kapitasi */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Indikator KBK — {kbk.periodLabel}</p>
            <p className="text-[10px] text-slate-400">Pemantauan internal dari data nyata; detail & daftar kerja di menu BPJS & Kapitasi</p>
          </div>
          <div className="flex gap-8 text-xs">
            <span>Angka Kontak<br /><strong className="text-base text-slate-900">{kbk.angkaKontak}‰</strong> <span className="text-slate-400">/ ≥150‰</span></span>
            <span>Rasio Rujukan<br /><strong className="text-base text-slate-900">{kbk.rasioRujukan.toFixed(1)}%</strong> <span className="text-slate-400">/ ≤2%</span></span>
            <span>Prolanis Terkendali<br /><strong className="text-base text-slate-900">{kbk.prolanisControlled}/{kbk.prolanis.length}</strong></span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Morbiditas nyata */}
        <Card
          title="Penyakit Terbanyak (Morbiditas ICD-10)"
          subtitle={`Berdasarkan ${totalDiagnoses} diagnosis pada periode ini`}
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
                {topDiagnoses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 px-4 text-center text-slate-400">
                      Tidak ada rekam medis pada periode ini.
                    </td>
                  </tr>
                )}
                {topDiagnoses.slice(0, 10).map((item, idx) => (
                  <tr key={item.code} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-clinical-700">{item.code}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">{item.count}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                      {totalDiagnoses ? ((item.count / totalDiagnoses) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Komposisi pendapatan per kategori item */}
        <Card
          title="Komposisi Pendapatan per Kategori Layanan"
          subtitle="Dari item faktur berstatus lunas pada periode ini"
        >
          <div className="space-y-4 pt-2">
            {categoryRows.length === 0 && (
              <p className="text-xs text-slate-400">Tidak ada faktur lunas pada periode ini.</p>
            )}
            {categoryRows.map((row) => {
              const pct = categoryTotal ? (row.amount / categoryTotal) * 100 : 0;
              return (
                <div key={row.label} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>{row.label}</span>
                    <span className="font-mono text-slate-900">
                      Rp {row.amount.toLocaleString('id-ID')} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${CATEGORY_COLORS[row.label] || 'bg-clinical-600'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
            <strong>Catatan:</strong> komposisi dihitung dari kategori item pada faktur lunas
            (konsultasi, farmasi, tindakan, laboratorium, radiologi, administrasi) — bukan estimasi.
            Total pasien terdaftar dalam sistem saat ini: {patients.length} orang
            {periodRecords.length > 0
              ? `; kunjungan terakhir tercatat atas nama ${patientName(periodRecords[0].patientId)}.`
              : '.'}
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <BarChart3 className="w-3.5 h-3.5" />
        <span>
          Laporan ini tidak lagi memakai angka contoh: jika sebuah kartu menunjukkan nol, berarti memang tidak ada data pada periode tersebut.
        </span>
      </div>
    </div>
  );
};
