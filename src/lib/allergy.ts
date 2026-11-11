// Skrining alergi berbasis GOLONGAN obat.
//
// Dulu pencocokan alergi hanya substring nama dua arah: alergi "Penicillin"
// TIDAK menangkap obat "Amoxicillin 500 mg" — padahal reaktivitas silang
// beta-laktam adalah skenario anafilaksis paling klasik di klinik pratama.
// Modul ini memetakan nama obat & istilah alergi ke golongan farmakologi,
// lalu mencocokkan golongan-ke-golongan (termasuk pasangan reaktivitas
// silang yang lazim diskrining: penisilin <-> sefalosporin).

const norm = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

interface DrugGroup {
  name: string;
  // Istilah yang bila muncul pada TEKS ALERGI pasien berarti alergi golongan ini
  allergyTerms: string[];
  // Istilah yang bila muncul pada NAMA OBAT berarti obat termasuk golongan ini
  drugTerms: string[];
  // Golongan lain yang ikut tertandai bila pasien alergi golongan ini
  crossWith?: string[];
}

const GROUPS: DrugGroup[] = [
  {
    name: 'Penisilin',
    allergyTerms: ['penisilin', 'penicillin', 'beta laktam', 'betalaktam', 'amoxicillin', 'amoksisilin', 'ampicillin', 'ampisilin'],
    drugTerms: ['amoxicillin', 'amoksisilin', 'ampicillin', 'ampisilin', 'penicillin', 'penisilin', 'amoxiclav'],
    crossWith: ['Sefalosporin']
  },
  {
    name: 'Sefalosporin',
    allergyTerms: ['sefalosporin', 'cephalosporin', 'cefalexin', 'cefixime', 'sefiksim', 'ceftriaxone'],
    drugTerms: ['cefalexin', 'sefaleksin', 'cefixime', 'sefiksim', 'ceftriaxone', 'seftriakson', 'cefadroxil', 'sefadroksil', 'cefuroxime', 'cefotaxime', 'sefotaksim']
  },
  {
    name: 'Sulfonamida',
    allergyTerms: ['sulfa', 'sulfonamida', 'sulfonamide', 'kotrimoksazol', 'cotrimoxazole'],
    drugTerms: ['cotrimoxazole', 'kotrimoksazol', 'sulfamethoxazole', 'sulfametoksazol', 'sulfasalazine']
  },
  {
    name: 'AINS (NSAID)',
    allergyTerms: ['ains', 'nsaid', 'ibuprofen', 'aspirin', 'asetosal', 'diklofenak', 'diclofenac', 'asam mefenamat'],
    drugTerms: ['ibuprofen', 'aspirin', 'asetosal', 'diclofenac', 'diklofenak', 'mefenamat', 'mefenamic', 'ketorolac', 'ketorolak', 'meloxicam', 'meloksikam', 'celecoxib', 'naproxen', 'piroxicam', 'piroksikam', 'dexketoprofen']
  },
  {
    name: 'Makrolida',
    allergyTerms: ['makrolida', 'macrolide', 'eritromisin', 'erythromycin', 'azitromisin', 'azithromycin'],
    drugTerms: ['erythromycin', 'eritromisin', 'azithromycin', 'azitromisin', 'clarithromycin', 'klaritromisin']
  },
  {
    name: 'Kuinolon',
    allergyTerms: ['kuinolon', 'quinolone', 'siprofloksasin', 'ciprofloxacin', 'levofloksasin', 'levofloxacin'],
    drugTerms: ['ciprofloxacin', 'siprofloksasin', 'levofloxacin', 'levofloksasin', 'ofloxacin', 'ofloksasin', 'moxifloxacin']
  },
  {
    name: 'Tetrasiklin',
    allergyTerms: ['tetrasiklin', 'tetracycline', 'doksisiklin', 'doxycycline'],
    drugTerms: ['doxycycline', 'doksisiklin', 'tetracycline', 'tetrasiklin']
  },
  {
    name: 'Aminoglikosida',
    allergyTerms: ['aminoglikosida', 'aminoglycoside', 'gentamisin', 'gentamicin', 'amikasin', 'amikacin'],
    drugTerms: ['gentamicin', 'gentamisin', 'amikacin', 'amikasin', 'streptomycin', 'streptomisin']
  },
  {
    name: 'Parasetamol',
    allergyTerms: ['parasetamol', 'paracetamol', 'acetaminophen', 'asetaminofen'],
    drugTerms: ['paracetamol', 'parasetamol', 'acetaminophen', 'asetaminofen']
  },
  {
    name: 'Metronidazol',
    allergyTerms: ['metronidazol', 'metronidazole'],
    drugTerms: ['metronidazole', 'metronidazol']
  }
];

const containsAny = (text: string, terms: string[]): boolean =>
  terms.some((t) => text.includes(norm(t)));

/** Golongan obat dari sebuah nama obat. */
export function drugGroupsOf(medicineName: string): string[] {
  const m = norm(medicineName);
  return GROUPS.filter((g) => containsAny(m, g.drugTerms)).map((g) => g.name);
}

/** Golongan yang ditandai oleh satu teks alergi (termasuk reaktivitas silang). */
function allergyGroupsOf(allergy: string): string[] {
  const a = norm(allergy);
  const direct = GROUPS.filter((g) => containsAny(a, g.allergyTerms) || containsAny(a, g.drugTerms));
  const names = new Set<string>(direct.map((g) => g.name));
  direct.forEach((g) => (g.crossWith || []).forEach((c) => names.add(c)));
  return [...names];
}

/**
 * Kembalikan teks alergi pasien yang bertentangan dengan obat ini, atau null.
 * Mempertahankan perilaku lama (substring dua arah) sebagai lapis pertama,
 * lalu menambahkan pencocokan golongan.
 */
export function findAllergyConflict(medicineName: string, allergies: string[]): string | null {
  if (!medicineName || allergies.length === 0) return null;
  const med = norm(medicineName);
  for (const allergy of allergies) {
    const a = norm(allergy);
    if (!a) continue;
    if (med.includes(a) || a.includes(med)) return allergy;
    const medGroups = drugGroupsOf(medicineName);
    if (medGroups.length === 0) continue;
    const allergyGroups = allergyGroupsOf(allergy);
    if (medGroups.some((g) => allergyGroups.includes(g))) return allergy;
  }
  return null;
}
