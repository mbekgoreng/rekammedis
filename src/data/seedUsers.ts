// Akun petugas bawaan klinik demo (Klinik Tong Fang Ashiap).
// Sengaja dipisah dari mockData.ts agar layar masuk (yang hanya memerlukan
// daftar akun) tidak ikut memuat seluruh data seed aplikasi — chunk awal
// halaman login tetap ringan. mockData.ts mengekspor ulang daftar ini.
import type { User } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u-1',
    name: 'dr. Yusuf Tjakep Kalee, Sp.PD',
    email: 'yusuf.tjakep@tongfangashiap.id',
    passwordHash: 'e47f53c295a2831ab2f2c1e16986442940725c47c38bcb19571b7b81d3293303',
    role: 'doctor',
    sipNumber: 'SIP.503/442.1/DOKTER/2023',
    department: 'Poli Penyakit Dalam'
  },
  {
    id: 'u-2',
    name: 'dr. Avivien Slebew, Sp.G',
    email: 'avivien.slebew@tongfangashiap.id',
    passwordHash: '96d843791f9b4553eccf3b2b379f9bfb0c5e539445a7eb48fa3df2a39f1e451c',
    role: 'doctor',
    sipNumber: 'SIP.503/442.2/DOKTER/2024',
    department: 'Poli Gizi & Spesialis'
  },
  {
    id: 'u-3',
    name: 'Prabowo Jokowow, S teh dua gelas',
    email: 'prabowo.jokowow@tongfangashiap.id',
    passwordHash: 'baa77ca42dfa54f8c51f396c36e452f387220a0095c818ba6a0179785537bfa8',
    role: 'doctor',
    sipNumber: 'SIP.503/442.3/KONSULTAN/2026',
    department: 'Poli Umum'
  },
  {
    id: 'u-4',
    name: 'Ns. Ratna Sari, S.Kep',
    email: 'ratna.sari@tongfangashiap.id',
    passwordHash: '8891005ce6d5cccf69369a7c0b1a13f4db77ca9403cc059169cbc55f3a99a77e',
    role: 'nurse',
    department: 'Triage & Poliklinik'
  },
  {
    id: 'u-5',
    name: 'apt. Rizki Fauzi, S.Farm',
    email: 'rizki.fauzi@tongfangashiap.id',
    passwordHash: 'b39e4f573ba2cdf5bfa5922545a35de927aed2941b59f0ef441783c92cadd5b9',
    role: 'pharmacist',
    department: 'Instalasi Farmasi'
  },
  {
    id: 'u-6',
    name: 'Indah Permata',
    email: 'indah.permata@tongfangashiap.id',
    passwordHash: '4ae0dcfff84461e9ee7d24bd5f5aa8f3115d6a60a629ab91e0dff724c0f29dd1',
    role: 'cashier',
    department: 'Kasir & Pendaftaran'
  },
  {
    id: 'u-7',
    name: 'Bambang Triyono, A.Md.AK',
    email: 'bambang.lab@tongfangashiap.id',
    passwordHash: '51a8375410637dcd29b01682f8002f69308c52cd22a3b40bb96b98e66f0e943c',
    role: 'lab',
    department: 'Laboratorium & Radiologi'
  },
  {
    id: 'u-8',
    name: 'Administrator Utama',
    email: 'admin@tongfangashiap.id',
    passwordHash: 'b24cf7cae59e40bceb8d919b012589f53a10e90e16248a3fe019d5dd4c34fa1d',
    role: 'admin',
    department: 'Manajemen Sistem'
  }
];
