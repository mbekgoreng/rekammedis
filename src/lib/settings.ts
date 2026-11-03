// Pengaturan klinik RekamMedis — satu objek per klinik, tersimpan bersama
// data klinik itu (lihat StoreContext: kunci 'settings').
//
// Prinsip: pengaturan yang memengaruhi perilaku BENAR-BENAR terhubung ke
// modulnya (biaya admin & PPN masuk invoice, awalan nomor RM dipakai saat
// mendaftarkan pasien, daftar poli menyaring pilihan pendaftaran, ambang
// kadaluarsa dipakai farmasi, kebijakan sandi & sesi ditegakkan saat login).
// Pengaturan yang memerlukan backend (kredensial SATUSEHAT/BPJS, webhook,
// kunci API) disimpan sebagai konfigurasi dan DILABELI belum terhubung —
// tidak berpura-pura aktif.

export interface ClinicSettings {
  // --- Operasional layanan ---
  poliList: string[];
  openTime: string;
  closeTime: string;
  consultDurationMin: number;
  lateToleranceMin: number;
  holidays: string; // daftar tanggal ISO, dipisah koma

  // --- Tarif & keuangan ---
  adminFee: number;
  defaultConsultFee: number;
  taxPercent: number;
  paymentMethods: string[];
  maxDiscountPercent: number;

  // --- Farmasi ---
  defaultMinimumStock: number;
  expiryWarningDays: number;
  defaultMarginPercent: number;

  // --- Rekam medis & dokumen ---
  mrPrefix: string;
  invoicePrefix: string;
  letterFooter: string;
  retentionYears: number;
  consentText: string;

  // --- Keamanan & akun ---
  passwordMinLength: number;
  sessionHours: number;
  rememberDays: number;
  maxLoginAttempts: number;
  lockMinutes: number;

  // --- Notifikasi (template; pengiriman butuh gateway di backend) ---
  notificationsEnabled: boolean;
  queueCallTemplate: string;
  reminderTemplate: string;

  // --- Integrasi (konfigurasi tersimpan; koneksi butuh backend) ---
  satusehatOrgId: string;
  satusehatEnv: 'sandbox' | 'production';
  bpjsConsId: string;
  apiKey: string;
  webhookUrl: string;

  // --- Cabang, portal & layanan lanjutan ---
  branches: string[];
  planName: string;
  onlineRegistrationEnabled: boolean;
  onlineQuotaPercent: number;
  telemedicineEnabled: boolean;
  telemedicineFee: number;
  aiAssistEnabled: boolean;
}

export const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  poliList: ['Poli Umum', 'Poli Penyakit Dalam', 'Poli Gizi & Dietetik'],
  openTime: '08:00',
  closeTime: '21:00',
  consultDurationMin: 15,
  lateToleranceMin: 15,
  holidays: '',

  adminFee: 25000,
  defaultConsultFee: 150000,
  taxPercent: 0,
  paymentMethods: ['Tunai', 'QRIS', 'Debit', 'Transfer'],
  maxDiscountPercent: 10,

  defaultMinimumStock: 10,
  expiryWarningDays: 180,
  defaultMarginPercent: 20,

  mrPrefix: 'RM',
  invoicePrefix: 'INV',
  letterFooter: 'Dokumen ini diterbitkan secara elektronik oleh sistem RekamMedis dan sah tanpa tanda tangan basah selama dapat diverifikasi di fasilitas penerbit.',
  retentionYears: 5,
  consentText: 'Dengan mendaftar, pasien/wali menyetujui pemrosesan data kesehatan untuk keperluan pelayanan, penagihan, dan kewajiban pelaporan sesuai peraturan yang berlaku.',

  passwordMinLength: 8,
  sessionHours: 12,
  rememberDays: 7,
  maxLoginAttempts: 5,
  lockMinutes: 1,

  notificationsEnabled: true,
  queueCallTemplate: 'Nomor antrean {nomor} atas nama {nama}, silakan menuju {poli}.',
  reminderTemplate: 'Halo {nama}, jangan lupa jadwal kontrol Anda di {klinik} pada {tanggal}. Balas pesan ini untuk konfirmasi.',

  satusehatOrgId: '',
  satusehatEnv: 'sandbox',
  bpjsConsId: '',
  apiKey: '',
  webhookUrl: '',

  branches: [],
  planName: 'Prototipe (tanpa langganan)',
  onlineRegistrationEnabled: false,
  onlineQuotaPercent: 30,
  telemedicineEnabled: false,
  telemedicineFee: 75000,
  aiAssistEnabled: false
};

export function mergeSettings(stored: Partial<ClinicSettings> | null | undefined): ClinicSettings {
  return { ...DEFAULT_CLINIC_SETTINGS, ...(stored || {}) };
}
