import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Patient,
  Medicine,
  QueueItem,
  MedicalRecord,
  Prescription,
  LabOrder,
  RadiologyOrder,
  Invoice,
  MedicalCertificate,
  DoctorSchedule,
  AuditLog,
  ClinicNotification,
  ClinicProfile,
  User,
  UserRole
} from '../types';
import {
  INITIAL_PATIENTS,
  INITIAL_MEDICINES,
  INITIAL_QUEUES,
  INITIAL_SCHEDULES,
  INITIAL_MEDICAL_RECORDS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_LAB_ORDERS,
  INITIAL_RADIOLOGY_ORDERS,
  INITIAL_INVOICES,
  INITIAL_CERTIFICATES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_USERS
} from '../data/mockData';
import {
  clearSession,
  hashPassword,
  loadSession,
  saveSession,
  type SessionData
} from '../lib/auth';
import { dataKey, DEFAULT_CLINIC_ID } from '../lib/clinics';
import { themeById } from '../lib/themes';

export interface AuthResult {
  ok: boolean;
  error?: string;
}

interface StoreContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  isAuthenticated: boolean;
  session: SessionData | null;
  login: (email: string, password: string, remember: boolean) => Promise<AuthResult>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<AuthResult>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<void>;
  addUser: (input: { name: string; email: string; role: User['role']; department?: string; sipNumber?: string; password: string }) => Promise<AuthResult>;
  clinicId: string;
  users: User[];
  clinicProfile: ClinicProfile;
  updateClinicProfile: (profile: ClinicProfile) => void;
  patients: Patient[];
  medicines: Medicine[];
  queues: QueueItem[];
  schedules: DoctorSchedule[];
  medicalRecords: MedicalRecord[];
  prescriptions: Prescription[];
  labOrders: LabOrder[];
  radiologyOrders: RadiologyOrder[];
  invoices: Invoice[];
  certificates: MedicalCertificate[];
  auditLogs: AuditLog[];
  notifications: ClinicNotification[];
  
  // Audio chime & speech
  playQueueChime: (queueNumber: string, patientName: string, destination: string) => void;

  // Patient Actions
  addPatient: (patient: Omit<Patient, 'id' | 'mrNumber' | 'registeredAt'>) => Patient;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  getPatient: (id: string) => Patient | undefined;

  // Queue Actions
  addQueue: (item: Omit<QueueItem, 'id' | 'queueNumber' | 'registeredTime' | 'status'>) => QueueItem;
  updateQueueStatus: (id: string, status: QueueItem['status']) => void;
  callQueuePatient: (queueId: string) => void;

  // Examination / SOAP Actions
  saveMedicalRecord: (record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'>, isDraft?: boolean) => MedicalRecord;
  updateMedicalRecord: (id: string, record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'>, isDraft?: boolean) => MedicalRecord;
  
  // Prescription Actions
  createPrescription: (prescription: Omit<Prescription, 'id' | 'date'>) => Prescription;
  updatePrescriptionStatus: (id: string, status: Prescription['status']) => void;

  // Pharmacy Actions
  addMedicine: (medicine: Omit<Medicine, 'id'>) => Medicine;
  updateMedicineStock: (id: string, delta: number, reason: string) => void;

  // Lab & Radiology Actions
  createLabOrder: (order: Omit<LabOrder, 'id' | 'orderNumber' | 'orderDate' | 'status'>) => LabOrder;
  updateLabResult: (orderId: string, testIndex: number, resultValue: string, isAbnormal: boolean) => void;
  validateLabOrder: (orderId: string, validatorName: string) => void;
  createRadiologyOrder: (order: Omit<RadiologyOrder, 'id' | 'orderNumber' | 'orderDate' | 'status'>) => RadiologyOrder;
  updateRadiologyFinding: (orderId: string, findings: string, impression: string, radiologistName: string) => void;

  // Billing Actions
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'date' | 'dueDate' | 'status' | 'paidAmount'>) => Invoice;
  payInvoice: (id: string, amount: number, method: Invoice['paymentMethod']) => void;

  // Certificate Actions
  createCertificate: (cert: Omit<MedicalCertificate, 'id' | 'certificateNumber' | 'issueDate'>) => MedicalCertificate;

  // Notification Actions
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Audit Log Action
  logAudit: (module: AuditLog['module'], action: string, details: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode; clinicId: string; onLogout?: () => void }> = ({ children, clinicId, onLogout }) => {
  // Load initial from localStorage or defaults
  const loadLocal = <T,>(key: string, initial: T): T => {
    try {
      const saved = localStorage.getItem(dataKey(clinicId, key));
      return saved ? JSON.parse(saved) : initial;
    } catch {
      return initial;
    }
  };

  const [users, setUsers] = useState<User[]>(() => {
    const stored = loadLocal<User[]>('users', clinicId === DEFAULT_CLINIC_ID ? INITIAL_USERS : []);
    // Migrasi: akun lama yang belum punya hash kata sandi mewarisi hash bawaan
    return stored.map((u) => {
      if (u.passwordHash) return u;
      const seed = INITIAL_USERS.find((s) => s.id === u.id || s.email === u.email);
      return seed ? { ...u, passwordHash: seed.passwordHash } : u;
    });
  });
  const [currentUser, setCurrentUser] = useState<User>(() => loadLocal('currentUser', INITIAL_USERS[0]));
  const [session, setSession] = useState<SessionData | null>(() => loadSession());

  const isAuthenticated =
    !!session && session.expiresAt > Date.now() && users.some((u) => u.id === session.userId);

  // Sesi yang valid menentukan pengguna aktif
  useEffect(() => {
    if (session && session.expiresAt > Date.now()) {
      const user = users.find((u) => u.id === session.userId);
      if (user) setCurrentUser(user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    localStorage.setItem(dataKey(clinicId, 'users'), JSON.stringify(users));
  }, [users]);

  const [clinicProfile, setClinicProfile] = useState<ClinicProfile>(() =>
    loadLocal<ClinicProfile>('clinic_profile', clinicId === DEFAULT_CLINIC_ID ? {
      clinicName: 'Klinik Tong Fang Ashiap',
      licenseNumber: '503/021/KOP-PELKES/2023',
      faskesCode: '31710502',
      address: 'Jl. Jenderal Sudirman Kav. 45, Kebayoran Baru, Jakarta Selatan',
      phone: '(021) 555-0192',
      email: 'info@tongfangashiap.id',
      directorName: 'dr. Yusuf Tjakep Kalee, Sp.PD'
    } : {
      clinicName: 'Klinik Baru',
      licenseNumber: '',
      faskesCode: '',
      address: '',
      phone: '',
      email: '',
      directorName: ''
    })
  );

  // Tema warna aktif mengikuti profil klinik (hanya mengganti warna)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeById(clinicProfile.theme).id);
  }, [clinicProfile.theme]);

  useEffect(() => {
    localStorage.setItem(dataKey(clinicId, 'clinic_profile'), JSON.stringify(clinicProfile));
  }, [clinicProfile]);

  const updateClinicProfile = (profile: ClinicProfile) => {
    setClinicProfile(profile);
    logAudit('Pengaturan', 'Perbarui Profil Klinik', `Profil fasilitas diperbarui: ${profile.clinicName}`);
  };
  const [patients, setPatients] = useState<Patient[]>(() => loadLocal('patients', clinicId === DEFAULT_CLINIC_ID ? INITIAL_PATIENTS : []));
  const [medicines, setMedicines] = useState<Medicine[]>(() => loadLocal('medicines', clinicId === DEFAULT_CLINIC_ID ? INITIAL_MEDICINES : []));
  const [queues, setQueues] = useState<QueueItem[]>(() => loadLocal('queues', clinicId === DEFAULT_CLINIC_ID ? INITIAL_QUEUES : []));
  const [schedules, setSchedules] = useState<DoctorSchedule[]>(() => loadLocal('schedules', clinicId === DEFAULT_CLINIC_ID ? INITIAL_SCHEDULES : []));
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>(() => loadLocal('records', clinicId === DEFAULT_CLINIC_ID ? INITIAL_MEDICAL_RECORDS : []));
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => loadLocal('prescriptions', clinicId === DEFAULT_CLINIC_ID ? INITIAL_PRESCRIPTIONS : []));
  const [labOrders, setLabOrders] = useState<LabOrder[]>(() => loadLocal('lab_orders', clinicId === DEFAULT_CLINIC_ID ? INITIAL_LAB_ORDERS : []));
  const [radiologyOrders, setRadiologyOrders] = useState<RadiologyOrder[]>(() => loadLocal('radiology_orders', clinicId === DEFAULT_CLINIC_ID ? INITIAL_RADIOLOGY_ORDERS : []));
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadLocal('invoices', clinicId === DEFAULT_CLINIC_ID ? INITIAL_INVOICES : []));
  const [certificates, setCertificates] = useState<MedicalCertificate[]>(() => loadLocal('certificates', clinicId === DEFAULT_CLINIC_ID ? INITIAL_CERTIFICATES : []));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadLocal('audit_logs', clinicId === DEFAULT_CLINIC_ID ? INITIAL_AUDIT_LOGS : []));
  const [notifications, setNotifications] = useState<ClinicNotification[]>(() => loadLocal('notifications', clinicId === DEFAULT_CLINIC_ID ? INITIAL_NOTIFICATIONS : []));

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(dataKey(clinicId, 'currentUser'), JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(dataKey(clinicId, 'patients'), JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem(dataKey(clinicId, 'medicines'), JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem(dataKey(clinicId, 'queues'), JSON.stringify(queues));
  }, [queues]);

  useEffect(() => {
    localStorage.setItem(dataKey(clinicId, 'schedules'), JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem(dataKey(clinicId, 'records'), JSON.stringify(medicalRecords));
  }, [medicalRecords]);

  useEffect(() => {
    localStorage.setItem(dataKey(clinicId, 'prescriptions'), JSON.stringify(prescriptions));
  }, [prescriptions]);

  useEffect(() => {
    localStorage.setItem(dataKey(clinicId, 'lab_orders'), JSON.stringify(labOrders));
  }, [labOrders]);

  useEffect(() => {
    localStorage.setItem(dataKey(clinicId, 'radiology_orders'), JSON.stringify(radiologyOrders));
  }, [radiologyOrders]);

  useEffect(() => {
    localStorage.setItem(dataKey(clinicId, 'invoices'), JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(dataKey(clinicId, 'certificates'), JSON.stringify(certificates));
  }, [certificates]);

  useEffect(() => {
    localStorage.setItem(dataKey(clinicId, 'audit_logs'), JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(dataKey(clinicId, 'notifications'), JSON.stringify(notifications));
  }, [notifications]);

  // Audit Logging
  const logAudit = (module: AuditLog['module'], action: string, details: string) => {
    const now = new Date();
    const formattedTime = now.toISOString().replace('T', ' ').substring(0, 19);
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: formattedTime,
      userName: currentUser.name,
      role: currentUser.role,
      module,
      action,
      details,
      ipAddress: '192.168.1.' + Math.floor(100 + Math.random() * 50)
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Hospital Chime sound synthesis
  const playQueueChime = (queueNumber: string, patientName: string, destination: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const tones = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 clinical chime
        tones.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + idx * 0.15 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.15 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.15);
          osc.stop(ctx.currentTime + idx * 0.15 + 0.7);
        });
      }
    } catch {
      // AudioContext not permitted before interaction
    }

    // Optional Speech Synthesis
    if ('speechSynthesis' in window) {
      setTimeout(() => {
        try {
          const text = `Nomor antrian, ${queueNumber.split('').join(' ')}, ${patientName}, silakan menuju ${destination}`;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'id-ID';
          utterance.rate = 0.95;
          window.speechSynthesis.speak(utterance);
        } catch {
          // ignore if speech synthesis blocked
        }
      }, 700);
    }
  };

  // ---- Autentikasi ----
  const logAuditAs = (user: User, action: string, details: string) => {
    const now = new Date();
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: now.toISOString().replace('T', ' ').substring(0, 19),
      userName: user.name,
      role: user.role,
      module: 'Pengguna',
      action,
      details,
      ipAddress: '192.168.1.' + Math.floor(100 + Math.random() * 50)
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const login = async (email: string, password: string, remember: boolean): Promise<AuthResult> => {
    const normalized = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === normalized);
    if (!user || user.isActive === false) {
      return { ok: false, error: 'Email atau kata sandi salah.' };
    }
    if (!user.passwordHash) {
      return { ok: false, error: 'Akun ini belum memiliki kata sandi. Hubungi administrator.' };
    }
    const candidate = await hashPassword(user.id, password);
    if (candidate !== user.passwordHash) {
      return { ok: false, error: 'Email atau kata sandi salah.' };
    }
    const now = Date.now();
    const newSession: SessionData = {
      userId: user.id,
      email: user.email,
      clinicId,
      loginAt: now,
      expiresAt: now + (remember ? 7 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000),
      remember
    };
    saveSession(newSession);
    setSession(newSession);
    setCurrentUser(user);
    logAuditAs(user, 'Login Berhasil', `Pengguna masuk sebagai ${user.role}`);
    return { ok: true };
  };

  const logout = () => {
    if (session) {
      const user = users.find((u) => u.id === session.userId);
      if (user) logAuditAs(user, 'Logout', 'Pengguna keluar dari sistem');
    }
    clearSession();
    setSession(null);
    onLogout?.();
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<AuthResult> => {
    const user = users.find((u) => u.id === currentUser.id);
    if (!user) return { ok: false, error: 'Pengguna tidak ditemukan.' };
    const oldHash = await hashPassword(user.id, oldPassword);
    if (oldHash !== user.passwordHash) {
      return { ok: false, error: 'Kata sandi lama salah.' };
    }
    if (newPassword.length < 8) {
      return { ok: false, error: 'Kata sandi baru minimal 8 karakter.' };
    }
    const newHash = await hashPassword(user.id, newPassword);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, passwordHash: newHash } : u)));
    logAuditAs(user, 'Ganti Kata Sandi', 'Kata sandi akun berhasil diubah');
    return { ok: true };
  };

  const resetUserPassword = async (userId: string, newPassword: string): Promise<void> => {
    const newHash = await hashPassword(userId, newPassword);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, passwordHash: newHash } : u)));
    const target = users.find((u) => u.id === userId);
    if (target) {
      logAuditAs(currentUser, 'Reset Kata Sandi', `Kata sandi ${target.name} direset oleh administrator`);
    }
  };

  const addUser = async (input: { name: string; email: string; role: User['role']; department?: string; sipNumber?: string; password: string }): Promise<AuthResult> => {
    const email = input.email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === email)) {
      return { ok: false, error: 'Email sudah dipakai akun lain di klinik ini.' };
    }
    if (input.password.length < 8) {
      return { ok: false, error: 'Kata sandi awal minimal 8 karakter.' };
    }
    const id = `u-${clinicId}-${Date.now().toString(36)}`;
    const newUser: User = {
      id,
      name: input.name.trim(),
      email,
      role: input.role,
      department: input.department?.trim() || undefined,
      sipNumber: input.sipNumber?.trim() || undefined,
      passwordHash: await hashPassword(id, input.password),
      isActive: true
    };
    setUsers((prev) => [...prev, newUser]);
    logAuditAs(currentUser, 'Tambah Pengguna', `Akun baru dibuat: ${newUser.name} (${newUser.email}, peran ${newUser.role})`);
    return { ok: true };
  };

  // Patient Actions
  const addPatient = (newP: Omit<Patient, 'id' | 'mrNumber' | 'registeredAt'>): Patient => {
    const count = patients.length + 1;
    const mrNumber = `RM-2026-${String(count).padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const created: Patient = {
      ...newP,
      id: 'p-' + Date.now(),
      mrNumber,
      registeredAt: today,
      status: 'Aktif'
    };
    setPatients(prev => [created, ...prev]);
    logAudit('Pasien', 'Tambah Pasien Baru', `Mendaftarkan pasien ${created.name} (${mrNumber})`);
    return created;
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    const target = patients.find(p => p.id === id);
    if (target) {
      logAudit('Pasien', 'Perbarui Data Pasien', `Mengubah data pasien ${target.name} (${target.mrNumber})`);
    }
  };

  const getPatient = (id: string) => patients.find(p => p.id === id);

  // Queue Actions
  const addQueue = (item: Omit<QueueItem, 'id' | 'queueNumber' | 'registeredTime' | 'status'>): QueueItem => {
    const prefix = item.department.includes('Umum') ? 'B' : 'A';
    const deptQueues = queues.filter(q => q.queueNumber.startsWith(prefix));
    const nextNum = deptQueues.reduce((m, q) => {
      const v = parseInt(q.queueNumber.split('-')[1] || '0', 10);
      return v > m ? v : m;
    }, 0) + 1;
    const queueNumber = `${prefix}-${String(nextNum).padStart(3, '0')}`;
    const now = new Date();
    const registeredTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const created: QueueItem = {
      ...item,
      id: 'q-' + Date.now(),
      queueNumber,
      registeredTime,
      queueDate: now.toISOString().split('T')[0],
      status: 'Menunggu'
    };

    setQueues(prev => [...prev, created]);
    // Isi kuota jadwal dokter pada hari berjalan
    const todayName = now.toLocaleDateString('id-ID', { weekday: 'long' });
    setSchedules(prev => prev.map(s =>
      s.doctorId === item.doctorId && s.dayOfWeek === todayName
        ? { ...s, bookedCount: s.bookedCount + 1 }
        : s
    ));
    logAudit('Antrian', 'Registrasi Antrian Baru', `Nomor ${queueNumber} untuk pasien ${created.patientName} di ${created.department}`);
    return created;
  };

  const updateQueueStatus = (id: string, status: QueueItem['status']) => {
    setQueues(prev => prev.map(q => (q.id === id ? { ...q, status } : q)));
    const target = queues.find(q => q.id === id);
    if (target) {
      logAudit('Antrian', 'Ubah Status Antrian', `Nomor ${target.queueNumber} (${target.patientName}) diubah ke status ${status}`);
    }
  };

  const callQueuePatient = (queueId: string) => {
    const target = queues.find(q => q.id === queueId);
    if (!target) return;

    // Set previous "Sedang Diperiksa" or "Dipanggil" in same department to Selesai/Menunggu or just update this to Dipanggil
    setQueues(prev => prev.map(q => {
      if (q.id === queueId) return { ...q, status: 'Dipanggil' };
      return q;
    }));

    playQueueChime(target.queueNumber, target.patientName, target.department);
    logAudit('Antrian', 'Panggil Antrian Pasien', `Memanggil antrian ${target.queueNumber} - ${target.patientName}`);
  };


  // Nomor dokumen berikutnya: selalu di atas nomor terbesar yang sudah ada
  const nextDocNumber = (existing: string[], prefix: string, pad: number): string => {
    const max = existing.reduce((m, n) => {
      const match = n.match(/(\d+)$/);
      const v = match ? parseInt(match[1], 10) : 0;
      return v > m ? v : m;
    }, 0);
    return `${prefix}-${String(max + 1).padStart(pad, '0')}`;
  };

  // Terbitkan resep digital dari sebuah record final (sekali saja per record)
  const emitPrescriptionForRecord = (record: MedicalRecord) => {
    if (record.plan.prescriptions.length === 0) return;
    if (prescriptions.some((p) => p.medicalRecordId === record.id)) return;
    const totalCost = record.plan.prescriptions.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
    const newRx: Prescription = {
      id: 'rx-' + Date.now(),
      patientId: record.patientId,
      patientName: record.patientName,
      mrNumber: record.mrNumber,
      doctorId: record.doctorId,
      doctorName: record.doctorName,
      medicalRecordId: record.id,
      date: record.visitDate,
      status: 'Menunggu Farmasi',
      items: record.plan.prescriptions,
      totalCost,
      notes: record.plan.doctorNotes
    };
    setPrescriptions(prev => [newRx, ...prev]);
    const notif: ClinicNotification = {
      id: 'notif-' + Date.now(),
      title: 'Resep Baru Masuk dari Poli',
      message: `Resep ${record.patientName} (${record.mrNumber}) dari ${record.doctorName}`,
      time: 'Baru saja',
      type: 'info',
      read: false,
      linkModule: 'pharmacy'
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Tutup HANYA antrean kunjungan aktif pasien ini (Dipanggil/Sedang Diperiksa)
  const closeActiveQueueForPatient = (patientId: string) => {
    setQueues(prev => prev.map(q =>
      q.patientId === patientId && (q.status === 'Dipanggil' || q.status === 'Sedang Diperiksa')
        ? { ...q, status: 'Selesai' }
        : q
    ));
  };

  // Examination / SOAP
  const saveMedicalRecord = (recordData: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'>, isDraft = false): MedicalRecord => {
    const now = new Date();
    const formatted = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const record: MedicalRecord = {
      ...recordData,
      id: 'mr-rec-' + Date.now(),
      status: isDraft ? 'Draft' : 'Final',
      createdAt: formatted,
      updatedAt: formatted
    };

    setMedicalRecords(prev => [record, ...prev]);

    if (!isDraft) {
      emitPrescriptionForRecord(record);
      closeActiveQueueForPatient(record.patientId);
    }

    logAudit(
      'Rekam Medis',
      isDraft ? 'Simpan Draft Rekam Medis' : 'Simpan Final Rekam Medis',
      `Pemeriksaan SOAP pasien ${record.patientName} (${record.mrNumber}) oleh ${record.doctorName}`
    );

    return record;
  };

  const updateMedicalRecord = (id: string, recordData: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'>, isDraft = false): MedicalRecord => {
    const now = new Date();
    const formatted = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const existing = medicalRecords.find((r) => r.id === id);
    const updated: MedicalRecord = {
      ...recordData,
      id,
      status: isDraft ? 'Draft' : 'Final',
      createdAt: existing?.createdAt || formatted,
      updatedAt: formatted
    };
    setMedicalRecords(prev => prev.map(r => (r.id === id ? updated : r)));

    if (!isDraft) {
      emitPrescriptionForRecord(updated);
      closeActiveQueueForPatient(updated.patientId);
    }

    logAudit(
      'Rekam Medis',
      isDraft ? 'Perbarui Draft Rekam Medis' : 'Finalisasi Rekam Medis dari Draft',
      `Pemeriksaan SOAP pasien ${updated.patientName} (${updated.mrNumber}) oleh ${updated.doctorName}`
    );

    return updated;
  };

  // Prescription Actions
  const createPrescription = (newRx: Omit<Prescription, 'id' | 'date'>): Prescription => {
    const today = new Date().toISOString().split('T')[0];
    const created: Prescription = {
      ...newRx,
      id: 'rx-' + Date.now(),
      date: today
    };
    setPrescriptions(prev => [created, ...prev]);
    logAudit('Resep', 'Pembuatan Resep Dokter', `Resep untuk ${created.patientName} dengan ${created.items.length} item obat`);
    return created;
  };

  const updatePrescriptionStatus = (id: string, status: Prescription['status']) => {
    const target = prescriptions.find(rx => rx.id === id);
    setPrescriptions(prev => prev.map(rx => (rx.id === id ? { ...rx, status } : rx)));
    // Dispensing final: kurangi stok obat tepat sekali saat resep mencapai Selesai
    if (target && status === 'Selesai' && target.status !== 'Selesai') {
      setMedicines(prev => prev.map(med => {
        const item = target.items.find(i => i.medicineId === med.id);
        if (!item) return med;
        return { ...med, stock: Math.max(0, med.stock - item.quantity) };
      }));
      logAudit('Farmasi', 'Penyerahan Obat (Dispensing)', `Resep ${target.patientName} diserahkan; stok ${target.items.length} item obat dikurangi`);
    }
    if (target) {
      logAudit('Resep', 'Perubahan Status Resep', `Status resep ${target.id} (${target.patientName}) diubah ke ${status}`);
    }
  };

  // Pharmacy Actions
  const addMedicine = (med: Omit<Medicine, 'id'>): Medicine => {
    const created: Medicine = {
      ...med,
      id: 'med-' + Date.now()
    };
    setMedicines(prev => [...prev, created]);
    logAudit('Farmasi', 'Tambah Master Obat', `Obat ${created.name} (${created.code}) ditambahkan ke inventori`);
    return created;
  };

  const updateMedicineStock = (id: string, delta: number, reason: string) => {
    setMedicines(prev => prev.map(med => {
      if (med.id === id) {
        const newStock = Math.max(0, med.stock + delta);
        return { ...med, stock: newStock };
      }
      return med;
    }));
    const target = medicines.find(m => m.id === id);
    if (target) {
      logAudit('Farmasi', 'Penyesuaian Stok Obat', `${delta > 0 ? 'Penambahan' : 'Pengurangan'} stok ${target.name} sebanyak ${Math.abs(delta)} (${reason})`);
    }
  };

  // Lab & Radiology Actions
  const createLabOrder = (order: Omit<LabOrder, 'id' | 'orderNumber' | 'orderDate' | 'status'>): LabOrder => {
    const num = nextDocNumber(labOrders.map(o => o.orderNumber), 'X', 4).split('-').pop() as string;
    const today = new Date().toISOString().split('T')[0];
    const created: LabOrder = {
      ...order,
      id: 'lab-' + Date.now(),
      orderNumber: `LAB-2026-${num}`,
      orderDate: today,
      status: 'Requested'
    };
    setLabOrders(prev => [created, ...prev]);
    logAudit('Laboratorium', 'Order Laboratorium Baru', `Pemeriksaan ${created.orderNumber} untuk ${created.patientName}`);
    return created;
  };

  const updateLabResult = (orderId: string, testIndex: number, resultValue: string, isAbnormal: boolean) => {
    setLabOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedItems = [...order.items];
        updatedItems[testIndex] = {
          ...updatedItems[testIndex],
          resultValue,
          isAbnormal
        };
        return { ...order, items: updatedItems, status: 'Processing' };
      }
      return order;
    }));
  };

  const validateLabOrder = (orderId: string, validatorName: string) => {
    const now = new Date();
    const formatted = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setLabOrders(prev => prev.map(order => (order.id === orderId ? { ...order, status: 'Validated', validatedBy: validatorName, validatedAt: formatted } : order)));
    const target = labOrders.find(l => l.id === orderId);
    if (target) {
      logAudit('Laboratorium', 'Validasi Hasil Lab', `Hasil laboratorium ${target.orderNumber} (${target.patientName}) divalidasi oleh ${validatorName}`);
    }
  };

  const createRadiologyOrder = (order: Omit<RadiologyOrder, 'id' | 'orderNumber' | 'orderDate' | 'status'>): RadiologyOrder => {
    const num = nextDocNumber(radiologyOrders.map(o => o.orderNumber), 'X', 4).split('-').pop() as string;
    const today = new Date().toISOString().split('T')[0];
    const created: RadiologyOrder = {
      ...order,
      id: 'rad-' + Date.now(),
      orderNumber: `RAD-2026-${num}`,
      orderDate: today,
      status: 'Permintaan'
    };
    setRadiologyOrders(prev => [created, ...prev]);
    logAudit('Radiologi', 'Permintaan Radiologi Baru', `Pemeriksaan ${created.examinationType} untuk ${created.patientName}`);
    return created;
  };

  const updateRadiologyFinding = (orderId: string, findings: string, impression: string, radiologistName: string) => {
    const today = new Date().toISOString().split('T')[0];
    setRadiologyOrders(prev => prev.map(order => (order.id === orderId ? {
      ...order,
      findings,
      impression,
      radiologistName,
      readingDate: today,
      status: 'Hasil Terbaca'
    } : order)));
    const target = radiologyOrders.find(r => r.id === orderId);
    if (target) {
      logAudit('Radiologi', 'Ekspertise Radiologi Selesai', `Hasil ${target.examinationType} (${target.patientName}) dibaca oleh ${radiologistName}`);
    }
  };

  // Billing Actions
  const createInvoice = (inv: Omit<Invoice, 'id' | 'invoiceNumber' | 'date' | 'dueDate' | 'status' | 'paidAmount'>): Invoice => {
    const num = nextDocNumber(invoices.map(o => o.invoiceNumber), 'X', 4).split('-').pop() as string;
    const today = new Date().toISOString().split('T')[0];
    const created: Invoice = {
      ...inv,
      id: 'inv-' + Date.now(),
      invoiceNumber: `INV-2026-${num}`,
      date: today,
      dueDate: today,
      status: 'Unpaid',
      paidAmount: 0
    };
    setInvoices(prev => [created, ...prev]);
    logAudit('Kasir', 'Penerbitan Invoice Tagihan', `Invoice ${created.invoiceNumber} untuk ${created.patientName} sebesar Rp ${created.total.toLocaleString('id-ID')}`);
    return created;
  };

  const payInvoice = (id: string, amount: number, method: Invoice['paymentMethod']) => {
    const now = new Date();
    const formatted = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        const newPaid = inv.paidAmount + amount;
        const status = newPaid >= inv.total ? 'Paid' : 'Partial';
        return {
          ...inv,
          paidAmount: newPaid,
          status,
          paymentMethod: method,
          paymentDate: formatted
        };
      }
      return inv;
    }));
    const target = invoices.find(i => i.id === id);
    if (target) {
      logAudit('Kasir', 'Pembayaran Tagihan', `Pelunasan ${target.invoiceNumber} sebesar Rp ${amount.toLocaleString('id-ID')} melalui ${method}`);
    }
  };

  // Certificate Actions
  const createCertificate = (cert: Omit<MedicalCertificate, 'id' | 'certificateNumber' | 'issueDate'>): MedicalCertificate => {
    const today = new Date().toISOString().split('T')[0];
    const prefix = cert.type.includes('Sakit') ? 'SKD' : cert.type.includes('Sehat') ? 'SKBS' : 'SRK';
    const num = nextDocNumber(certificates.map(o => o.certificateNumber), 'X', 3).split('-').pop() as string;
    const certificateNumber = `${prefix}/2026/02/${num}`;
    const created: MedicalCertificate = {
      ...cert,
      id: 'cert-' + Date.now(),
      certificateNumber,
      issueDate: today
    };
    setCertificates(prev => [created, ...prev]);
    logAudit('Rekam Medis', 'Penerbitan Dokumen Medis', `${cert.type} (${certificateNumber}) untuk ${cert.patientName}`);
    return created;
  };

  // Notification Actions
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        session,
        login,
        logout,
        changePassword,
        resetUserPassword,
        addUser,
        clinicId,
        users,
        clinicProfile,
        updateClinicProfile,
        patients,
        medicines,
        queues,
        schedules,
        medicalRecords,
        prescriptions,
        labOrders,
        radiologyOrders,
        invoices,
        certificates,
        auditLogs,
        notifications,
        playQueueChime,
        addPatient,
        updatePatient,
        getPatient,
        addQueue,
        updateQueueStatus,
        callQueuePatient,
        saveMedicalRecord,
        updateMedicalRecord,
        createPrescription,
        updatePrescriptionStatus,
        addMedicine,
        updateMedicineStock,
        createLabOrder,
        updateLabResult,
        validateLabOrder,
        createRadiologyOrder,
        updateRadiologyFinding,
        createInvoice,
        payInvoice,
        createCertificate,
        markNotificationRead,
        markAllNotificationsRead,
        logAudit
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};


