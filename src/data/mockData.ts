import {
  Patient,
  DoctorSchedule,
  Medicine,
  QueueItem,
  MedicalRecord,
  Prescription,
  LabOrder,
  RadiologyOrder,
  Invoice,
  MedicalCertificate,
  AuditLog,
  ClinicNotification,
  User
} from '../types';

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

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'p-1',
    mrNumber: 'RM-2026-0001',
    nik: '3171051203850001',
    name: 'Budi Santoso',
    gender: 'Laki-laki',
    birthDate: '1985-03-12',
    age: 41,
    bloodType: 'O+',
    phone: '0812-3456-7890',
    email: 'budi.santoso@email.com',
    address: 'Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan',
    occupation: 'Karyawan Swasta',
    emergencyContact: {
      name: 'Sri Wahyuni',
      relation: 'Istri',
      phone: '0812-9876-5432'
    },
    allergies: ['Penicillin', 'Sulfa'],
    chronicDiseases: ['Hipertensi Tingkat 1'],
    insuranceType: 'BPJS Kesehatan',
    insuranceNumber: '0001234567891',
    status: 'Aktif',
    registeredAt: '2025-01-15'
  },
  {
    id: 'p-2',
    mrNumber: 'RM-2026-0002',
    nik: '3171055408920003',
    name: 'Siti Rahma',
    gender: 'Perempuan',
    birthDate: '1992-08-14',
    age: 33,
    bloodType: 'A+',
    phone: '0813-2233-4455',
    email: 'siti.rahma@email.com',
    address: 'Jl. Melati Indah Blok C3/12, Tebet, Jakarta Selatan',
    occupation: 'Guru PNS',
    emergencyContact: {
      name: 'Agus Setiawan',
      relation: 'Suami',
      phone: '0813-9988-7766'
    },
    allergies: ['Kacang Tanah', 'Aspirin'],
    chronicDiseases: ['Asma Bronkial'],
    insuranceType: 'BPJS Kesehatan',
    insuranceNumber: '0002345678912',
    status: 'Aktif',
    registeredAt: '2025-02-10'
  },
  {
    id: 'p-3',
    mrNumber: 'RM-2026-0003',
    nik: '3171062005780002',
    name: 'Ahmad Fauzan',
    gender: 'Laki-laki',
    birthDate: '1978-05-20',
    age: 48,
    bloodType: 'B+',
    phone: '0815-6677-8899',
    email: 'ahmad.fauzan@email.com',
    address: 'Jl. Kenanga Mas No. 18, Cilandak, Jakarta Selatan',
    occupation: 'Wiraswasta',
    emergencyContact: {
      name: 'Nurul Hidayah',
      relation: 'Istri',
      phone: '0815-1122-3344'
    },
    allergies: [],
    chronicDiseases: ['Diabetes Mellitus Tipe 2', 'Dislipidemia'],
    insuranceType: 'Asuransi Swasta',
    insuranceNumber: 'PRU-9920194',
    status: 'Aktif',
    registeredAt: '2025-03-05'
  },
  {
    id: 'p-4',
    mrNumber: 'RM-2026-0004',
    nik: '3171076211980004',
    name: 'Dewi Lestari',
    gender: 'Perempuan',
    birthDate: '1998-11-22',
    age: 27,
    bloodType: 'AB+',
    phone: '0878-1122-3344',
    email: 'dewi.lestari@email.com',
    address: 'Apartemen Green Pramuka Tower C/1502, Jakarta Pusat',
    occupation: 'Desainer Grafis',
    emergencyContact: {
      name: 'Bambang Soediro',
      relation: 'Ayah',
      phone: '0878-9900-1122'
    },
    allergies: ['Seafood (Udang/Kepiting)'],
    chronicDiseases: ['Gastritis Kronis'],
    insuranceType: 'Umum / Mandiri',
    status: 'Aktif',
    registeredAt: '2025-05-18'
  },
  {
    id: 'p-5',
    mrNumber: 'RM-2026-0005',
    nik: '3171081501600001',
    name: 'H. Hendra Wijaya',
    gender: 'Laki-laki',
    birthDate: '1960-01-15',
    age: 66,
    bloodType: 'O+',
    phone: '0811-4455-6677',
    email: 'hendra.wijaya@email.com',
    address: 'Jl. Bumi Asri Residence No. 2, Pondok Indah, Jakarta Selatan',
    occupation: 'Pensiunan BUMN',
    emergencyContact: {
      name: 'Reza Wijaya',
      relation: 'Anak Kandung',
      phone: '0811-2233-4455'
    },
    allergies: ['Ibuprofen'],
    chronicDiseases: ['Penyakit Jantung Koroner', 'Hipertensi'],
    insuranceType: 'BPJS Kesehatan',
    insuranceNumber: '0003456789123',
    status: 'Aktif',
    registeredAt: '2025-06-20'
  },
  {
    id: 'p-6',
    mrNumber: 'RM-2026-0006',
    nik: '3171096004050005',
    name: 'Rina Wulandari',
    gender: 'Perempuan',
    birthDate: '2005-04-20',
    age: 21,
    bloodType: 'B+',
    phone: '0821-9988-7711',
    email: 'rina.wulan@email.com',
    address: 'Jl. Dahlia No. 7, Pasar Minggu, Jakarta Selatan',
    occupation: 'Mahasiswi',
    emergencyContact: {
      name: 'Suratmi',
      relation: 'Ibu',
      phone: '0821-3322-1100'
    },
    allergies: [],
    chronicDiseases: [],
    insuranceType: 'Umum / Mandiri',
    status: 'Aktif',
    registeredAt: '2026-01-10'
  }
];

export const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-1',
    code: 'OBT-001',
    name: 'Paracetamol 500 mg',
    category: 'Analgesik / Antipiretik',
    form: 'Tablet',
    strength: '500 mg',
    stock: 450,
    minimumStock: 100,
    unit: 'Tablet',
    price: 1500,
    batchNumber: 'BATCH-20250911',
    expiryDate: '2027-09-01',
    supplier: 'PT Kimia Farma Trading',
    indication: 'Meredakan demam dan nyeri ringan hingga sedang (sakit kepala, nyeri otot)'
  },
  {
    id: 'med-2',
    code: 'OBT-002',
    name: 'Amoxicillin 500 mg',
    category: 'Antibiotik',
    form: 'Kapsul',
    strength: '500 mg',
    stock: 180,
    minimumStock: 80,
    unit: 'Kapsul',
    price: 3500,
    batchNumber: 'BATCH-20251104',
    expiryDate: '2027-03-15',
    supplier: 'PT Kalbe Farma Tbk',
    indication: 'Infeksi bakteri saluran pernapasan, kulit, dan THT'
  },
  {
    id: 'med-3',
    code: 'OBT-003',
    name: 'Amlodipine 5 mg',
    category: 'Antihipertensi',
    form: 'Tablet',
    strength: '5 mg',
    stock: 320,
    minimumStock: 60,
    unit: 'Tablet',
    price: 2500,
    batchNumber: 'BATCH-20250810',
    expiryDate: '2027-08-10',
    supplier: 'PT Dexa Medica',
    indication: 'Hipertensi esensial dan profilaksis angina pektoris'
  },
  {
    id: 'med-4',
    code: 'OBT-004',
    name: 'Metformin 500 mg',
    category: 'Antidiabetes',
    form: 'Tablet',
    strength: '500 mg',
    stock: 240,
    minimumStock: 80,
    unit: 'Tablet',
    price: 2000,
    batchNumber: 'BATCH-20251012',
    expiryDate: '2027-05-20',
    supplier: 'PT Bernofarm',
    indication: 'Terapi awal Diabetes Melitus Tipe 2 pada orang dewasa'
  },
  {
    id: 'med-5',
    code: 'OBT-005',
    name: 'Omeprazole 20 mg',
    category: 'Gastrointestinal',
    form: 'Kapsul',
    strength: '20 mg',
    stock: 190,
    minimumStock: 50,
    unit: 'Kapsul',
    price: 4000,
    batchNumber: 'BATCH-20250614',
    expiryDate: '2026-11-30', // Hampir expired warning
    supplier: 'PT Sanbe Farma',
    indication: 'GERD, tukak lambung, sindrom Zollinger-Ellison, dispepsia berat'
  },
  {
    id: 'med-6',
    code: 'OBT-006',
    name: 'Cetirizine 10 mg',
    category: 'Antihistamin',
    form: 'Tablet',
    strength: '10 mg',
    stock: 25, // Low stock warning (< minimumStock)
    minimumStock: 60,
    unit: 'Tablet',
    price: 2800,
    batchNumber: 'BATCH-20250720',
    expiryDate: '2027-10-01',
    supplier: 'PT Pharos Indonesia',
    indication: 'Rinitis alergi, urtikaria kronis, gatal-gatal alergi'
  },
  {
    id: 'med-7',
    code: 'OBT-007',
    name: 'Cefixime 100 mg',
    category: 'Antibiotik',
    form: 'Kapsul',
    strength: '100 mg',
    stock: 90,
    minimumStock: 40,
    unit: 'Kapsul',
    price: 7500,
    batchNumber: 'BATCH-20250918',
    expiryDate: '2027-12-05',
    supplier: 'PT Kalbe Farma Tbk',
    indication: 'Infeksi saluran kemih tanpa komplikasi, faringitis, tonsilitis'
  },
  {
    id: 'med-8',
    code: 'OBT-008',
    name: 'Salbutamol Inhaler 100 mcg',
    category: 'Gastrointestinal',
    form: 'Sirup',
    strength: '100 mcg / semprot',
    stock: 12, // Low stock
    minimumStock: 20,
    unit: 'Botol',
    price: 65000,
    batchNumber: 'BATCH-20250410',
    expiryDate: '2027-04-10',
    supplier: 'PT GlaxoSmithKline Indonesia',
    indication: 'Bronkospasme akut pada asma bronkial'
  }
];

export const INITIAL_QUEUES: QueueItem[] = [
  {
    id: 'q-1',
    queueNumber: 'A-023',
    patientId: 'p-1',
    patientName: 'Budi Santoso',
    mrNumber: 'RM-2026-0001',
    doctorName: 'dr. Yusuf Tjakep Kalee, Sp.PD',
    doctorId: 'u-1',
    department: 'Poli Penyakit Dalam',
    registeredTime: '08:15',
    status: 'Sedang Diperiksa',
    priority: 'Biasa',
    insuranceType: 'BPJS Kesehatan'
  },
  {
    id: 'q-2',
    queueNumber: 'A-024',
    patientId: 'p-2',
    patientName: 'Siti Rahma',
    mrNumber: 'RM-2026-0002',
    doctorName: 'dr. Yusuf Tjakep Kalee, Sp.PD',
    doctorId: 'u-1',
    department: 'Poli Penyakit Dalam',
    registeredTime: '08:30',
    status: 'Dipanggil',
    priority: 'Biasa',
    insuranceType: 'BPJS Kesehatan'
  },
  {
    id: 'q-3',
    queueNumber: 'A-025',
    patientId: 'p-3',
    patientName: 'Ahmad Fauzan',
    mrNumber: 'RM-2026-0003',
    doctorName: 'dr. Yusuf Tjakep Kalee, Sp.PD',
    doctorId: 'u-1',
    department: 'Poli Penyakit Dalam',
    registeredTime: '08:45',
    status: 'Menunggu',
    priority: 'Biasa',
    insuranceType: 'Asuransi Swasta'
  },
  {
    id: 'q-4',
    queueNumber: 'B-011',
    patientId: 'p-5',
    patientName: 'H. Hendra Wijaya',
    mrNumber: 'RM-2026-0005',
    doctorName: 'Prabowo Jokowow, S teh dua gelas',
    doctorId: 'u-3',
    department: 'Poli Umum',
    registeredTime: '08:50',
    status: 'Menunggu',
    priority: 'Lansia/Disabilitas',
    insuranceType: 'BPJS Kesehatan'
  },
  {
    id: 'q-5',
    queueNumber: 'B-012',
    patientId: 'p-4',
    patientName: 'Dewi Lestari',
    mrNumber: 'RM-2026-0004',
    doctorName: 'Prabowo Jokowow, S teh dua gelas',
    doctorId: 'u-3',
    department: 'Poli Umum',
    registeredTime: '09:05',
    status: 'Menunggu',
    priority: 'Biasa',
    insuranceType: 'Umum / Mandiri'
  }
];

export const INITIAL_SCHEDULES: DoctorSchedule[] = [
  {
    id: 'sch-1',
    doctorId: 'u-1',
    doctorName: 'dr. Yusuf Tjakep Kalee, Sp.PD',
    specialty: 'Spesialis Penyakit Dalam',
    department: 'Poli Penyakit Dalam',
    dayOfWeek: 'Senin',
    startTime: '08:00',
    endTime: '13:00',
    room: 'Ruang Periksa 101',
    maxPatients: 25,
    bookedCount: 18,
    isActive: true
  },
  {
    id: 'sch-2',
    doctorId: 'u-2',
    doctorName: 'dr. Avivien Slebew, Sp.G',
    specialty: 'Spesialis Gizi Klinik',
    department: 'Poli Gizi & Spesialis',
    dayOfWeek: 'Senin',
    startTime: '09:00',
    endTime: '14:00',
    room: 'Ruang Periksa 102',
    maxPatients: 20,
    bookedCount: 14,
    isActive: true
  },
  {
    id: 'sch-3',
    doctorId: 'u-3',
    doctorName: 'Prabowo Jokowow, S teh dua gelas',
    specialty: 'Konsultan Umum & Minuman Sehat',
    department: 'Poli Umum',
    dayOfWeek: 'Senin',
    startTime: '08:00',
    endTime: '15:00',
    room: 'Ruang Periksa 103',
    maxPatients: 35,
    bookedCount: 22,
    isActive: true
  }
];

export const INITIAL_MEDICAL_RECORDS: MedicalRecord[] = [
  {
    id: 'mr-rec-1',
    patientId: 'p-1',
    mrNumber: 'RM-2026-0001',
    patientName: 'Budi Santoso',
    doctorId: 'u-1',
    doctorName: 'dr. Yusuf Tjakep Kalee, Sp.PD',
    department: 'Poli Penyakit Dalam',
    visitDate: '2026-02-15',
    visitType: 'Kontrol Rutin',
    subjective: {
      chiefComplaint: 'Tengkuk terasa kaku dan pusing berdenyut sejak 3 hari lalu.',
      historyOfPresentIllness: 'Pasien mengeluhkan kepala terasa berat terutama saat bangun pagi. Pasien mengaku sempat lupa meminum obat rutin antihipertensi selama seminggu karena dinas luar kota.',
      historyOfPastIllness: 'Riwayat Hipertensi terdiagnosa sejak 2 tahun lalu.',
      currentMedications: 'Amlodipine 5 mg 1x1'
    },
    objective: {
      vitals: {
        systolic: 150,
        diastolic: 95,
        heartRate: 82,
        temperature: 36.6,
        respiratoryRate: 18,
        spO2: 98,
        weight: 76,
        height: 170,
        bmi: 26.3,
        bmiCategory: 'Overweight'
      },
      physicalExam: {
        head: 'Mesocephal, jejas (-)',
        eyes: 'Konjungtiva anemis (-/-), sklera ikterik (-/-)',
        ears: 'Normotia, sekret (-/-)',
        nose: 'Deformitas (-), epistaksis (-)',
        throat: 'Faring hiperemis (-), tonsil T1/T1 tenang',
        neck: 'JVP 5+2 cmH2O, pembesaran KGB (-)',
        thorax: 'Simetris saat statis dan dinamis',
        heart: 'S1-S2 murni reguler, murmur (-), gallop (-)',
        lungs: 'Suara nafas vesikuler (+/+), rhonki (-/-), wheezing (-/-)',
        abdomen: 'Supel, nyeri tekan (-), bising usus 8x/menit normal',
        extremities: 'Akral hangat, CRT < 2 detik, edema pretibial (-/-)',
        neurological: 'GCS E4M6V5 (15), kaku kuduk (-), reflek fisiologis (+)'
      }
    },
    assessment: {
      diagnoses: [
        {
          id: 'diag-1',
          icd10Code: 'I10',
          nameIndonesian: 'Hipertensi Esensial (Primer) - Tidak Terkontrol',
          isPrimary: true,
          notes: 'Tekanan darah 150/95 mmHg akibat ketidakpatuhan minum obat'
        }
      ],
      clinicalImpression: 'Hipertensi stage 1 belum terkontrol dengan baik karena kepatuhan minum obat yang terputus.'
    },
    plan: {
      therapyPlan: 'Tingkatkan kepatuhan obat harian. Diet rendah garam (DASH diet), kurangi konsumsi kafein dan kelola stres.',
      procedures: [
        { id: 'proc-1', code: '00.01', name: 'Pemeriksaan Klinis & Konsultasi Spesialis', cost: 150000 },
        { id: 'proc-2', code: '89.52', name: 'Perekaman Elektrokardiografi (EKG 12 Lead)', cost: 120000 }
      ],
      prescriptions: [
        {
          id: 'rx-it-1',
          medicineId: 'med-3',
          medicineName: 'Amlodipine 10 mg',
          dosage: '10 mg',
          frequency: '1 x sehari (malam)',
          timing: 'Sesudah makan',
          durationDays: 30,
          quantity: 30,
          unit: 'Tablet',
          instructions: 'Minum teratur tiap jam 20.00',
          pricePerUnit: 3500
        }
      ],
      doctorNotes: 'Kontrol kembali 1 bulan kemudian atau lebih cepat jika tensi > 160 mmHg disertai nyeri kepala hebat.',
      nextVisitDate: '2026-03-15'
    },
    status: 'Final',
    createdAt: '2026-02-15 09:30',
    updatedAt: '2026-02-15 09:45'
  },
  {
        "id": "mr-rec-2",
        "patientId": "p-2",
        "mrNumber": "RM-2026-0002",
        "patientName": "Siti Rahma",
        "doctorId": "u-3",
        "doctorName": "Prabowo Jokowow, S teh dua gelas",
        "department": "Poli Umum",
        "visitDate": "2026-02-10",
        "visitType": "Baru",
        "subjective": {
          "chiefComplaint": "Batuk berdahak dan pilek sejak 4 hari lalu, disertai demam ringan.",
          "historyOfPresentIllness": "Demam naik turun, tenggorokan gatal, tidak ada sesak. Sudah minum obat warung tanpa perbaikan.",
          "historyOfPastIllness": "Tidak ada riwayat penyakit kronis.",
          "currentMedications": "Paracetamol (bila demam)"
        },
        "objective": {
          "vitals": {
            "systolic": 118,
            "diastolic": 76,
            "heartRate": 88,
            "temperature": 37.8,
            "respiratoryRate": 20,
            "spO2": 98,
            "weight": 58,
            "height": 160,
            "bmi": 22.7,
            "bmiCategory": "Normal"
          },
          "physicalExam": {
            "head": "Mesocephal, jejas (-)",
            "eyes": "Konjungtiva anemis (-/-), sklera ikterik (-/-)",
            "ears": "Normotia, sekret (-/-)",
            "nose": "Deformitas (-), epistaksis (-/-)",
            "throat": "Faring hiperemis (-), tonsil T1/T1 tenang",
            "neck": "JVP normal, pembesaran KGB (-)",
            "thorax": "Simetris saat statis dan dinamis",
            "heart": "S1-S2 murni reguler, murmur (-), gallop (-)",
            "lungs": "Suara nafas vesikuler (+/+), rhonki (-/-), wheezing (-/-)",
            "abdomen": "Supel, nyeri tekan (-), bising usus normal",
            "extremities": "Akral hangat, CRT < 2 detik, edema (-/-)",
            "neurological": "GCS 15, reflek fisiologis (+)"
          }
        },
        "assessment": {
          "diagnoses": [
            {
              "id": "diag-2",
              "icd10Code": "J06.9",
              "nameIndonesian": "Infeksi Saluran Napas Akut (ISPA)",
              "isPrimary": true,
              "notes": "ISPA viral, tanpa tanda pneumonia"
            }
          ],
          "clinicalImpression": "ISPA atas fase akut, kondisi umum baik."
        },
        "plan": {
          "therapyPlan": "Istirahat cukup, hidrasi adekuat, obat simptomatik. Antibiotik tidak diberikan (etiologi viral).",
          "procedures": [
            {
              "id": "proc-mr-rec-2",
              "code": "00.01",
              "name": "Pemeriksaan Klinis & Konsultasi",
              "cost": 100000
            }
          ],
          "prescriptions": [],
          "doctorNotes": "Kembali bila demam > 3 hari atau muncul sesak napas.",
          "nextVisitDate": "2026-02-17"
        },
        "status": "Final",
        "createdAt": "2026-02-10 09:00",
        "updatedAt": "2026-02-10 09:20"
      },
  {
        "id": "mr-rec-3",
        "patientId": "p-3",
        "mrNumber": "RM-2026-0003",
        "patientName": "Ahmad Fauzan",
        "doctorId": "u-1",
        "doctorName": "dr. Yusuf Tjakep Kalee, Sp.PD",
        "department": "Poli Penyakit Dalam",
        "visitDate": "2026-02-11",
        "visitType": "Kontrol Rutin",
        "subjective": {
          "chiefComplaint": "Kontrol diabetes berkala, mengeluh sering kesemutan di kedua telapak kaki.",
          "historyOfPresentIllness": "Gula darah puasa terakhir 168 mg/dL. Pola makan belum teratur, jarang olahraga.",
          "historyOfPastIllness": "Diabetes melitus tipe 2 sejak 3 tahun lalu.",
          "currentMedications": "Metformin 500 mg 2x1"
        },
        "objective": {
          "vitals": {
            "systolic": 132,
            "diastolic": 84,
            "heartRate": 80,
            "temperature": 36.7,
            "respiratoryRate": 18,
            "spO2": 99,
            "weight": 82,
            "height": 168,
            "bmi": 29.1,
            "bmiCategory": "Overweight"
          },
          "physicalExam": {
            "head": "Mesocephal, jejas (-)",
            "eyes": "Konjungtiva anemis (-/-), sklera ikterik (-/-)",
            "ears": "Normotia, sekret (-/-)",
            "nose": "Deformitas (-), epistaksis (-/-)",
            "throat": "Faring hiperemis (-), tonsil T1/T1 tenang",
            "neck": "JVP normal, pembesaran KGB (-)",
            "thorax": "Simetris saat statis dan dinamis",
            "heart": "S1-S2 murni reguler, murmur (-), gallop (-)",
            "lungs": "Suara nafas vesikuler (+/+), rhonki (-/-), wheezing (-/-)",
            "abdomen": "Supel, nyeri tekan (-), bising usus normal",
            "extremities": "Akral hangat, CRT < 2 detik, edema (-/-)",
            "neurological": "GCS 15, reflek fisiologis (+)"
          }
        },
        "assessment": {
          "diagnoses": [
            {
              "id": "diag-3",
              "icd10Code": "E11.9",
              "nameIndonesian": "Diabetes Melitus Tipe 2",
              "isPrimary": true,
              "notes": "GDP belum terkontrol, gejala neuropati perifer awal"
            }
          ],
          "clinicalImpression": "DM tipe 2 belum terkontrol dengan keluhan neuropati awal."
        },
        "plan": {
          "therapyPlan": "Edukasi diet DM 1900 kkal, target GDP < 126 mg/dL, lanjutkan Metformin, rujuk cek HbA1c ke laboratorium.",
          "procedures": [
            {
              "id": "proc-mr-rec-3",
              "code": "00.01",
              "name": "Pemeriksaan Klinis & Konsultasi",
              "cost": 100000
            }
          ],
          "prescriptions": [],
          "doctorNotes": "Kontrol 1 bulan dengan hasil HbA1c dan GDP.",
          "nextVisitDate": "2026-03-11"
        },
        "status": "Final",
        "createdAt": "2026-02-11 09:00",
        "updatedAt": "2026-02-11 09:20"
      },
  {
        "id": "mr-rec-4",
        "patientId": "p-4",
        "mrNumber": "RM-2026-0004",
        "patientName": "Dewi Lestari",
        "doctorId": "u-3",
        "doctorName": "Prabowo Jokowow, S teh dua gelas",
        "department": "Poli Umum",
        "visitDate": "2026-02-12",
        "visitType": "Baru",
        "subjective": {
          "chiefComplaint": "Nyeri ulu hati perih dan mual sejak 1 minggu, memberat setelah makan pedas.",
          "historyOfPresentIllness": "Nafsu makan menurun, perih berkurang setelah minum antasida. Tidak ada muntah darah atau BAB hitam.",
          "historyOfPastIllness": "Riwayat maag sejak remaja.",
          "currentMedications": "Antasida (bila nyeri)"
        },
        "objective": {
          "vitals": {
            "systolic": 110,
            "diastolic": 70,
            "heartRate": 76,
            "temperature": 36.5,
            "respiratoryRate": 16,
            "spO2": 99,
            "weight": 52,
            "height": 158,
            "bmi": 20.8,
            "bmiCategory": "Normal"
          },
          "physicalExam": {
            "head": "Mesocephal, jejas (-)",
            "eyes": "Konjungtiva anemis (-/-), sklera ikterik (-/-)",
            "ears": "Normotia, sekret (-/-)",
            "nose": "Deformitas (-), epistaksis (-/-)",
            "throat": "Faring hiperemis (-), tonsil T1/T1 tenang",
            "neck": "JVP normal, pembesaran KGB (-)",
            "thorax": "Simetris saat statis dan dinamis",
            "heart": "S1-S2 murni reguler, murmur (-), gallop (-)",
            "lungs": "Suara nafas vesikuler (+/+), rhonki (-/-), wheezing (-/-)",
            "abdomen": "Supel, nyeri tekan (-), bising usus normal",
            "extremities": "Akral hangat, CRT < 2 detik, edema (-/-)",
            "neurological": "GCS 15, reflek fisiologis (+)"
          }
        },
        "assessment": {
          "diagnoses": [
            {
              "id": "diag-4",
              "icd10Code": "K29.7",
              "nameIndonesian": "Gastritis dan Duodenitis",
              "isPrimary": true,
              "notes": "Gastritis akut tanpa tanda perdarahan"
            }
          ],
          "clinicalImpression": "Gastritis akut, kemungkinan dipicu pola makan dan stres."
        },
        "plan": {
          "therapyPlan": "Hindari makanan pedas/asam dan kafein, makan porsi kecil sering, terapi PPI 14 hari.",
          "procedures": [
            {
              "id": "proc-mr-rec-4",
              "code": "00.01",
              "name": "Pemeriksaan Klinis & Konsultasi",
              "cost": 100000
            }
          ],
          "prescriptions": [],
          "doctorNotes": "Kembali bila muntah berulang, BAB hitam, atau nyeri tidak berkurang.",
          "nextVisitDate": "2026-02-26"
        },
        "status": "Final",
        "createdAt": "2026-02-12 09:00",
        "updatedAt": "2026-02-12 09:20"
      },
  {
        "id": "mr-rec-5",
        "patientId": "p-1",
        "mrNumber": "RM-2026-0001",
        "patientName": "Budi Santoso",
        "doctorId": "u-1",
        "doctorName": "dr. Yusuf Tjakep Kalee, Sp.PD",
        "department": "Poli Penyakit Dalam",
        "visitDate": "2026-02-13",
        "visitType": "Kontrol Rutin",
        "subjective": {
          "chiefComplaint": "Kontrol hipertensi, tidak ada keluhan pusing minggu ini.",
          "historyOfPresentIllness": "Rutin minum Amlodipine 5 mg setiap malam selama 2 minggu terakhir. Tensi di rumah berkisar 135/85.",
          "historyOfPastIllness": "Hipertensi sejak 2 tahun lalu.",
          "currentMedications": "Amlodipine 5 mg 1x1"
        },
        "objective": {
          "vitals": {
            "systolic": 138,
            "diastolic": 88,
            "heartRate": 78,
            "temperature": 36.6,
            "respiratoryRate": 17,
            "spO2": 98,
            "weight": 76,
            "height": 170,
            "bmi": 26.3,
            "bmiCategory": "Overweight"
          },
          "physicalExam": {
            "head": "Mesocephal, jejas (-)",
            "eyes": "Konjungtiva anemis (-/-), sklera ikterik (-/-)",
            "ears": "Normotia, sekret (-/-)",
            "nose": "Deformitas (-), epistaksis (-/-)",
            "throat": "Faring hiperemis (-), tonsil T1/T1 tenang",
            "neck": "JVP normal, pembesaran KGB (-)",
            "thorax": "Simetris saat statis dan dinamis",
            "heart": "S1-S2 murni reguler, murmur (-), gallop (-)",
            "lungs": "Suara nafas vesikuler (+/+), rhonki (-/-), wheezing (-/-)",
            "abdomen": "Supel, nyeri tekan (-), bising usus normal",
            "extremities": "Akral hangat, CRT < 2 detik, edema (-/-)",
            "neurological": "GCS 15, reflek fisiologis (+)"
          }
        },
        "assessment": {
          "diagnoses": [
            {
              "id": "diag-5",
              "icd10Code": "I10",
              "nameIndonesian": "Hipertensi Esensial (Primer)",
              "isPrimary": true,
              "notes": "Membaik dibanding kunjungan sebelumnya, belum target < 130/80"
            }
          ],
          "clinicalImpression": "Hipertensi membaik, kepatuhan obat baik."
        },
        "plan": {
          "therapyPlan": "Lanjutkan Amlodipine 5 mg, diet rendah garam, aktivitas fisik 30 menit/hari.",
          "procedures": [
            {
              "id": "proc-mr-rec-5",
              "code": "00.01",
              "name": "Pemeriksaan Klinis & Konsultasi",
              "cost": 100000
            }
          ],
          "prescriptions": [],
          "doctorNotes": "Kontrol 2 minggu untuk evaluasi target tensi.",
          "nextVisitDate": "2026-02-27"
        },
        "status": "Final",
        "createdAt": "2026-02-13 09:00",
        "updatedAt": "2026-02-13 09:20"
      },
  {
        "id": "mr-rec-6",
        "patientId": "p-5",
        "mrNumber": "RM-2026-0005",
        "patientName": "H. Hendra Wijaya",
        "doctorId": "u-3",
        "doctorName": "Prabowo Jokowow, S teh dua gelas",
        "department": "Poli Umum",
        "visitDate": "2026-02-14",
        "visitType": "Baru",
        "subjective": {
          "chiefComplaint": "Nyeri punggung bawah menjalar ke bokong kanan sejak 5 hari setelah mengangkat beban berat.",
          "historyOfPresentIllness": "Nyeri memburuk saat membungkuk, membaik saat berbaring. Tidak ada kelemahan tungkai atau gangguan BAK/BAB.",
          "historyOfPastIllness": "Tidak ada riwayat trauma atau operasi tulang belakang.",
          "currentMedications": "Tidak ada"
        },
        "objective": {
          "vitals": {
            "systolic": 126,
            "diastolic": 80,
            "heartRate": 74,
            "temperature": 36.4,
            "respiratoryRate": 16,
            "spO2": 99,
            "weight": 88,
            "height": 172,
            "bmi": 29.7,
            "bmiCategory": "Overweight"
          },
          "physicalExam": {
            "head": "Mesocephal, jejas (-)",
            "eyes": "Konjungtiva anemis (-/-), sklera ikterik (-/-)",
            "ears": "Normotia, sekret (-/-)",
            "nose": "Deformitas (-), epistaksis (-/-)",
            "throat": "Faring hiperemis (-), tonsil T1/T1 tenang",
            "neck": "JVP normal, pembesaran KGB (-)",
            "thorax": "Simetris saat statis dan dinamis",
            "heart": "S1-S2 murni reguler, murmur (-), gallop (-)",
            "lungs": "Suara nafas vesikuler (+/+), rhonki (-/-), wheezing (-/-)",
            "abdomen": "Supel, nyeri tekan (-), bising usus normal",
            "extremities": "Akral hangat, CRT < 2 detik, edema (-/-)",
            "neurological": "GCS 15, reflek fisiologis (+)"
          }
        },
        "assessment": {
          "diagnoses": [
            {
              "id": "diag-6",
              "icd10Code": "M54.5",
              "nameIndonesian": "Nyeri Punggung Bawah (LBP)",
              "isPrimary": true,
              "notes": "LBP mekanik tanpa red flag neurologis"
            }
          ],
          "clinicalImpression": "Low back pain mekanik akibat strain otot."
        },
        "plan": {
          "therapyPlan": "Fisioterapi, hindari angkat beban > 5 kg, analgesik sesuai kebutuhan, edukasi postur kerja.",
          "procedures": [
            {
              "id": "proc-mr-rec-6",
              "code": "00.01",
              "name": "Pemeriksaan Klinis & Konsultasi",
              "cost": 100000
            }
          ],
          "prescriptions": [],
          "doctorNotes": "Kembali bila nyeri menjalar ke kaki disertai kesemutan atau kelemahan.",
          "nextVisitDate": "2026-02-28"
        },
        "status": "Final",
        "createdAt": "2026-02-14 09:00",
        "updatedAt": "2026-02-14 09:20"
      },
  {
        "id": "mr-rec-7",
        "patientId": "p-6",
        "mrNumber": "RM-2026-0006",
        "patientName": "Rina Wulandari",
        "doctorId": "u-1",
        "doctorName": "dr. Yusuf Tjakep Kalee, Sp.PD",
        "department": "Poli Penyakit Dalam",
        "visitDate": "2026-02-15",
        "visitType": "Baru",
        "subjective": {
          "chiefComplaint": "Sesak napas berbunyi mengi terutama malam hari sejak 3 hari lalu.",
          "historyOfPresentIllness": "Riwayat asma sejak kecil, serangan dipicu udara dingin dan debu. Inhaler salbutamol dipakai 2-3 kali sehari minggu ini.",
          "historyOfPastIllness": "Asma bronkial sejak usia 10 tahun, rinitis alergi.",
          "currentMedications": "Salbutamol inhaler (bila sesak)"
        },
        "objective": {
          "vitals": {
            "systolic": 120,
            "diastolic": 78,
            "heartRate": 96,
            "temperature": 36.8,
            "respiratoryRate": 22,
            "spO2": 96,
            "weight": 55,
            "height": 162,
            "bmi": 21.0,
            "bmiCategory": "Normal"
          },
          "physicalExam": {
            "head": "Mesocephal, jejas (-)",
            "eyes": "Konjungtiva anemis (-/-), sklera ikterik (-/-)",
            "ears": "Normotia, sekret (-/-)",
            "nose": "Deformitas (-), epistaksis (-/-)",
            "throat": "Faring hiperemis (-), tonsil T1/T1 tenang",
            "neck": "JVP normal, pembesaran KGB (-)",
            "thorax": "Simetris saat statis dan dinamis",
            "heart": "S1-S2 murni reguler, murmur (-), gallop (-)",
            "lungs": "Suara nafas vesikuler (+/+), rhonki (-/-), wheezing (-/-)",
            "abdomen": "Supel, nyeri tekan (-), bising usus normal",
            "extremities": "Akral hangat, CRT < 2 detik, edema (-/-)",
            "neurological": "GCS 15, reflek fisiologis (+)"
          }
        },
        "assessment": {
          "diagnoses": [
            {
              "id": "diag-7",
              "icd10Code": "J45.9",
              "nameIndonesian": "Asma Bronkial",
              "isPrimary": true,
              "notes": "Eksaserbasi ringan, SpO2 96% udara ruangan"
            }
          ],
          "clinicalImpression": "Asma eksaserbasi ringan, respons baik terhadap bronkodilator."
        },
        "plan": {
          "therapyPlan": "Kontroler inhaler kortikosteroid dosis rendah harian, hindari pemicu, rencana aksi asma tertulis.",
          "procedures": [
            {
              "id": "proc-mr-rec-7",
              "code": "00.01",
              "name": "Pemeriksaan Klinis & Konsultasi",
              "cost": 100000
            }
          ],
          "prescriptions": [],
          "doctorNotes": "Kontrol 1 bulan atau lebih cepat bila serangan berulang.",
          "nextVisitDate": "2026-03-15"
        },
        "status": "Final",
        "createdAt": "2026-02-15 09:00",
        "updatedAt": "2026-02-15 09:20"
      }];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-001',
    patientId: 'p-1',
    patientName: 'Budi Santoso',
    mrNumber: 'RM-2026-0001',
    doctorId: 'u-1',
    doctorName: 'dr. Yusuf Tjakep Kalee, Sp.PD',
    medicalRecordId: 'mr-rec-1',
    date: '2026-02-15',
    status: 'Selesai',
    items: [
      {
        id: 'rx-i-1',
        medicineId: 'med-3',
        medicineName: 'Amlodipine 10 mg',
        dosage: '10 mg',
        frequency: '1 x sehari (malam)',
        timing: 'Sesudah makan',
        durationDays: 30,
        quantity: 30,
        unit: 'Tablet',
        instructions: 'Diminum teratur pada malam hari',
        pricePerUnit: 3500
      }
    ],
    notes: 'Pasien diedukasi tentang kepatuhan minum obat hipertensi',
    totalCost: 105000
  }
];

export const INITIAL_LAB_ORDERS: LabOrder[] = [
  {
    id: 'lab-1',
    orderNumber: 'LAB-2026-0041',
    patientId: 'p-3',
    patientName: 'Ahmad Fauzan',
    mrNumber: 'RM-2026-0003',
    doctorName: 'dr. Yusuf Tjakep Kalee, Sp.PD',
    orderDate: '2026-02-20',
    status: 'Validated',
    items: [
      {
        testName: 'Glukosa Darah Puasa (GDP)',
        category: 'Kimia Klinik',
        resultValue: '142',
        referenceRange: '70 - 100',
        unit: 'mg/dL',
        isAbnormal: true,
        notes: 'Meningkat'
      },
      {
        testName: 'HbA1c',
        category: 'Kimia Klinik',
        resultValue: '7.8',
        referenceRange: '< 5.7 (Normal), 5.7 - 6.4 (Prediabetes)',
        unit: '%',
        isAbnormal: true,
        notes: 'Pengendalian glukosa darah kurang optimal'
      },
      {
        testName: 'Kolesterol Total',
        category: 'Profil Lipid',
        resultValue: '215',
        referenceRange: '< 200',
        unit: 'mg/dL',
        isAbnormal: true,
        notes: 'Batas tinggi'
      }
    ],
    notes: 'Pemeriksaan rutin evaluasi DM tipe 2 dan dislipidemia',
    validatedBy: 'Bambang Triyono, A.Md.AK',
    validatedAt: '2026-02-20 14:15'
  }
];

export const INITIAL_RADIOLOGY_ORDERS: RadiologyOrder[] = [
  {
    id: 'rad-1',
    orderNumber: 'RAD-2026-0019',
    patientId: 'p-5',
    patientName: 'H. Hendra Wijaya',
    mrNumber: 'RM-2026-0005',
    doctorName: 'dr. Yusuf Tjakep Kalee, Sp.PD',
    orderDate: '2026-02-18',
    examinationType: 'Foto Rontgen Thorax PA',
    clinicalIndication: 'Evaluasi pembesaran jantung (Kardiomegali) dan infiltrat paru',
    status: 'Hasil Terbaca',
    findings: 'Cor membesar ke lateral kiri dengan CTR ~55%. Aorta sklerotik. Pulmo: corakan bronkovaskular dalam batas normal, tidak tampak infiltrat aktif maupun efusi pleura. Sinus kostofrenikus lancip.',
    impression: 'Kardiomegali ringan dengan elongasio dan kalsifikasi aorta.',
    radiologistName: 'dr. Farida Hanum, Sp.Rad',
    readingDate: '2026-02-18 16:30'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-0120',
    patientId: 'p-1',
    patientName: 'Budi Santoso',
    mrNumber: 'RM-2026-0001',
    date: '2026-02-15',
    dueDate: '2026-02-15',
    items: [
      { id: 'ii-1', description: 'Konsultasi Dokter Spesialis Penyakit Dalam', category: 'Konsultasi', quantity: 1, unitPrice: 150000, subtotal: 150000 },
      { id: 'ii-2', description: 'Perekaman EKG 12 Lead', category: 'Tindakan', quantity: 1, unitPrice: 120000, subtotal: 120000 },
      { id: 'ii-3', description: 'Amlodipine 10 mg (30 tablet)', category: 'Farmasi', quantity: 30, unitPrice: 3500, subtotal: 105000 },
      { id: 'ii-4', description: 'Biaya Administrasi Rawat Jalan', category: 'Administrasi', quantity: 1, unitPrice: 25000, subtotal: 25000 }
    ],
    subtotal: 400000,
    discount: 0,
    tax: 0,
    total: 400000,
    paidAmount: 400000,
    paymentMethod: 'Klaim BPJS',
    status: 'Paid',
    paymentDate: '2026-02-15 10:15',
    cashierName: 'Indah Permata'
  }
];

export const INITIAL_CERTIFICATES: MedicalCertificate[] = [
  {
    id: 'cert-1',
    certificateNumber: 'SKD/2026/02/089',
    patientId: 'p-1',
    patientName: 'Budi Santoso',
    mrNumber: 'RM-2026-0001',
    patientAge: 41,
    patientGender: 'Laki-laki',
    patientAddress: 'Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan',
    doctorName: 'dr. Yusuf Tjakep Kalee, Sp.PD',
    doctorSip: 'SIP.503/442.1/DOKTER/2023',
    type: 'Surat Keterangan Sakit',
    issueDate: '2026-02-15',
    startDate: '2026-02-15',
    endDate: '2026-02-17',
    durationDays: 3,
    diagnosis: 'Hipertensi urgensi & Cephalgia',
    notes: 'Perlu istirahat fisik dan tirah baring selama 3 (tiga) hari.'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-02-26 09:45:12',
    userName: 'dr. Yusuf Tjakep Kalee, Sp.PD',
    role: 'doctor',
    module: 'Rekam Medis',
    action: 'Simpan Final Rekam Medis',
    details: 'Pengisian SOAP & Diagnosa ICD-10 pasien Budi Santoso (RM-2026-0001)',
    ipAddress: '192.168.1.104'
  },
  {
    id: 'log-2',
    timestamp: '2026-02-26 09:47:05',
    userName: 'dr. Yusuf Tjakep Kalee, Sp.PD',
    role: 'doctor',
    module: 'Resep',
    action: 'E-Prescribing Dibuat',
    details: 'Resep Amlodipine 10 mg sebanyak 30 tablet dikirim ke Farmasi',
    ipAddress: '192.168.1.104'
  },
  {
    id: 'log-3',
    timestamp: '2026-02-26 10:02:18',
    userName: 'apt. Rizki Fauzi, S.Farm',
    role: 'pharmacist',
    module: 'Farmasi',
    action: 'Dispensing Obat',
    details: 'Penyiapan dan validasi resep pasien RM-2026-0001 selesai',
    ipAddress: '192.168.1.112'
  },
  {
    id: 'log-4',
    timestamp: '2026-02-26 10:15:30',
    userName: 'Indah Permata',
    role: 'cashier',
    module: 'Kasir',
    action: 'Pembayaran Sukses',
    details: 'Pelunasan Invoice INV-2026-0120 via BPJS Kesehatan',
    ipAddress: '192.168.1.120'
  }
];

export const INITIAL_NOTIFICATIONS: ClinicNotification[] = [
  {
    id: 'notif-1',
    title: 'Pasien Menunggu di Poli Penyakit Dalam',
    message: 'Pasien Siti Rahma (A-024) telah berada di ruang tunggu',
    time: '5 menit lalu',
    type: 'info',
    read: false,
    linkModule: 'queue'
  },
  {
    id: 'notif-2',
    title: 'Peringatan Stok Obat Kritis',
    message: 'Stok Cetirizine 10 mg tersisa 25 tablet (di bawah batas minimum 60)',
    time: '20 menit lalu',
    type: 'warning',
    read: false,
    linkModule: 'pharmacy'
  },
  {
    id: 'notif-3',
    title: 'Hasil Lab Terverifikasi',
    message: 'Hasil Kimia Darah pasien Ahmad Fauzan (LAB-2026-0041) telah siap',
    time: '1 jam lalu',
    type: 'success',
    read: true,
    linkModule: 'laboratory'
  }
];

export const COMMON_ICD10_LIST = [
  { code: 'I10', name: 'Hipertensi Esensial (Primer)' },
  { code: 'E11.9', name: 'Diabetes Mellitus Tipe 2 Tanpa Komplikasi' },
  { code: 'J00', name: 'Nasofaringitis Akut (Common Cold)' },
  { code: 'J06.9', name: 'Infeksi Saluran Pernapasan Atas Akut (ISPA)' },
  { code: 'K29.7', name: 'Gastritis, Tidak Spesifik' },
  { code: 'K30', name: 'Dispepsia' },
  { code: 'M54.5', name: 'Nyeri Punggung Bawah (Low Back Pain)' },
  { code: 'A09', name: 'Gastroenteritis dan Kolitis Infeksiosa' },
  { code: 'J45.9', name: 'Asma Bronkial, Tidak Spesifik' },
  { code: 'R50.9', name: 'Demam, Tidak Spesifik' },
  { code: 'R51', name: 'Nyeri Kepala (Cephalgia)' },
  { code: 'L20.9', name: 'Dermatitis Atopik' },
  { code: 'B35.4', name: 'Tinea Corporis (Kurap)' },
  { code: 'H10.9', name: 'Konjungtivitis Akut' },
  { code: 'N39.0', name: 'Infeksi Saluran Kemih (ISK)' }
];

