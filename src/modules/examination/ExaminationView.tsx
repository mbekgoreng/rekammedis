import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Save,
  Printer,
  Plus,
  Trash2,
  AlertTriangle,
  FileCheck,
  Search,
  CheckCircle2,
  Calendar,
  Activity,
  FlaskConical,
  Scan
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { COMMON_ICD10_LIST } from '../../data/mockData';
import {
  Patient,
  DiagnosisItem,
  PrescriptionItem,
  MedicalProcedure,
  VitalSigns
} from '../../types';

interface ExaminationViewProps {
  selectedPatientId?: string;
  onNavigate: (module: string) => void;
  onSelectPatient: (patientId: string) => void;
}

// Paket panel laboratorium — daftar yang SAMA PERSIS dengan yang dipakai
// LaboratoryView saat membuat order (jangan diubah sepihak di sini saja).
const labPanelItems = (category: string) => {
  if (category === 'Kimia Klinik') {
    return [
      { testName: 'Glukosa Darah Puasa (GDP)', category: 'Kimia Klinik', referenceRange: '70 - 100', unit: 'mg/dL' },
      { testName: 'Ureum Darah', category: 'Fungsi Ginjal', referenceRange: '15 - 45', unit: 'mg/dL' },
      { testName: 'Kreatinin Serum', category: 'Fungsi Ginjal', referenceRange: '0.7 - 1.3', unit: 'mg/dL' },
      { testName: 'SGOT (AST)', category: 'Fungsi Hati', referenceRange: '< 35', unit: 'U/L' },
      { testName: 'SGPT (ALT)', category: 'Fungsi Hati', referenceRange: '< 45', unit: 'U/L' }
    ];
  }
  if (category === 'Profil Lipid') {
    return [
      { testName: 'Kolesterol Total', category: 'Profil Lipid', referenceRange: '< 200', unit: 'mg/dL' },
      { testName: 'Kolesterol HDL', category: 'Profil Lipid', referenceRange: '> 40', unit: 'mg/dL' },
      { testName: 'Kolesterol LDL', category: 'Profil Lipid', referenceRange: '< 100', unit: 'mg/dL' },
      { testName: 'Trigliserida', category: 'Profil Lipid', referenceRange: '< 150', unit: 'mg/dL' }
    ];
  }
  // Hematologi (panel default LaboratoryView)
  return [
    { testName: 'Hemoglobin (Hb)', category: 'Hematologi', referenceRange: '13.0 - 17.5', unit: 'g/dL' },
    { testName: 'Leukosit', category: 'Hematologi', referenceRange: '4.000 - 10.000', unit: '/µL' },
    { testName: 'Trombosit', category: 'Hematologi', referenceRange: '150.000 - 450.000', unit: '/µL' },
    { testName: 'Hematokrit', category: 'Hematologi', referenceRange: '40 - 52', unit: '%' }
  ];
};

export const ExaminationView: React.FC<ExaminationViewProps> = ({
  selectedPatientId,
  onNavigate,
  onSelectPatient
}) => {
  const {
    patients,
    medicines,
    currentUser,
    saveMedicalRecord,
    updateMedicalRecord,
    medicalRecords,
    labOrders,
    radiologyOrders,
    createLabOrder,
    createRadiologyOrder
  } = useStore();

  const [currentPatientId, setCurrentPatientId] = useState<string>(
    selectedPatientId || (patients.length > 0 ? patients[0].id : '')
  );

  const activePatient = patients.find((p) => p.id === currentPatientId);

  // Subjective
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [presentIllness, setPresentIllness] = useState('');
  const [pastIllness, setPastIllness] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');

  // Objective - Vital Signs
  const [vitals, setVitals] = useState({
    systolic: 120,
    diastolic: 80,
    heartRate: 78,
    temperature: 36.5,
    respiratoryRate: 18,
    spO2: 99,
    weight: 65,
    height: 168
  });

  // Physical Exam
  const [physicalExam, setPhysicalExam] = useState({
    head: 'Mesocephal, jejas (-)',
    eyes: 'Konjungtiva anemis (-/-), sklera ikterik (-/-)',
    ears: 'Normotia, sekret (-/-)',
    nose: 'Deformitas (-), sekret (-)',
    throat: 'Faring hiperemis (-), tonsil T1/T1 tenang',
    neck: 'Pembesaran KGB (-), JVP normal',
    thorax: 'Simetris, retraksi (-)',
    heart: 'S1-S2 murni reguler, murmur (-), gallop (-)',
    lungs: 'Vesikuler (+/+), rhonki (-/-), wheezing (-/-)',
    abdomen: 'Supel, bising usus (+) normal, nyeri tekan (-)',
    extremities: 'Akral hangat, CRT < 2 detik, edema (-/-)',
    neurological: 'GCS E4M6V5 (15), reflek fisiologis (+)'
  });

  // Assessment - Diagnoses (mulai kosong: diagnosa tidak boleh terisi karangan)
  const [diagnoses, setDiagnoses] = useState<DiagnosisItem[]>([]);
  const [clinicalImpression, setClinicalImpression] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);
  const [icdSearchQuery, setIcdSearchQuery] = useState('');

  // Plan
  const [therapyPlan, setTherapyPlan] = useState('Edukasi pola hidup sehat, kurangi konsumsi natrium, istirahat cukup.');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('2026-03-15');

  // Procedures
  const [procedures, setProcedures] = useState<MedicalProcedure[]>([
    { id: 'p-1', code: '00.01', name: 'Pemeriksaan Klinis & Konsultasi Dokter', cost: 150000 }
  ]);

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [selectedMedId, setSelectedMedId] = useState(medicines[0]?.id || '');
  const [medDosage, setMedDosage] = useState('500 mg');
  const [medFreq, setMedFreq] = useState('3 x sehari');
  const [medTiming, setMedTiming] = useState<'Sesudah makan' | 'Sebelum makan' | 'Bersama makan' | 'Saat diperlukan (PRN)'>('Sesudah makan');
  const [medDuration, setMedDuration] = useState(5);
  const [medQty, setMedQty] = useState(15);
  const [medInstruction, setMedInstruction] = useState('Minum teratur setelah makan');
  const [rxError, setRxError] = useState<string | null>(null);

  // Penunjang: order lab & radiologi dari pemeriksaan (paket/jenis sama
  // dengan yang dipakai LaboratoryView & RadiologyView)
  const [labCategory, setLabCategory] = useState('Kimia Klinik');
  const [radExamType, setRadExamType] = useState('Foto Rontgen Thorax PA');
  const [radIndication, setRadIndication] = useState('');
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Sync with selectedPatientId prop if updated
  useEffect(() => {
    if (selectedPatientId) {
      setCurrentPatientId(selectedPatientId);
    }
  }, [selectedPatientId]);

  // Ganti pasien = formulir bersih. Draft tersimpan milik pasien dimuat kembali
  // agar bisa dilanjutkan, BUKAN membuat record baru.
  useEffect(() => {
    setChiefComplaint('');
    setPresentIllness('');
    setPastIllness('');
    setCurrentMedications('');
    setVitals({ systolic: 120, diastolic: 80, heartRate: 78, temperature: 36.5, respiratoryRate: 18, spO2: 99, weight: 65, height: 168 });
    setPhysicalExam({
      head: '', eyes: '', ears: '', nose: '', throat: '', neck: '',
      thorax: '', heart: '', lungs: '', abdomen: '', extremities: '', neurological: ''
    });
    setDiagnoses([]);
    setClinicalImpression('');
    setTherapyPlan('');
    setDoctorNotes('');
    setProcedures([{ id: 'p-1', code: '00.01', name: 'Pemeriksaan Klinis & Konsultasi Dokter', cost: 150000 }]);
    setPrescriptions([]);
    setSaveError(null);
    setLoadedDraftId(null);
    setRxError(null);
    setLabCategory('Kimia Klinik');
    setRadExamType('Foto Rontgen Thorax PA');
    setRadIndication('');
    setOrderError(null);
    setOrderSuccess(null);

    const draft = medicalRecords
      .filter((r) => r.patientId === currentPatientId && r.status === 'Draft')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (draft) {
      setLoadedDraftId(draft.id);
      setChiefComplaint(draft.subjective.chiefComplaint);
      setPresentIllness(draft.subjective.historyOfPresentIllness);
      setPastIllness(draft.subjective.historyOfPastIllness);
      setCurrentMedications(draft.subjective.currentMedications);
      setVitals({
        systolic: draft.objective.vitals.systolic,
        diastolic: draft.objective.vitals.diastolic,
        heartRate: draft.objective.vitals.heartRate,
        temperature: draft.objective.vitals.temperature,
        respiratoryRate: draft.objective.vitals.respiratoryRate,
        spO2: draft.objective.vitals.spO2,
        weight: draft.objective.vitals.weight,
        height: draft.objective.vitals.height
      });
      setPhysicalExam(draft.objective.physicalExam);
      setDiagnoses(draft.assessment.diagnoses);
      setClinicalImpression(draft.assessment.clinicalImpression);
      setTherapyPlan(draft.plan.therapyPlan);
      setDoctorNotes(draft.plan.doctorNotes);
      if (draft.plan.nextVisitDate) setNextVisitDate(draft.plan.nextVisitDate);
      setProcedures(draft.plan.procedures);
      setPrescriptions(draft.plan.prescriptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPatientId]);

  // Calculate BMI
  const heightM = vitals.height / 100;
  const bmiRaw = heightM > 0 ? vitals.weight / (heightM * heightM) : 0;
  const bmi = parseFloat(bmiRaw.toFixed(1));

  let bmiCategory: VitalSigns['bmiCategory'] = 'Normal';
  if (bmi < 18.5) bmiCategory = 'Underweight';
  else if (bmi >= 23 && bmi < 25) bmiCategory = 'Overweight';
  else if (bmi >= 25) bmiCategory = 'Obesitas';

  // Handle adding diagnosis
  const handleAddDiagnosis = (code: string, name: string) => {
    if (!diagnoses.some((d) => d.icd10Code === code)) {
      setDiagnoses((prev) => [
        ...prev,
        {
          id: 'd-' + Date.now(),
          icd10Code: code,
          nameIndonesian: name,
          isPrimary: prev.length === 0,
          notes: ''
        }
      ]);
      setIcdSearchQuery('');
    }
  };

  const handleRemoveDiagnosis = (id: string) => {
    setDiagnoses((prev) => prev.filter((d) => d.id !== id));
  };

  // Add prescription item — qty wajib bilangan bulat >= 1 dan total qty obat
  // yang sama di resep tidak boleh melebihi stok master farmasi.
  const handleAddMedicineToRx = () => {
    const med = medicines.find((m) => m.id === selectedMedId);
    if (!med) return;
    setRxError(null);

    if (!Number.isInteger(medQty) || medQty < 1) {
      setRxError(`Jumlah obat ${med.name} tidak valid: harus bilangan bulat minimal 1 (terisi ${medQty}).`);
      return;
    }

    const alreadyQty = prescriptions
      .filter((p) => p.medicineId === med.id)
      .reduce((sum, p) => sum + p.quantity, 0);
    const totalQty = alreadyQty + medQty;
    if (totalQty > med.stock) {
      setRxError(
        `Stok ${med.name} tidak mencukupi: total diminta ${totalQty} ${med.unit}` +
          (alreadyQty > 0 ? ` (sudah ${alreadyQty} ${med.unit} di resep)` : '') +
          `, stok tersedia ${med.stock} ${med.unit}.`
      );
      return;
    }

    const newItem: PrescriptionItem = {
      id: 'rx-item-' + Date.now(),
      medicineId: med.id,
      medicineName: med.name,
      dosage: medDosage,
      frequency: medFreq,
      timing: medTiming,
      durationDays: medDuration,
      quantity: medQty,
      unit: med.unit,
      instructions: medInstruction,
      pricePerUnit: med.price
    };

    setPrescriptions((prev) => [...prev, newItem]);
  };

  const handleRemovePrescription = (id: string) => {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
  };

  // Check allergy conflict — SATU logika pencocokan untuk banner peringatan
  // maupun pemblokiran simpan final: kembalikan nama alergi yang cocok.
  const getAllergyConflict = (medName: string): string | null => {
    if (!activePatient || activePatient.allergies.length === 0) return null;
    return (
      activePatient.allergies.find(
        (allergy) =>
          medName.toLowerCase().includes(allergy.toLowerCase()) ||
          allergy.toLowerCase().includes(medName.toLowerCase())
      ) || null
    );
  };

  const checkAllergyWarning = (medName: string) => getAllergyConflict(medName) !== null;

  // Validasi rentang tanda vital untuk SIMPAN FINAL. Nilai 0 berarti kolom
  // dikosongkan pada input (input mengonversi kosong menjadi 0), jadi nilai 0
  // dianggap TIDAK TERISI dan tidak divalidasi — yang kosong tetap boleh kosong.
  const validateVitalsForFinal = (): string[] => {
    const errs: string[] = [];
    const filled = (v: number) => Number.isFinite(v) && v !== 0;
    const check = (label: string, value: number, min: number, max: number, unit: string) => {
      if (filled(value) && (value < min || value > max)) {
        errs.push(`${label} ${value} ${unit} di luar rentang aman (${min}–${max} ${unit})`);
      }
    };
    check('Tekanan darah sistol', vitals.systolic, 40, 300, 'mmHg');
    check('Tekanan darah diastol', vitals.diastolic, 20, 200, 'mmHg');
    check('Denyut nadi', vitals.heartRate, 20, 250, 'bpm');
    check('Suhu tubuh', vitals.temperature, 30, 45, '°C');
    check('SpO2', vitals.spO2, 50, 100, '%');
    check('Respirasi', vitals.respiratoryRate, 4, 60, 'x/menit');
    check('Berat badan', vitals.weight, 0.5, 500, 'kg');
    check('Tinggi badan', vitals.height, 20, 250, 'cm');
    if (filled(vitals.systolic) && filled(vitals.diastolic) && vitals.diastolic >= vitals.systolic) {
      errs.push(
        `Tekanan darah diastol (${vitals.diastolic} mmHg) harus lebih kecil dari sistol (${vitals.systolic} mmHg)`
      );
    }
    return errs;
  };

  // Order penunjang untuk pasien yang sedang diperiksa
  const patientLabOrders = labOrders.filter((o) => o.patientId === currentPatientId);
  const patientRadOrders = radiologyOrders.filter((o) => o.patientId === currentPatientId);

  const handleCreateLabOrderFromExam = () => {
    if (!activePatient) return;
    setOrderError(null);
    setOrderSuccess(null);
    const created = createLabOrder({
      patientId: activePatient.id,
      patientName: activePatient.name,
      mrNumber: activePatient.mrNumber,
      doctorName: currentUser.name,
      items: labPanelItems(labCategory),
      notes: `Order ${labCategory} rujukan klinis`
    });
    setOrderSuccess(`Order laboratorium ${created.orderNumber} (${labCategory}) dibuat untuk ${activePatient.name} dan diteruskan ke instalasi laboratorium.`);
  };

  const handleCreateRadiologyOrderFromExam = () => {
    if (!activePatient) return;
    setOrderError(null);
    setOrderSuccess(null);
    if (!radIndication.trim()) {
      setOrderError('Indikasi klinis radiologi wajib diisi sebelum membuat order.');
      return;
    }
    const created = createRadiologyOrder({
      patientId: activePatient.id,
      patientName: activePatient.name,
      mrNumber: activePatient.mrNumber,
      doctorName: currentUser.name,
      examinationType: radExamType,
      clinicalIndication: radIndication.trim()
    });
    setOrderSuccess(`Order radiologi ${created.orderNumber} (${radExamType}) dibuat untuk ${activePatient.name} dan diteruskan ke instalasi radiologi.`);
    setRadIndication('');
  };

  // Save Medical Record (Draft or Final)
  // Kolom kosong TIDAK PERNAH diganti teks karangan — yang tersimpan adalah
  // persis yang diisi dokter. Keluhan utama wajib; final wajib punya diagnosa.
  const handleSave = (isDraft: boolean) => {
    if (!activePatient) return;
    setSaveError(null);

    if (!chiefComplaint.trim()) {
      setSaveError('Keluhan utama wajib diisi — rekam medis tidak boleh memuat keluhan karangan.');
      return;
    }
    if (!isDraft && diagnoses.length === 0) {
      setSaveError('Rekam medis final wajib memiliki minimal satu diagnosa ICD-10.');
      return;
    }

    // Keamanan simpan FINAL (draft sengaja dibiarkan longgar agar pekerjaan
    // dokter tidak hilang): tanda vital wajib dalam rentang aman, dan obat
    // yang bertentangan dengan alergi pasien MEMBLOKIR finalisasi.
    if (!isDraft) {
      const vitalErrors = validateVitalsForFinal();
      if (vitalErrors.length > 0) {
        setSaveError('Simpan final ditolak — tanda vital tidak valid: ' + vitalErrors.join('; ') + '.');
        return;
      }

      const allergyConflicts = prescriptions
        .map((rx) => ({ rx, allergy: getAllergyConflict(rx.medicineName) }))
        .filter((c) => c.allergy !== null);
      if (allergyConflicts.length > 0) {
        const detail = allergyConflicts
          .map((c) => `${c.rx.medicineName} (alergi: ${c.allergy})`)
          .join('; ');
        setSaveError(
          `Simpan final ditolak — resep mengandung obat yang bertentangan dengan alergi pasien: ${detail}. ` +
            'Ganti obat tersebut terlebih dahulu, atau simpan sebagai draft bila masih perlu ditinjau.'
        );
        return;
      }
    }

    const payload = {
      patientId: activePatient.id,
      mrNumber: activePatient.mrNumber,
      patientName: activePatient.name,
      doctorId: currentUser.id,
      doctorName: currentUser.name,
      department: currentUser.department || 'Poli Umum',
      visitDate: new Date().toISOString().split('T')[0],
      visitType: 'Kontrol Rutin' as const,
      subjective: {
        chiefComplaint: chiefComplaint.trim(),
        historyOfPresentIllness: presentIllness,
        historyOfPastIllness: pastIllness,
        currentMedications: currentMedications
      },
      objective: {
        vitals: {
          ...vitals,
          bmi,
          bmiCategory
        },
        physicalExam
      },
      assessment: {
        diagnoses,
        clinicalImpression
      },
      plan: {
        therapyPlan,
        procedures,
        prescriptions,
        doctorNotes,
        nextVisitDate
      }
    };

    if (loadedDraftId) {
      const updated = updateMedicalRecord(loadedDraftId, payload, isDraft);
      if (!isDraft) setLoadedDraftId(null);
      else setLoadedDraftId(updated.id);
    } else {
      const created = saveMedicalRecord(payload, isDraft);
      if (isDraft) setLoadedDraftId(created.id);
    }

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Patient Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-clinical-700 uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4 text-clinical-600" /> Formulir Pemeriksaan Medis (SOAP Note)
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Asuhan Medis Elektronik
          </h1>
          <p className="text-xs text-slate-500">
            Dokter Pemeriksa: <strong>{currentUser.name}</strong> ({currentUser.department || 'Poliklinik'})
          </p>
        </div>

        {/* Patient Selection Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 shrink-0">Pilih Pasien:</label>
          <select
            value={currentPatientId}
            onChange={(e) => {
              // Hanya mengganti pasien pada formulir — TIDAK berpindah modul.
              // (Sebelumnya pilihan ini melempar pengguna ke halaman detail pasien.)
              setCurrentPatientId(e.target.value);
            }}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-clinical-500"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.mrNumber} - {p.name} ({p.age} thn, {p.gender})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Clinical Profile Quick Bar */}
      {activePatient && (
        <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-clinical-600 flex items-center justify-center font-bold text-sm text-white">
              {activePatient.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">{activePatient.name}</span>
                <span className="font-mono text-cyan-300 font-bold px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                  {activePatient.mrNumber}
                </span>
                <span className="text-slate-400">
                  {activePatient.age} Thn &bull; {activePatient.gender} &bull; Gol. Darah:{' '}
                  <strong className="text-red-400">{activePatient.bloodType}</strong>
                </span>
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Penjamin: <strong>{activePatient.insuranceType}</strong> &bull; NIK: {activePatient.nik}
              </div>
            </div>
          </div>

          {/* Allergy Alert */}
          {activePatient.allergies.length > 0 ? (
            <div className="flex items-center gap-2 bg-red-950/80 border border-red-800 text-red-200 px-3 py-1.5 rounded-lg text-xs">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
              <span>
                <strong>Alergi:</strong> {activePatient.allergies.join(', ')}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 text-xs">Tidak ada riwayat alergi obat</span>
          )}
        </div>
      )}

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            Rekam Medis (SOAP) berhasil disimpan ke dalam database fasilitas kesehatan dan resep diteruskan ke instalasi farmasi!
          </span>
        </div>
      )}

      {/* SOAP Form Sections */}
      <div className="space-y-6">
        {/* S - SUBJECTIVE */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-clinical-700 text-white flex items-center justify-center text-xs font-black">
                S
              </span>
              <span className="text-base font-bold text-slate-900">
                Subjective (Anamnesis & Keluhan Pasien)
              </span>
            </div>
          }
          subtitle="Informasi gejala, riwayat penyakit sekarang dan riwayat obat yang didapatkan dari pasien"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Keluhan Utama Pasien <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Contoh: Pasien mengeluh pusing berputar dan mual sejak kemarin pagi..."
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinical-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Riwayat Penyakit Sekarang (RPS)
              </label>
              <textarea
                rows={2}
                value={presentIllness}
                onChange={(e) => setPresentIllness(e.target.value)}
                placeholder="Kronologi, frekuensi, faktor pemberat/peringan gejala..."
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinical-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Riwayat Penyakit Dahulu & Keluarga (RPD)
              </label>
              <input
                type="text"
                value={pastIllness}
                onChange={(e) => setPastIllness(e.target.value)}
                placeholder="Hipertensi sejak 2 thn lalu, DM disangkal, riwayat stroke keluarga..."
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinical-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Pengobatan yang Sedang Dikonsumsi
              </label>
              <input
                type="text"
                value={currentMedications}
                onChange={(e) => setCurrentMedications(e.target.value)}
                placeholder="Amlodipine 5 mg 1x1, Paracetamol jika demam..."
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinical-500"
              />
            </div>
          </div>
        </Card>

        {/* O - OBJECTIVE */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-clinical-700 text-white flex items-center justify-center text-xs font-black">
                O
              </span>
              <span className="text-base font-bold text-slate-900">
                Objective (Tanda Vital & Pemeriksaan Fisik)
              </span>
            </div>
          }
          subtitle="Hasil pengukuran tanda vital mandiri/perawat dan pemeriksaan fisik per organ"
        >
          <div className="space-y-5">
            {/* Vital Signs Grid */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
                Tanda-Tanda Vital (Vital Signs)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <Input
                  label="TD Sistol"
                  type="number"
                  value={vitals.systolic}
                  onChange={(e) => setVitals({ ...vitals, systolic: parseInt(e.target.value) || 0 })}
                  rightIcon={<span className="text-[10px] text-slate-400">mmHg</span>}
                />
                <Input
                  label="TD Diastol"
                  type="number"
                  value={vitals.diastolic}
                  onChange={(e) => setVitals({ ...vitals, diastolic: parseInt(e.target.value) || 0 })}
                  rightIcon={<span className="text-[10px] text-slate-400">mmHg</span>}
                />
                <Input
                  label="Denyut Nadi"
                  type="number"
                  value={vitals.heartRate}
                  onChange={(e) => setVitals({ ...vitals, heartRate: parseInt(e.target.value) || 0 })}
                  rightIcon={<span className="text-[10px] text-slate-400">bpm</span>}
                />
                <Input
                  label="Suhu Tubuh"
                  type="number"
                  step="0.1"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: parseFloat(e.target.value) || 0 })}
                  rightIcon={<span className="text-[10px] text-slate-400">°C</span>}
                />
                <Input
                  label="Respirasi"
                  type="number"
                  value={vitals.respiratoryRate}
                  onChange={(e) => setVitals({ ...vitals, respiratoryRate: parseInt(e.target.value) || 0 })}
                  rightIcon={<span className="text-[10px] text-slate-400">x/m</span>}
                />
                <Input
                  label="SpO2"
                  type="number"
                  value={vitals.spO2}
                  onChange={(e) => setVitals({ ...vitals, spO2: parseInt(e.target.value) || 0 })}
                  rightIcon={<span className="text-[10px] text-slate-400">%</span>}
                />
                <Input
                  label="Berat Badan"
                  type="number"
                  value={vitals.weight}
                  onChange={(e) => setVitals({ ...vitals, weight: parseFloat(e.target.value) || 0 })}
                  rightIcon={<span className="text-[10px] text-slate-400">kg</span>}
                />
                <Input
                  label="Tinggi Badan"
                  type="number"
                  value={vitals.height}
                  onChange={(e) => setVitals({ ...vitals, height: parseFloat(e.target.value) || 0 })}
                  rightIcon={<span className="text-[10px] text-slate-400">cm</span>}
                />
              </div>

              {/* BMI Live Output */}
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600">Kalkulasi Body Mass Index (BMI):</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{bmi}</span>
                  <span className="text-slate-400 font-mono">kg/m²</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Status Gizi:</span>
                  <Badge
                    variant={
                      bmiCategory === 'Normal'
                        ? 'success'
                        : bmiCategory === 'Overweight'
                        ? 'warning'
                        : 'danger'
                    }
                    size="sm"
                  >
                    {bmiCategory}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Physical Exam per Organ System */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Pemeriksaan Fisik per Organ (General Examination)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {Object.entries(physicalExam).map(([key, val]) => (
                  <div key={key}>
                    <label className="block text-[11px] font-bold text-slate-600 capitalize mb-1">
                      {key}
                    </label>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => setPhysicalExam({ ...physicalExam, [key]: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-clinical-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* A - ASSESSMENT */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-clinical-700 text-white flex items-center justify-center text-xs font-black">
                A
              </span>
              <span className="text-base font-bold text-slate-900">
                Assessment (Diagnosa ICD-10 & Kesimpulan Klinis)
              </span>
            </div>
          }
          subtitle="Pilih kode ICD-10 standar World Health Organization untuk pelaporan medis resmi"
        >
          <div className="space-y-4">
            {/* Quick ICD-10 Search / Selection */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">
                  Cari & Tambahkan Diagnosa ICD-10:
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={icdSearchQuery}
                  onChange={(e) => setIcdSearchQuery(e.target.value)}
                  placeholder="Ketik kode ICD-10 atau nama penyakit (e.g. Hipertensi, Asma, Dispepsia)..."
                  className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinical-500"
                />
              </div>

              {/* Suggestions */}
              {icdSearchQuery.trim() && (
                <div className="mt-2 bg-white border border-slate-200 rounded-lg p-2 max-h-36 overflow-y-auto space-y-1 shadow-2xs">
                  {COMMON_ICD10_LIST.filter(
                    (i) =>
                      i.code.toLowerCase().includes(icdSearchQuery.toLowerCase()) ||
                      i.name.toLowerCase().includes(icdSearchQuery.toLowerCase())
                  ).map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleAddDiagnosis(item.code, item.name)}
                      className="w-full text-left p-1.5 hover:bg-clinical-50 rounded flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-clinical-700 bg-clinical-50 px-1.5 py-0.2 rounded">
                          {item.code}
                        </span>
                        <span className="text-slate-800">{item.name}</span>
                      </div>
                      <span className="text-[10px] text-clinical-600 font-semibold">+ Tambah</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clinical Impression */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">
                Kesimpulan Klinis (Impresi Dokter):
              </span>
              <textarea
                value={clinicalImpression}
                onChange={(e) => setClinicalImpression(e.target.value)}
                rows={2}
                placeholder="Tuliskan kesimpulan klinis Anda sendiri — bagian ini tidak diisi otomatis oleh sistem."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinical-500"
              />
            </div>

            {/* List of Chosen Diagnoses */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Daftar Diagnosa Pasien Saat Ini:
              </span>
              {diagnoses.map((d, index) => (
                <div
                  key={d.id}
                  className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-clinical-700 bg-clinical-50 border border-clinical-200 px-2 py-1 rounded">
                      {d.icd10Code}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900">{d.nameIndonesian}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                          <input
                            type="radio"
                            name="primaryDiagnosis"
                            checked={d.isPrimary}
                            onChange={() =>
                              setDiagnoses(
                                diagnoses.map((item, idx) => ({
                                  ...item,
                                  isPrimary: idx === index
                                }))
                              )
                            }
                          />
                          <span>Diagnosa Primer</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveDiagnosis(d.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                    title="Hapus Diagnosa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* P - PLAN (THERAPY & E-PRESCRIBING) */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-clinical-700 text-white flex items-center justify-center text-xs font-black">
                P
              </span>
              <span className="text-base font-bold text-slate-900">
                Plan (Rencana Terapi, Tindakan & Resep Digital)
              </span>
            </div>
          }
          subtitle="Instruksi medis, tindakan klinis, dan peresepan obat langsung ke farmasi"
        >
          <div className="space-y-5">
            {/* Therapy Plan Text */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Rencana Terapi & Edukasi Pasien
              </label>
              <textarea
                rows={2}
                value={therapyPlan}
                onChange={(e) => setTherapyPlan(e.target.value)}
                placeholder="Rencana penatalaksanaan non-farmakologis, saran diet, pembatasan aktivitas..."
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinical-500"
              />
            </div>

            {/* E-Prescribing Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Resep Obat Elektronik (E-Prescription)
                </span>
                <span className="text-[11px] text-slate-500">
                  Terhubung ke Instalasi Farmasi
                </span>
              </div>

              {/* Prescription Builder Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Pilih Obat Farmasi
                  </label>
                  <select
                    value={selectedMedId}
                    onChange={(e) => {
                      setSelectedMedId(e.target.value);
                      const m = medicines.find((x) => x.id === e.target.value);
                      if (m) setMedDosage(m.strength);
                    }}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none"
                  >
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Stok: {m.stock} {m.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Dosis
                  </label>
                  <input
                    type="text"
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    placeholder="500 mg"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Frekuensi
                  </label>
                  <select
                    value={medFreq}
                    onChange={(e) => setMedFreq(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                  >
                    <option value="3 x sehari">3 x sehari</option>
                    <option value="2 x sehari">2 x sehari</option>
                    <option value="1 x sehari">1 x sehari</option>
                    <option value="4 x sehari">4 x sehari</option>
                    <option value="Bila perlu (PRN)">Bila perlu (PRN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Aturan Waktu
                  </label>
                  <select
                    value={medTiming}
                    onChange={(e) => setMedTiming(e.target.value as typeof medTiming)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                  >
                    <option value="Sesudah makan">Sesudah makan</option>
                    <option value="Sebelum makan">Sebelum makan</option>
                    <option value="Bersama makan">Bersama makan</option>
                    <option value="Saat diperlukan (PRN)">Saat diperlukan (PRN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Jumlah
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={medQty}
                      onChange={(e) => setMedQty(parseInt(e.target.value) || 1)}
                      className="w-16 text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleAddMedicineToRx}
                      className="flex-1"
                    >
                      + Tambah
                    </Button>
                  </div>
                </div>
              </div>

              {/* Rx validation error (qty / stok) */}
              {rxError && (
                <div className="p-2.5 bg-red-50 border border-red-300 rounded-lg text-red-800 text-xs flex items-center gap-2" role="alert">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{rxError}</span>
                </div>
              )}

              {/* Allergy Warning if current selected med is allergic */}
              {(() => {
                const currentMed = medicines.find((m) => m.id === selectedMedId);
                if (currentMed && checkAllergyWarning(currentMed.name)) {
                  return (
                    <div className="p-2.5 bg-red-100 border border-red-300 rounded-lg text-red-900 text-xs flex items-center gap-2 animate-bounce">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <strong>PERINGATAN:</strong> Pasien memiliki riwayat alergi terhadap obat ini! Mohon pertimbangkan obat alternatif.
                    </div>
                  );
                }
                return null;
              })()}

              {/* Prescription Items Table */}
              {prescriptions.length > 0 ? (
                <div className="mt-3 bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Nama Obat</th>
                        <th className="py-2 px-3">Dosis & Frekuensi</th>
                        <th className="py-2 px-3">Aturan Pakai</th>
                        <th className="py-2 px-3">Jumlah</th>
                        <th className="py-2 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prescriptions.map((rxItem) => (
                        <tr key={rxItem.id}>
                          <td className="py-2 px-3 font-bold text-slate-800">
                            {rxItem.medicineName}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {rxItem.dosage} &bull; {rxItem.frequency}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{rxItem.timing}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                            {rxItem.quantity} {rxItem.unit}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemovePrescription(rxItem.id)}
                              className="text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Belum ada obat yang dimasukkan ke dalam resep.
                </p>
              )}
            </div>

            {/* Follow up date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Jadwal Kontrol Ulang Berikutnya"
                type="date"
                value={nextVisitDate}
                onChange={(e) => setNextVisitDate(e.target.value)}
              />
              <Input
                label="Catatan Khusus Dokter"
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Catatan tambahan untuk apoteker atau perawat..."
              />
            </div>
          </div>
        </Card>

        {/* PENUNJANG — Order Laboratorium & Radiologi dari pemeriksaan */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-clinical-700 text-white flex items-center justify-center text-xs font-black">
                <FlaskConical className="w-3.5 h-3.5" />
              </span>
              <span className="text-base font-bold text-slate-900">
                Penunjang (Order Laboratorium & Radiologi)
              </span>
            </div>
          }
          subtitle="Buat order penunjang untuk pasien yang sedang diperiksa — order langsung diteruskan ke instalasi terkait"
        >
          <div className="space-y-4">
            {orderError && (
              <div className="p-2.5 bg-red-50 border border-red-300 rounded-lg text-red-800 text-xs flex items-center gap-2" role="alert">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{orderError}</span>
              </div>
            )}
            {orderSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{orderSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Order Laboratorium */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-clinical-600" /> Order Laboratorium
                </span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Paket Panel Pemeriksaan
                  </label>
                  <select
                    value={labCategory}
                    onChange={(e) => setLabCategory(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none"
                  >
                    <option value="Kimia Klinik">Panel Kimia Darah Lengkap (GDP, Ureum, Kreatinin, SGOT, SGPT)</option>
                    <option value="Hematologi">Panel Darah Rutin (Hb, Leukosit, Trombosit, Hematokrit)</option>
                    <option value="Profil Lipid">Panel Profil Lipid (Kolesterol Total, HDL, LDL, Trigliserida)</option>
                  </select>
                </div>
                <Button type="button" variant="primary" size="sm" onClick={handleCreateLabOrderFromExam} className="w-full">
                  + Buat Order Lab
                </Button>

                {patientLabOrders.length > 0 ? (
                  <ul className="space-y-1.5 pt-1">
                    {patientLabOrders.map((o) => (
                      <li key={o.id} className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]">
                        <span className="font-mono font-bold text-slate-800">{o.orderNumber}</span>
                        <span className="text-slate-500 flex-1 truncate">{o.items.map((i) => i.testName).join(', ')}</span>
                        <Badge variant="neutral" size="sm">{o.status}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Belum ada order laboratorium untuk pasien ini.</p>
                )}
              </div>

              {/* Order Radiologi */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Scan className="w-4 h-4 text-clinical-600" /> Order Radiologi
                </span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Jenis Pemeriksaan
                  </label>
                  <select
                    value={radExamType}
                    onChange={(e) => setRadExamType(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none"
                  >
                    <option value="Foto Rontgen Thorax PA">Foto Rontgen Thorax PA</option>
                    <option value="USG Abdomen 2 Posisi">USG Abdomen 2 Posisi</option>
                    <option value="Foto Rontgen Ekstremitas">Foto Rontgen Ekstremitas</option>
                    <option value="Panoramic Gigi">Panoramic Foto Gigi & Rahang</option>
                  </select>
                </div>
                <Input
                  label="Indikasi Klinis / Diagnosis Kerja"
                  value={radIndication}
                  onChange={(e) => setRadIndication(e.target.value)}
                  placeholder="Alasan rujukan foto radiologi..."
                />
                <Button type="button" variant="primary" size="sm" onClick={handleCreateRadiologyOrderFromExam} className="w-full">
                  + Buat Order Radiologi
                </Button>

                {patientRadOrders.length > 0 ? (
                  <ul className="space-y-1.5 pt-1">
                    {patientRadOrders.map((o) => (
                      <li key={o.id} className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]">
                        <span className="font-mono font-bold text-slate-800">{o.orderNumber}</span>
                        <span className="text-slate-500 flex-1 truncate">{o.examinationType}</span>
                        <Badge variant="neutral" size="sm">{o.status}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Belum ada order radiologi untuk pasien ini.</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Sticky Action Footer */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-300 shadow-xl flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <FileCheck className="w-4 h-4 text-clinical-600" />
          <span>Format Rekam Medis Standar Nasional Permenkes No. 24 Tahun 2022</span>
        </div>

        <div className="flex flex-col items-end gap-2">
          {loadedDraftId && (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
              Draft tersimpan pasien ini dimuat — menyimpan akan memperbarui draft yang sama
            </span>
          )}
          {saveError && (
            <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5" role="alert">
              {saveError}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4 text-slate-600" />}
          >
            Cetak Lembar SOAP
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => handleSave(true)}
            leftIcon={<Save className="w-4 h-4 text-slate-600" />}
          >
            Simpan Draft
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => handleSave(false)}
            leftIcon={<CheckCircle2 className="w-4 h-4 text-white" />}
          >
            Simpan Final Rekam Medis
          </Button>
        </div>
      </div>
    </div>
  );
};
