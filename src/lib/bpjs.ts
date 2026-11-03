// Perhitungan indikator BPJS/KBK & daftar kerja Prolanis dari data lokal klinik.
//
// STATUS: pemantauan internal. Angka-angka ini dihitung dari data kunjungan
// klinik sendiri sebagai persiapan dan bahan evaluasi — BUKAN laporan resmi
// ke BPJS Kesehatan. Pelaporan resmi (P-Care) memerlukan bridging di backend
// dengan kredensial faskes yang diterbitkan BPJS.
//
// Definisi yang dipakai (KBK FKTP):
// - Angka Kontak = peserta unik yang berkunjung dalam sebulan / total peserta
//   terdaftar × 1000 (target umum ≥ 150‰).
// - Rasio Rujukan Non-Spesialistik = surat rujukan peserta / total kunjungan
//   peserta × 100% (target umum ≤ 2%).
// - Prolanis Terkendali = peserta DM/hipertensi yang kontrol pada bulan
//   berjalan / total peserta prolanis.

import type { MedicalCertificate, MedicalRecord, Patient } from '../types';

export function isBpjs(patient: Patient): boolean {
  return patient.insuranceType === 'BPJS Kesehatan';
}

export type ProlanisKind = 'DM' | 'Hipertensi' | 'DM & Hipertensi';

export function prolanisKind(patient: Patient): ProlanisKind | null {
  const text = (patient.chronicDiseases || []).join(' ').toLowerCase();
  const dm = /diabetes|diabet|kencing manis|\bdm\b/.test(text);
  const ht = /hipertensi|darah tinggi|hypertension/.test(text);
  if (dm && ht) return 'DM & Hipertensi';
  if (dm) return 'DM';
  if (ht) return 'Hipertensi';
  return null;
}

export interface ProlanisEntry {
  patient: Patient;
  kind: ProlanisKind;
  lastVisit: string | null;
  controlledThisMonth: boolean;
}

export interface BpjsStats {
  periodLabel: string;
  pesertaTotal: number;
  pesertaVerified: number;
  kunjungan: number;
  pesertaAktif: number;
  angkaKontak: number;
  rujukan: number;
  rasioRujukan: number;
  prolanis: ProlanisEntry[];
  prolanisControlled: number;
}

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function computeBpjsStats(
  patients: Patient[],
  medicalRecords: MedicalRecord[],
  certificates: MedicalCertificate[]
): BpjsStats {
  const peserta = patients.filter(isBpjs);
  const pesertaIds = new Set(peserta.map((p) => p.id));

  // Jangkar periode = bulan kunjungan terakhir pada data (agar angka selalu
  // bermakna juga untuk data contoh), jatuh ke bulan berjalan bila kosong.
  const sortedDates = medicalRecords.map((r) => r.visitDate).sort();
  const anchor = sortedDates.length > 0 ? new Date(sortedDates[sortedDates.length - 1]) : new Date();
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const inPeriod = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getFullYear() === y && d.getMonth() === m;
  };

  const periodRecords = medicalRecords.filter((r) => pesertaIds.has(r.patientId) && inPeriod(r.visitDate));
  const kunjungan = periodRecords.length;
  const pesertaAktif = new Set(periodRecords.map((r) => r.patientId)).size;
  const angkaKontak = peserta.length > 0 ? Math.round((pesertaAktif / peserta.length) * 1000) : 0;

  const rujukan = certificates.filter(
    (c) => c.type === 'Surat Rujukan' && pesertaIds.has(c.patientId) && inPeriod(c.issueDate)
  ).length;
  const rasioRujukan = kunjungan > 0 ? (rujukan / kunjungan) * 100 : 0;

  const lastVisitOf = (patientId: string): string | null => {
    const dates = medicalRecords.filter((r) => r.patientId === patientId).map((r) => r.visitDate).sort();
    return dates.length > 0 ? dates[dates.length - 1] : null;
  };

  const prolanis: ProlanisEntry[] = peserta
    .map((patient) => {
      const kind = prolanisKind(patient);
      if (!kind) return null;
      const lastVisit = lastVisitOf(patient.id);
      return {
        patient,
        kind,
        lastVisit,
        controlledThisMonth: lastVisit !== null && inPeriod(lastVisit)
      } as ProlanisEntry;
    })
    .filter((x): x is ProlanisEntry => x !== null)
    .sort((a, b) => Number(a.controlledThisMonth) - Number(b.controlledThisMonth));

  return {
    periodLabel: `${MONTHS_ID[m]} ${y}`,
    pesertaTotal: peserta.length,
    pesertaVerified: peserta.filter((p) => p.bpjsVerified).length,
    kunjungan,
    pesertaAktif,
    angkaKontak,
    rujukan,
    rasioRujukan,
    prolanis,
    prolanisControlled: prolanis.filter((e) => e.controlledThisMonth).length
  };
}
