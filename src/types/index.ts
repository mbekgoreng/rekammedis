export type UserRole = 'admin' | 'doctor' | 'nurse' | 'pharmacist' | 'cashier' | 'lab';

export interface ClinicProfile {
  clinicName: string;
  licenseNumber: string;
  faskesCode: string;
  address: string;
  phone: string;
  email: string;
  directorName: string;
  /** ID tema warna aplikasi (lihat src/lib/themes.ts) — hanya mengubah warna. */
  theme?: string;
  /** Logo klinik sendiri (data URL) untuk kop surat & identitas di aplikasi. */
  logoDataUrl?: string;
  npwp?: string;
  facilityType?: string;
  accreditation?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  sipNumber?: string; // Surat Izin Praktik untuk dokter
  department?: string;
  passwordHash?: string; // Hash SHA-256 bergaram (lihat src/lib/auth.ts)
  isActive?: boolean;
}

export interface Patient {
  id: string;
  mrNumber: string; // Nomor Rekam Medis (e.g., RM-2026-0012)
  nik: string; // NIK KTP (16 digits)
  name: string;
  gender: 'Laki-laki' | 'Perempuan';
  birthDate: string; // YYYY-MM-DD
  age: number;
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Tidak Tahu';
  phone: string;
  email: string;
  address: string;
  occupation: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  allergies: string[]; // e.g. ["Penicillin", "Kacang", "Aspirin"]
  chronicDiseases: string[]; // e.g. ["Hipertensi", "Diabetes Mellitus Tipe 2"]
  insuranceType: 'BPJS Kesehatan' | 'Asuransi Swasta' | 'Umum / Mandiri';
  insuranceNumber?: string;
  /** Kepesertaan BPJS sudah diverifikasi MANUAL oleh petugas (bukan bridging). */
  bpjsVerified?: boolean;
  status: 'Aktif' | 'Rawat Inap' | 'Selesai' | 'Nonaktif';
  registeredAt: string;
  photoUrl?: string;
}

export interface VitalSigns {
  systolic: number; // mmHg
  diastolic: number; // mmHg
  heartRate: number; // bpm
  temperature: number; // °C
  respiratoryRate: number; // breaths/min
  spO2: number; // %
  weight: number; // kg
  height: number; // cm
  bmi: number;
  bmiCategory: 'Underweight' | 'Normal' | 'Overweight' | 'Obesitas';
}

export interface PhysicalExamination {
  head: string;
  eyes: string;
  ears: string;
  nose: string;
  throat: string;
  neck: string;
  thorax: string;
  heart: string;
  lungs: string;
  abdomen: string;
  extremities: string;
  neurological: string;
}

export interface DiagnosisItem {
  id: string;
  icd10Code: string;
  nameIndonesian: string;
  isPrimary: boolean;
  notes?: string;
}

export interface MedicalProcedure {
  id: string;
  code: string;
  name: string;
  cost: number;
  notes?: string;
}

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  medicineName: string;
  dosage: string; // e.g. "500 mg"
  frequency: string; // e.g. "3 x sehari"
  timing: 'Sebelum makan' | 'Sesudah makan' | 'Bersama makan' | 'Saat diperlukan (PRN)';
  durationDays: number;
  quantity: number;
  unit: string; // Tablet, Kapsul, Botol, Tube
  instructions: string; // e.g. "Habiskan"
  pricePerUnit: number;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  mrNumber: string;
  doctorId: string;
  doctorName: string;
  medicalRecordId: string;
  date: string;
  status: 'Draft' | 'Menunggu Farmasi' | 'Diproses' | 'Siap Diambil' | 'Selesai' | 'Dibatalkan';
  items: PrescriptionItem[];
  notes?: string;
  totalCost: number;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  mrNumber: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  visitDate: string;
  visitType: 'Baru' | 'Kontrol Rutin' | 'Rujukan' | 'Darurat';
  subjective: {
    chiefComplaint: string; // Keluhan Utama
    historyOfPresentIllness: string; // Riwayat Penyakit Sekarang
    historyOfPastIllness: string; // Riwayat Penyakit Dahulu
    currentMedications: string; // Obat yang sedang diminum
  };
  objective: {
    vitals: VitalSigns;
    physicalExam: PhysicalExamination;
  };
  assessment: {
    diagnoses: DiagnosisItem[];
    clinicalImpression: string;
  };
  plan: {
    therapyPlan: string;
    procedures: MedicalProcedure[];
    prescriptions: PrescriptionItem[];
    doctorNotes: string;
    nextVisitDate?: string;
    educationNotes?: string;
  };
  status: 'Draft' | 'Final' | 'Revisi';
  createdAt: string;
  updatedAt: string;
}

export interface QueueItem {
  id: string;
  queueNumber: string; // e.g. "A-023"
  patientId: string;
  patientName: string;
  mrNumber: string;
  doctorName: string;
  doctorId: string;
  department: string;
  registeredTime: string;
  queueDate?: string; // Tanggal antrean (YYYY-MM-DD)
  visitType?: string; // Baru / Kontrol Rutin / Rujukan / Darurat
  chiefComplaint?: string; // Keluhan utama saat pendaftaran
  status: 'Menunggu' | 'Dipanggil' | 'Sedang Diperiksa' | 'Selesai' | 'Dibatalkan';
  priority: 'Biasa' | 'Lansia/Disabilitas' | 'Darurat / Cito';
  insuranceType: string;
}

export interface Medicine {
  id: string;
  code: string;
  name: string;
  category: 'Antibiotik' | 'Analgesik / Antipiretik' | 'Antihipertensi' | 'Antidiabetes' | 'Antihistamin' | 'Vitamin & Suplemen' | 'Gastrointestinal' | 'Kortikosteroid';
  form: 'Tablet' | 'Kapsul' | 'Sirup' | 'Injeksi' | 'Salep / Gel' | 'Tetes Mata';
  strength: string; // e.g. "500 mg", "10 mg"
  stock: number;
  minimumStock: number;
  unit: string;
  price: number;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  supplier: string;
  indication: string;
  sideEffects?: string;
  contraindications?: string[];
}

export interface LabOrder {
  id: string;
  orderNumber: string; // e.g. "LAB-2026-0081"
  patientId: string;
  patientName: string;
  mrNumber: string;
  doctorName: string;
  orderDate: string;
  status: 'Requested' | 'Sample Collected' | 'Processing' | 'Completed' | 'Validated';
  items: {
    testName: string;
    category: string;
    resultValue?: string;
    referenceRange: string;
    unit: string;
    isAbnormal?: boolean;
    notes?: string;
  }[];
  notes?: string;
  validatedBy?: string;
  validatedAt?: string;
}

export interface RadiologyOrder {
  id: string;
  orderNumber: string; // e.g. "RAD-2026-0042"
  patientId: string;
  patientName: string;
  mrNumber: string;
  doctorName: string;
  orderDate: string;
  examinationType: string; // e.g. "Foto Thorax PA", "USG Abdomen 2 Posisi", "Panoramic Gigi"
  clinicalIndication: string;
  status: 'Permintaan' | 'Dijadwalkan' | 'Selesai Scan' | 'Hasil Terbaca';
  findings?: string; // Hasil ekspertise dokter spesialis radiologi
  impression?: string;
  imageUrl?: string;
  radiologistName?: string;
  readingDate?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  category: 'Konsultasi' | 'Tindakan' | 'Farmasi' | 'Laboratorium' | 'Radiologi' | 'Administrasi';
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-0312"
  medicalRecordId?: string; // Kunjungan asal invoice (mencegah penagihan ganda)
  patientId: string;
  patientName: string;
  mrNumber: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  paymentMethod?: 'Tunai' | 'QRIS' | 'Transfer Bank' | 'Kartu Debit' | 'Kartu Kredit' | 'Klaim BPJS';
  status: 'Unpaid' | 'Partial' | 'Paid' | 'Cancelled';
  paymentDate?: string;
  cashierName: string;
}

export interface MedicalCertificate {
  id: string;
  certificateNumber: string;
  patientId: string;
  patientName: string;
  mrNumber: string;
  patientAge: number;
  patientGender: string;
  patientAddress: string;
  doctorName: string;
  doctorSip: string;
  type: 'Surat Keterangan Sakit' | 'Surat Keterangan Berbadan Sehat' | 'Surat Rujukan' | 'Surat Kontrol Ulang';
  issueDate: string;
  startDate?: string; // untuk sakit
  endDate?: string;
  durationDays?: number;
  diagnosis?: string;
  purpose?: string; // e.g. "Keperluan Melamar Pekerjaan"
  referralHospital?: string; // untuk rujukan
  referralReason?: string;
  notes?: string;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  department: string;
  dayOfWeek: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  startTime: string; // "08:00"
  endTime: string; // "14:00"
  room: string;
  maxPatients: number;
  bookedCount: number;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  role: string;
  module: 'Pasien' | 'Rekam Medis' | 'Resep' | 'Farmasi' | 'Laboratorium' | 'Radiologi' | 'Antrian' | 'Kasir' | 'Pengguna' | 'Pengaturan';
  action: string;
  details: string;
  ipAddress: string;
}

export interface ClinicNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  read: boolean;
  linkModule?: string;
}
