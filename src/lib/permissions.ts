import type { UserRole } from '../types';

// Peta hak akses modul per peran — sumber tunggal penegakan RBAC.
// Dipakai Sidebar (menu yang tampil) dan App (modul yang boleh dirender).
// Selaras dengan matriks hak akses di Manajemen Pengguna.
const ALL: UserRole[] = ['admin', 'doctor', 'nurse', 'pharmacist', 'cashier', 'lab'];

export const MODULE_ROLES: Record<string, UserRole[]> = {
  dashboard: ALL,
  guide: ALL,
  queue: ALL,
  registration: ['admin', 'nurse', 'cashier'],
  patients: ['admin', 'doctor', 'nurse', 'cashier'],
  patient_detail: ['admin', 'doctor', 'nurse', 'cashier'],
  examination: ['admin', 'doctor', 'nurse'],
  medical_records: ['admin', 'doctor', 'nurse'],
  prescription: ['admin', 'doctor', 'pharmacist'],
  pharmacy: ['admin', 'pharmacist'],
  laboratory: ['admin', 'doctor', 'lab'],
  radiology: ['admin', 'doctor', 'lab'],
  letters: ['admin', 'doctor'],
  schedule: ALL,
  billing: ['admin', 'cashier'],
  reports: ['admin'],
  users: ['admin'],
  audit: ['admin'],
  settings: ['admin'],
  change_password: ALL
};

export function canAccess(role: UserRole, module: string): boolean {
  const allowed = MODULE_ROLES[module];
  if (!allowed) return true;
  return allowed.includes(role);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  doctor: 'Dokter',
  nurse: 'Perawat',
  pharmacist: 'Apoteker/Farmasi',
  cashier: 'Kasir/Pendaftaran',
  lab: 'Petugas Lab/Radiologi'
};
