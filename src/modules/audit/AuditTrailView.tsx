import React, { useState } from 'react';
import {
  History,
  Search,
  Shield,
  Filter,
  Download,
  Calendar,
  Lock
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

const PAGE_SIZE = 50;

export const AuditTrailView: React.FC = () => {
  const { auditLogs } = useStore();
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('ALL');
  const [page, setPage] = useState(1);

  const filteredLogs = auditLogs.filter((log) => {
    const q = search.toLowerCase();
    const matchesSearch =
      log.userName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.ipAddress.includes(q);

    const matchesModule = filterModule === 'ALL' || log.module === filterModule;
    return matchesSearch && matchesModule;
  });

  // Paginasi sederhana: 50 baris per halaman atas log hasil filter saat ini
  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedLogs = filteredLogs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Ekspor CSV: mengunduh SELURUH log hasil filter saat ini (bukan hanya halaman tampil)
  const handleExportCsv = () => {
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const header = ['Waktu', 'Pengguna', 'Peran', 'Modul', 'Aktivitas', 'Detail Perubahan', 'IP Address'];
    const lines = filteredLogs.map((log) =>
      [log.timestamp, log.userName, log.role, log.module, log.action, log.details, log.ipAddress].map(esc).join(',')
    );
    const blob = new Blob([[header.map(esc).join(','), ...lines].join('\r\n')], {
      type: 'text/csv;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const modules = ['ALL', 'Pasien', 'Rekam Medis', 'Resep', 'Farmasi', 'Laboratorium', 'Radiologi', 'Antrian', 'Kasir', 'Pengguna', 'Pengaturan'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Jejak Audit Keamanan (Security Audit Trail)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log forensik seluruh aktivitas medis dan modifikasi data pasien: Siapa &bull; Melakukan Apa &bull; Kapan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Ekspor CSV
          </Button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-200 text-xs font-semibold" title="Log tersimpan lokal di perangkat ini. Integritas anti-tamper (hash-chain sisi server) memerlukan backend.">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Pencatatan Aktivitas Lokal</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card noPadding className="p-3 bg-white border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari user, tindakan, detail perubahan, atau IP address..."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinical-500"
            />
          </div>

          <select
            value={filterModule}
            onChange={(e) => {
              setFilterModule(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
          >
            {modules.map((m) => (
              <option key={m} value={m}>
                {m === 'ALL' ? 'Semua Modul Audit' : `Modul: ${m}`}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-44">Waktu (Timestamp)</th>
                <th className="py-3 px-4">Pengguna (User & Role)</th>
                <th className="py-3 px-4">Modul</th>
                <th className="py-3 px-4">Aktivitas (Action)</th>
                <th className="py-3 px-4">Keterangan / Detail Perubahan</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Tidak ada catatan audit log yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                pagedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {log.timestamp} WIB
                    </td>
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block">{log.userName}</strong>
                      <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-clinical-700 bg-clinical-50 px-2 py-0.5 rounded border border-clinical-200 text-[11px]">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-600 leading-relaxed max-w-md">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-right text-[11px]">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginasi */}
        {filteredLogs.length > 0 && (
          <div className="p-3.5 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Halaman <strong className="text-slate-800">{safePage}</strong> dari{' '}
              <strong className="text-slate-800">{pageCount}</strong> &bull; Menampilkan{' '}
              <strong className="text-slate-800">
                {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredLogs.length)}
              </strong>{' '}
              dari <strong className="text-slate-800">{filteredLogs.length}</strong> log
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={safePage >= pageCount}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
