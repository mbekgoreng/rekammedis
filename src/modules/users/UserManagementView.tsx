import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserPlus,
  Lock,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { UserRole } from '../../types';

export const UserManagementView: React.FC = () => {
  const { users, currentUser, switchRole } = useStore();

  const permissionMatrix: {
    module: string;
    admin: boolean;
    doctor: boolean;
    nurse: boolean;
    pharmacist: boolean;
    cashier: boolean;
    lab: boolean;
  }[] = [
    { module: 'Dashboard Eksekutif', admin: true, doctor: true, nurse: true, pharmacist: true, cashier: true, lab: true },
    { module: 'Pendaftaran Pasien & Admisi', admin: true, doctor: false, nurse: true, pharmacist: false, cashier: true, lab: false },
    { module: 'Pemeriksaan SOAP & Rekam Medis', admin: true, doctor: true, nurse: false, pharmacist: false, cashier: false, lab: false },
    { module: 'Vital Signs & Triage Awal', admin: true, doctor: true, nurse: true, pharmacist: false, cashier: false, lab: false },
    { module: 'Resep Elektronik (E-Prescribing)', admin: true, doctor: true, nurse: false, pharmacist: false, cashier: false, lab: false },
    { module: 'Dispensing Farmasi & Stok Obat', admin: true, doctor: false, nurse: false, pharmacist: true, cashier: false, lab: false },
    { module: 'Laboratorium & Validasi Hasil', admin: true, doctor: true, nurse: false, pharmacist: false, cashier: false, lab: true },
    { module: 'Radiologi & Ekspertise', admin: true, doctor: true, nurse: false, pharmacist: false, cashier: false, lab: true },
    { module: 'Kasir & Penerbitan Invoice', admin: true, doctor: false, nurse: false, pharmacist: false, cashier: true, lab: false },
    { module: 'Surat Keterangan Medis', admin: true, doctor: true, nurse: false, pharmacist: false, cashier: false, lab: false },
    { module: 'Laporan & Audit Log Keamanan', admin: true, doctor: false, nurse: false, pharmacist: false, cashier: false, lab: false }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Manajemen Pengguna & Hak Akses (RBAC)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-Based Access Control sesuai standar perlindungan data rekam medis elektronik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md">
            Peran Anda Saat Ini: {currentUser.role.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Staff User Accounts Table */}
      <Card
        title="Daftar Pengguna & Tenaga Kesehatan Faskes"
        subtitle="Akun tenaga medis berwenang yang terdaftar dalam sistem EMR"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Petugas</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Unit Kerja / Poli</th>
                <th className="py-3 px-4">No. SIP (Dokter)</th>
                <th className="py-3 px-4 text-right">Simulasi Peran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = currentUser.role === u.role;
                return (
                  <tr key={u.id} className={isCurrent ? 'bg-clinical-50/60 font-medium' : 'hover:bg-slate-50'}>
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block">{u.name}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {u.id}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-xs uppercase text-clinical-700 bg-clinical-50 px-2 py-0.5 rounded border border-clinical-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{u.department || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.sipNumber || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      {isCurrent ? (
                        <span className="text-xs font-bold text-emerald-700 flex items-center justify-end gap-1">
                          <Check className="w-3.5 h-3.5" /> Sedang Aktif
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => switchRole(u.role)}
                        >
                          Beralih ke Peran Ini
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* RBAC Permission Matrix Table */}
      <Card
        title="Matriks Hak Akses Modul Medis (Permission Matrix)"
        subtitle="Setiap role hanya memiliki otorisasi pada modul yang relevan dengan tugas profesinya"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-left">Nama Modul Pelayanan</th>
                <th className="py-3 px-3">Admin</th>
                <th className="py-3 px-3">Dokter</th>
                <th className="py-3 px-3">Perawat</th>
                <th className="py-3 px-3">Farmasi</th>
                <th className="py-3 px-3">Kasir</th>
                <th className="py-3 px-3">Laboratorium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-left font-semibold text-slate-800">
                    {row.module}
                  </td>
                  <td className="py-2.5 px-3">
                    {row.admin ? (
                      <span className="inline-block p-1 rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-block p-1 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {row.doctor ? (
                      <span className="inline-block p-1 rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-block p-1 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {row.nurse ? (
                      <span className="inline-block p-1 rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-block p-1 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {row.pharmacist ? (
                      <span className="inline-block p-1 rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-block p-1 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {row.cashier ? (
                      <span className="inline-block p-1 rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-block p-1 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {row.lab ? (
                      <span className="inline-block p-1 rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-block p-1 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
