import React, { useMemo, useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { canAccess } from '../../lib/permissions';

// Tutorial interaktif RekamMedis — drawer langkah-demi-langkah di sisi kanan
// (halaman tetap terlihat di belakangnya). Tampil otomatis untuk admin
// klinik yang baru mendaftar, dan bisa dibuka lagi kapan saja dari menu
// Panduan / tombol bantuan. Status selesai tersimpan per klinik+pengguna.

export function tourStorageKey(clinicId: string, userId: string): string {
  return `rekammedis_tour_v1_${clinicId}_${userId}`;
}

interface TourStep {
  title: string;
  body: string;
  module?: string;
  cta?: string;
}

const STEPS: TourStep[] = [
  {
    title: 'Selamat datang di RekamMedis',
    body: 'Ruang kerja ini dibuat khusus untuk klinik Anda — nama, data, dan pengaturan di dalamnya milik klinik Anda sendiri dan terpisah dari klinik lain. Tutorial singkat ini menunjukkan urutan menyiapkan klinik sampai melayani pasien pertama. Anda bisa membuka lagi tutorial ini kapan saja dari menu Panduan Penggunaan.'
  },
  {
    title: '1. Lengkapi profil & logo klinik',
    body: 'Di Pengaturan → Profil Klinik, lengkapi nomor izin, kode faskes BPJS, NPWP, dan alamat resmi — data ini tampil di kop surat, resep, dan invoice. Di sana juga Anda bisa mengunggah logo klinik sendiri; logo langsung tampil di sidebar menggantikan ikon bawaan.',
    module: 'settings',
    cta: 'Buka Pengaturan Profil'
  },
  {
    title: '2. Atur operasional & tarif',
    body: 'Masih di Pengaturan: tentukan poli yang dibuka dan jam layanan (tab Operasional), lalu biaya administrasi dan PPN yang dipakai kasir (tab Tarif & Kasir). Pengaturan ini benar-benar dipakai sistem — misalnya biaya administrasi di sini akan muncul di setiap invoice yang diterbitkan dari kunjungan.',
    module: 'settings',
    cta: 'Buka Pengaturan'
  },
  {
    title: '3. Tambahkan staf & akun mereka',
    body: 'Setiap petugas memakai akun sendiri agar setiap tindakan tercatat atas namanya. Di Manajemen Pengguna → Tambah Pengguna, buat akun dokter, perawat, farmasi, kasir, dan petugas lab dengan peran masing-masing. Hak akses menu mengikuti peran secara otomatis. Jangan lupa: ganti kata sandi Anda sendiri lewat menu profil di kanan atas.',
    module: 'users',
    cta: 'Buka Manajemen Pengguna'
  },
  {
    title: '4. Daftarkan pasien pertama',
    body: 'Pasien baru didaftarkan dari menu Pendaftaran (atau Data Pasien → Tambah Pasien). Nomor rekam medis dibuat otomatis mengikuti awalan yang Anda atur. Setelah terdaftar, pasien langsung bisa diberi nomor antrean ke poli tujuan.',
    module: 'registration',
    cta: 'Buka Pendaftaran'
  },
  {
    title: '5. Alur pelayanan harian',
    body: 'Urutan kerja setiap hari: Pendaftaran → Antrian (panggil sesuai prioritas: Cito, lalu Lansia, lalu urutan daftar) → Pemeriksaan & SOAP oleh dokter (diagnosa ICD-10, tindakan, resep) → resep diteruskan ke Farmasi, order lab/radiologi bila perlu → Kasir menerbitkan invoice dari kunjungan → selesai. Draft SOAP bisa disimpan dan dilanjutkan, tidak harus sekali duduk.',
    module: 'queue',
    cta: 'Lihat Antrian'
  },
  {
    title: '6. Tema warna & laporan',
    body: 'Di Pengaturan → Tema Warna, ganti warna aplikasi sesuai identitas klinik Anda (hanya warna yang berubah). Setiap akhir periode, menu Laporan menampilkan kunjungan, pendapatan, dan penyakit terbanyak — semuanya dihitung dari data nyata klinik Anda dan bisa diekspor ke CSV.',
    module: 'reports',
    cta: 'Lihat Laporan'
  },
  {
    title: 'Selesai — klinik siap berjalan',
    body: 'Itu semua dasarnya. Penjelasan tertulis lengkap (termasuk panduan per peran dan pertanyaan yang sering muncul) ada di menu Panduan Penggunaan. Selamat melayani pasien!'
  }
];

export const TourOverlay: React.FC<{
  onNavigate: (module: string) => void;
  onClose: () => void;
}> = ({ onNavigate, onClose }) => {
  const { currentUser, clinicId } = useStore();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const finish = () => {
    try {
      localStorage.setItem(tourStorageKey(clinicId, currentUser.id), 'done');
    } catch {
      // abaikan
    }
    onClose();
  };

  const ctaAllowed = useMemo(
    () => (current.module ? canAccess(currentUser.role, current.module) : false),
    [current.module, currentUser.role]
  );

  return (
    <div className="fixed inset-y-0 right-0 z-[70] w-full sm:w-[400px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300" role="dialog" aria-label="Tutorial RekamMedis">
      <div className="px-5 py-4 text-white flex items-start justify-between" style={{ background: 'linear-gradient(135deg, #17155E, #2F698B)' }}>
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#84E488]">
            <Sparkles className="w-3.5 h-3.5" /> Tutorial Pengguna Baru
          </p>
          <p className="text-sm font-extrabold mt-1">Langkah {step + 1} dari {STEPS.length}</p>
        </div>
        <button onClick={finish} className="p-1.5 rounded-lg hover:bg-white/15" aria-label="Tutup tutorial">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="h-1.5 bg-slate-100">
        <div className="h-full bg-[#54B79A] transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <h3 className="text-base font-extrabold text-slate-900 leading-snug">{current.title}</h3>
        <p className="text-[13px] text-slate-600 leading-relaxed mt-2.5">{current.body}</p>
        {current.module && ctaAllowed && (
          <button
            onClick={() => onNavigate(current.module!)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-[#17155E]"
            style={{ background: 'linear-gradient(90deg, #84E488, #6BCE90)' }}
          >
            {current.cta || 'Buka Menu'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
        {current.module && !ctaAllowed && (
          <p className="mt-4 text-[11px] text-slate-400">Menu ini khusus peran lain — lewati langkah ini bila tidak relevan untuk akun Anda.</p>
        )}
      </div>

      <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-between gap-2">
        <button onClick={finish} className="text-xs font-bold text-slate-400 hover:text-slate-600">
          Lewati Tutorial
        </button>
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600">
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali
            </button>
          )}
          {isLast ? (
            <button onClick={finish} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-clinical-700 text-white text-xs font-extrabold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
            </button>
          ) : (
            <button onClick={() => setStep((s) => s + 1)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-clinical-700 text-white text-xs font-extrabold">
              Lanjut <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
