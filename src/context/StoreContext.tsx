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

interface StoreContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  users: User[];
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

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial from localStorage or defaults
  const loadLocal = <T,>(key: string, initial: T): T => {
    try {
      const saved = localStorage.getItem(`tongfang_v3_${key}`);
      return saved ? JSON.parse(saved) : initial;
    } catch {
      return initial;
    }
  };

  const [users] = useState<User[]>(() => loadLocal('users', INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState<User>(() => loadLocal('currentUser', INITIAL_USERS[0]));
  const [patients, setPatients] = useState<Patient[]>(() => loadLocal('patients', INITIAL_PATIENTS));
  const [medicines, setMedicines] = useState<Medicine[]>(() => loadLocal('medicines', INITIAL_MEDICINES));
  const [queues, setQueues] = useState<QueueItem[]>(() => loadLocal('queues', INITIAL_QUEUES));
  const [schedules, setSchedules] = useState<DoctorSchedule[]>(() => loadLocal('schedules', INITIAL_SCHEDULES));
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>(() => loadLocal('records', INITIAL_MEDICAL_RECORDS));
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => loadLocal('prescriptions', INITIAL_PRESCRIPTIONS));
  const [labOrders, setLabOrders] = useState<LabOrder[]>(() => loadLocal('lab_orders', INITIAL_LAB_ORDERS));
  const [radiologyOrders, setRadiologyOrders] = useState<RadiologyOrder[]>(() => loadLocal('radiology_orders', INITIAL_RADIOLOGY_ORDERS));
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadLocal('invoices', INITIAL_INVOICES));
  const [certificates, setCertificates] = useState<MedicalCertificate[]>(() => loadLocal('certificates', INITIAL_CERTIFICATES));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadLocal('audit_logs', INITIAL_AUDIT_LOGS));
  const [notifications, setNotifications] = useState<ClinicNotification[]>(() => loadLocal('notifications', INITIAL_NOTIFICATIONS));

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('tongfang_v3_currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('tongfang_v3_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('tongfang_v3_medicines', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem('tongfang_v3_queues', JSON.stringify(queues));
  }, [queues]);

  useEffect(() => {
    localStorage.setItem('tongfang_v3_records', JSON.stringify(medicalRecords));
  }, [medicalRecords]);

  useEffect(() => {
    localStorage.setItem('tongfang_v3_prescriptions', JSON.stringify(prescriptions));
  }, [prescriptions]);

  useEffect(() => {
    localStorage.setItem('tongfang_v3_lab_orders', JSON.stringify(labOrders));
  }, [labOrders]);

  useEffect(() => {
    localStorage.setItem('tongfang_v3_radiology_orders', JSON.stringify(radiologyOrders));
  }, [radiologyOrders]);

  useEffect(() => {
    localStorage.setItem('tongfang_v3_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('tongfang_v3_certificates', JSON.stringify(certificates));
  }, [certificates]);

  useEffect(() => {
    localStorage.setItem('tongfang_v3_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('tongfang_v3_notifications', JSON.stringify(notifications));
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

  // Switch role helper
  const switchRole = (role: UserRole) => {
    const userForRole = users.find(u => u.role === role) || {
      id: 'u-' + role,
      name: `Staf ${role.toUpperCase()}`,
      email: `${role}@tongfangashiap.id`,
      role
    };
    setCurrentUser(userForRole);
    logAudit('Pengguna', 'Ganti Peran Aktif', `Beralih ke peran ${role}`);
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
    const nextNum = deptQueues.length + 1;
    const queueNumber = `${prefix}-${String(nextNum).padStart(3, '0')}`;
    const now = new Date();
    const registeredTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const created: QueueItem = {
      ...item,
      id: 'q-' + Date.now(),
      queueNumber,
      registeredTime,
      status: 'Menunggu'
    };

    setQueues(prev => [...prev, created]);
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

    // Also if there are prescriptions in plan, automatically create digital prescription
    if (record.plan.prescriptions.length > 0 && !isDraft) {
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

      // Push notification to pharmacy
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
    }

    // Update patient status and queue item to "Selesai" if matching
    setQueues(prev => prev.map(q => q.patientId === record.patientId ? { ...q, status: 'Selesai' } : q));

    logAudit(
      'Rekam Medis',
      isDraft ? 'Simpan Draft Rekam Medis' : 'Simpan Final Rekam Medis',
      `Pemeriksaan SOAP pasien ${record.patientName} (${record.mrNumber}) oleh ${record.doctorName}`
    );

    return record;
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
    setPrescriptions(prev => prev.map(rx => (rx.id === id ? { ...rx, status } : rx)));
    const target = prescriptions.find(rx => rx.id === id);
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
    const num = String(labOrders.length + 1).padStart(4, '0');
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
    const num = String(radiologyOrders.length + 1).padStart(4, '0');
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
    const num = String(invoices.length + 1).padStart(4, '0');
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
    const num = String(certificates.length + 1).padStart(3, '0');
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
        switchRole,
        users,
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


