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
  const { users, currentUser, resetUserPassword, addUser, settings } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', role: 'nurse' as UserRole, department: '', sipNumber: '', password: 'klinik2026' });
  const [addError, setAddError] = useState<string | null>(null);
  const [addBusy, setAddBusy] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addBusy) return;
    setAddError(null);
    if (!addForm.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email.trim())) {
      setAddError('Nama dan email yang valid wajib diisi.');
      return;
    }
    setAddBusy(true);
    const res = await addUser(addForm);
    setAddBusy(false);
    if (!res.ok) {
      setAddError(res.error || 'Gagal membuat akun.');
      return;
    }
    setShowAdd(false);
    setAddForm({ name: '', email: '', role: 'nurse', department: '', sipNumber: '', password: 'klinik2026' });
    setAddSuccess(true);
    window.setTimeout(() => setAddSuccess(false), 3500);
  };
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [savedFor, setSavedFor] = useState<string | null>(null);
  const isAdmin = currentUser.role === 'admin';

  const handleReset = async (userId: string) => {
    if (newPassword.length < settings.passwordMinLength) return;
    await resetUserPassword(userId, newPassword);
    setResettingId(null);
    setNewPassword('');
    setSavedFor(userId);
    window.setTimeout(() => setSavedFor(null), 3000);
  };

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
          {isAdmin && (
            <Button variant="primary" size="sm" onClick={() => setShowAdd((v) => !v)} leftIcon={<UserPlus className="w-4 h-4" />}>
              Tambah Pengguna
            </Button>
          )}
        </div>
      </div>

      {addSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold">
          Akun pengguna baru berhasil dibuat. Petugas bisa langsung masuk dengan email & kata sandi awalnya.
        </div>
      )}

      {showAdd && isAdmin && (
        <Card title="Tambah Pengguna Baru" subtitle="Akun dibuat di klinik ini saja. Kata sandi awal dibagikan ke petugas, lalu wajib diganti saat pertama masuk.">
          <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nama Lengkap *</label>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="cth. dr. Sari Wulandari" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Email (untuk masuk) *</label>
              <input type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} placeholder="nama@klinikanda.id" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Peran</label>
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value as UserRole })}>
                <option value="admin">Administrator</option>
                <option value="doctor">Dokter</option>
                <option value="nurse">Perawat / Pendaftaran</option>
                <option value="pharmacist">Farmasi</option>
                <option value="lab">Laboratorium / Radiologi</option>
                <option value="cashier">Kasir</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Unit / Bagian</label>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" value={addForm.department}
                onChange={(e) => setAddForm({ ...addForm, department: e.target.value })} placeholder="cth. Poli Umum" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">No. SIP (khusus dokter)</label>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" value={addForm.sipNumber}
                onChange={(e) => setAddForm({ ...addForm, sipNumber: e.target.value })} placeholder="cth. 502/SIP/2026" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Kata Sandi Awal *</label>
              <input type="text" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} required />
            </div>
            {addError && <p className="sm:col-span-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{addError}</p>}
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" variant="primary" size="sm" disabled={addBusy}>{addBusy ? 'Membuat…' : 'Buat Akun'}</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>Batal</Button>
            </div>
          </form>
        </Card>
      )}

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
                <th className="py-3 px-4 text-right">Kredensial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = currentUser.id === u.id;
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
                          <Check className="w-3.5 h-3.5" /> Akun Anda
                        </span>
                      ) : savedFor === u.id ? (
                        <span className="text-xs font-bold text-emerald-700 flex items-center justify-end gap-1">
                          <Check className="w-3.5 h-3.5" /> Sandi Direset
                        </span>
                      ) : !isAdmin ? (
                        <span className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                          <Lock className="w-3.5 h-3.5" /> Dikelola admin
                        </span>
                      ) : resettingId === u.id ? (
                        <span className="inline-flex items-center gap-1.5 justify-end">
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Sandi baru (min. 8)"
                            className="w-36 rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-clinical-500"
                            autoFocus
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleReset(u.id)}
                            disabled={newPassword.length < settings.passwordMinLength}
                          >
                            Simpan
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResettingId(null);
                              setNewPassword('');
                            }}
                          >
                            Batal
                          </Button>
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setResettingId(u.id)}
                        >
                          Reset Sandi
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
