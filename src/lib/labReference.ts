// Mesin rujukan laboratorium: parser rentang, penilaian abnormal, ambang
// kritis (panic values), dan definisi panel tunggal untuk seluruh aplikasi.
//
// Masalah yang ditutup (audit klinis 2026-11-12):
// 1. Penilai lama hanya paham rentang "a - b"; rentang "< 35" / "> 40" jatuh
//    ke perbandingan string sehingga panel Fungsi Hati & Profil Lipid SELALU
//    ditandai abnormal — alarm fatigue yang berbahaya.
// 2. Rentang hematologi laki-laki dewasa dipakai untuk semua pasien; kini
//    Hb/Hematokrit mengikuti jenis kelamin pasien.
// 3. Tidak ada nilai kritis sama sekali; kini ada ambang kritis per parameter
//    yang memicu notifikasi wajib ke dokter pengirim saat validasi.

/** Parser angka sadar format Indonesia: "4.000" = ribuan, "13.0" = desimal. */
export function parseLabNumber(raw: string): number {
  const t = String(raw || '').trim().replace(',', '.');
  if (/^\d{1,3}\.\d{3}$/.test(t)) return parseFloat(t.replace('.', ''));
  return parseFloat(t);
}

export interface RefRange {
  low?: number;
  high?: number;
}

/** Parse rentang rujukan: "13.0 - 17.5" | "< 35" | "> 40" | non-numerik -> null */
export function parseReferenceRange(range: string): RefRange | null {
  const r = String(range || '').trim();
  if (!r) return null;
  if (r.startsWith('<')) {
    const high = parseLabNumber(r.slice(1));
    return Number.isNaN(high) ? null : { high };
  }
  if (r.startsWith('>')) {
    const low = parseLabNumber(r.slice(1));
    return Number.isNaN(low) ? null : { low };
  }
  const parts = r.split('-').map((p) => p.trim());
  if (parts.length === 2) {
    const low = parseLabNumber(parts[0]);
    const high = parseLabNumber(parts[1]);
    if (!Number.isNaN(low) && !Number.isNaN(high)) return { low, high };
  }
  return null;
}

/**
 * Nilai hasil terhadap rentang rujuknya.
 * Mengembalikan true bila abnormal. Rentang non-numerik (mis. "Negatif"):
 * hasil berbeda dari teks rujukan dianggap abnormal (perilaku lama).
 */
export function isAbnormalResult(value: string, referenceRange: string): boolean {
  const v = String(value || '').trim();
  if (!v) return false;
  const parsed = parseReferenceRange(referenceRange);
  if (!parsed) {
    return v.toLowerCase() !== String(referenceRange || '').trim().toLowerCase();
  }
  const num = parseLabNumber(v);
  if (Number.isNaN(num)) return false;
  if (parsed.low !== undefined && num < parsed.low) return true;
  if (parsed.high !== undefined && num > parsed.high) return true;
  return false;
}

// Ambang KRITIS (panic values) klinik pratama — hasil menyentuh ambang ini
// wajib segera diketahui dokter pengirim, bukan menunggu dibuka.
const CRITICAL_THRESHOLDS: { match: string; low?: number; high?: number }[] = [
  { match: 'hemoglobin', low: 7 },
  { match: 'hematokrit', low: 20 },
  { match: 'leukosit', low: 1000, high: 30000 },
  { match: 'trombosit', low: 50000 },
  { match: 'glukosa', low: 50, high: 400 },
  { match: 'kreatinin', high: 4 }
];

export interface CriticalHit {
  testName: string;
  value: string;
}

/** Daftar parameter hasil yang menyentuh ambang kritis. */
export function findCriticalResults(
  items: { testName: string; resultValue?: string }[]
): CriticalHit[] {
  const hits: CriticalHit[] = [];
  for (const item of items) {
    if (!item.resultValue) continue;
    const name = item.testName.toLowerCase();
    const rule = CRITICAL_THRESHOLDS.find((t) => name.includes(t.match));
    if (!rule) continue;
    const num = parseLabNumber(item.resultValue);
    if (Number.isNaN(num)) continue;
    if ((rule.low !== undefined && num <= rule.low) || (rule.high !== undefined && num >= rule.high)) {
      hits.push({ testName: item.testName, value: item.resultValue });
    }
  }
  return hits;
}

export interface LabPanelItem {
  testName: string;
  category: string;
  referenceRange: string;
  unit: string;
}

/**
 * Definisi panel lab — SATU sumber untuk LaboratoryView & ExaminationView.
 * Hematologi: Hb & Hematokrit mengikuti jenis kelamin pasien.
 */
export function labPanelItems(category: string, gender?: string): LabPanelItem[] {
  const female = (gender || '').toLowerCase().startsWith('p') || (gender || '').toLowerCase().includes('perempuan') || (gender || '').toLowerCase() === 'female';
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
  // Hematologi (default)
  return [
    { testName: 'Hemoglobin (Hb)', category: 'Hematologi', referenceRange: female ? '12.0 - 15.5' : '13.0 - 17.5', unit: 'g/dL' },
    { testName: 'Leukosit', category: 'Hematologi', referenceRange: '4.000 - 10.000', unit: '/µL' },
    { testName: 'Trombosit', category: 'Hematologi', referenceRange: '150.000 - 450.000', unit: '/µL' },
    { testName: 'Hematokrit', category: 'Hematologi', referenceRange: female ? '36 - 46' : '40 - 52', unit: '%' }
  ];
}
