// Multi-klinik sisi-klien RekamMedis.
//
// Setiap klinik adalah ruang kerja terpisah: datanya disimpan di localStorage
// dengan awalan kunci sendiri, sehingga pasien/antrean/rekam medis satu klinik
// tidak pernah tercampur dengan klinik lain di perangkat yang sama.
//
// Klinik bawaan "tongfang" (Klinik Tong Fang Ashiap) memakai kunci lama
// `tongfang_v3_*` agar data demo yang sudah ada tidak hilang. Klinik hasil
// pendaftaran memakai kunci `tongfang_v3_mc_<id>_*`.
//
// CATATAN: ini tetap prototipe sisi-klien. Multi-klinik produksi memerlukan
// backend dengan isolasi tenant di server (satu basis data per tenant atau
// row-level security), autentikasi server, dan pencadangan terpusat.

import type { ClinicProfile, User } from '../types';
import { INITIAL_USERS } from '../data/mockData';
import { hashPassword } from './auth';

export const DEFAULT_CLINIC_ID = 'tongfang';
const REGISTRY_KEY = 'rekammedis_registry_v1';

export interface ClinicRegistryEntry {
  id: string;
  name: string;
  createdAt: number;
}

/** Kunci penyimpanan data milik satu klinik. */
export function dataKey(clinicId: string, key: string): string {
  return clinicId === DEFAULT_CLINIC_ID
    ? `tongfang_v3_${key}`
    : `tongfang_v3_mc_${clinicId}_${key}`;
}

export function listClinics(): ClinicRegistryEntry[] {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { clinics: ClinicRegistryEntry[] };
      if (Array.isArray(parsed.clinics) && parsed.clinics.length > 0) return parsed.clinics;
    }
  } catch {
    // abaikan — buat registry baru di bawah
  }
  const initial: ClinicRegistryEntry[] = [
    { id: DEFAULT_CLINIC_ID, name: 'Klinik Tong Fang Ashiap', createdAt: Date.now() }
  ];
  localStorage.setItem(REGISTRY_KEY, JSON.stringify({ clinics: initial }));
  return initial;
}

function saveClinics(clinics: ClinicRegistryEntry[]): void {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify({ clinics }));
}

/** Daftar pengguna satu klinik (dari penyimpanan klinik itu sendiri). */
export function readClinicUsers(clinicId: string): User[] {
  try {
    const raw = localStorage.getItem(dataKey(clinicId, 'users'));
    if (raw) {
      const parsed = JSON.parse(raw) as User[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // abaikan
  }
  return clinicId === DEFAULT_CLINIC_ID ? INITIAL_USERS : [];
}

/** Cari akun berdasarkan email di SEMUA klinik terdaftar. */
export function findAccount(email: string): { clinicId: string; user: User } | null {
  const needle = email.trim().toLowerCase();
  for (const clinic of listClinics()) {
    const user = readClinicUsers(clinic.id).find((u) => u.email.toLowerCase() === needle);
    if (user) return { clinicId: clinic.id, user };
  }
  return null;
}

export function emailTaken(email: string): boolean {
  return findAccount(email) !== null;
}

export interface RegisterClinicInput {
  clinicName: string;
  facilityType: string;
  address: string;
  phone: string;
  clinicEmail: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

/** Membuat klinik baru: profil + akun admin + ruang data kosong. */
export async function createClinic(input: RegisterClinicInput): Promise<{ clinicId: string; admin: User }> {
  const clinicId = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const adminId = `u-${clinicId}-admin`;
  const admin: User = {
    id: adminId,
    name: input.adminName,
    email: input.adminEmail.trim().toLowerCase(),
    role: 'admin',
    department: 'Administrasi & Manajemen',
    passwordHash: await hashPassword(adminId, input.adminPassword)
  };

  const profile: ClinicProfile = {
    clinicName: input.clinicName,
    licenseNumber: '',
    faskesCode: '',
    address: input.address,
    phone: input.phone,
    email: input.clinicEmail || input.adminEmail.trim().toLowerCase(),
    directorName: input.adminName,
    theme: 'tongfang'
  };

  const write = (key: string, value: unknown) =>
    localStorage.setItem(dataKey(clinicId, key), JSON.stringify(value));

  write('users', [admin]);
  write('clinic_profile', profile);
  write('currentUser', admin);
  write('patients', []);
  write('medicines', []);
  write('queues', []);
  write('schedules', []);
  write('records', []);
  write('prescriptions', []);
  write('lab_orders', []);
  write('radiology_orders', []);
  write('invoices', []);
  write('certificates', []);
  write('audit_logs', []);
  write('notifications', [
    {
      id: `notif-${clinicId}-welcome`,
      title: 'Selamat datang di RekamMedis',
      message: `Ruang kerja ${input.clinicName} berhasil dibuat. Tambahkan staf lewat menu Manajemen Pengguna, lengkapi profil di Pengaturan, lalu mulai daftarkan pasien pertama Anda.`,
      type: 'info',
      time: 'Baru saja',
      read: false,
      linkModule: 'users'
    }
  ]);

  const clinics = listClinics();
  clinics.push({ id: clinicId, name: input.clinicName, createdAt: Date.now() });
  saveClinics(clinics);

  return { clinicId, admin };
}
