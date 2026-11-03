// Tema warna RekamMedis.
//
// Tema HANYA mengganti warna (palet `clinical` yang dipakai seluruh aplikasi),
// tidak mengubah tata letak, huruf, atau perilaku. Palet diterapkan lewat
// variabel CSS di src/index.css: [data-theme="<id>"] pada elemen <html>,
// diatur dari profil klinik (Pengaturan → Tema Warna) dan disimpan per klinik.

export interface AppTheme {
  id: string;
  name: string;
  description: string;
  /** Tiga warna contoh untuk pratinjau: [terang, utama, gelap] */
  swatches: [string, string, string];
}

export const APP_THEMES: AppTheme[] = [
  {
    id: 'tongfang',
    name: 'Tong Fang',
    description: 'Hijau segar & navy — identitas landing page RekamMedis.',
    swatches: ['#84E488', '#409DA1', '#17155E']
  },
  {
    id: 'samudra',
    name: 'Samudra',
    description: 'Biru klinis klasik — tampilan bawaan aplikasi selama ini.',
    swatches: ['#7dd3fc', '#0284c7', '#0b1d33']
  },
  {
    id: 'zamrud',
    name: 'Zamrud',
    description: 'Hijau zamrud tenang untuk kesan alami dan bersih.',
    swatches: ['#6ee7b7', '#059669', '#022c22']
  },
  {
    id: 'terakota',
    name: 'Terakota',
    description: 'Oranye hangat — ramah untuk klinik keluarga & anak.',
    swatches: ['#fdba74', '#ea580c', '#431407']
  },
  {
    id: 'lavender',
    name: 'Lavender',
    description: 'Ungu lembut untuk klinik kecantikan & praktik spesialis.',
    swatches: ['#c4b5fd', '#7c3aed', '#2e1065']
  }
];

export const DEFAULT_THEME_ID = 'tongfang';

export function themeById(id: string | undefined): AppTheme {
  return APP_THEMES.find((t) => t.id === id) ?? APP_THEMES.find((t) => t.id === DEFAULT_THEME_ID)!;
}
