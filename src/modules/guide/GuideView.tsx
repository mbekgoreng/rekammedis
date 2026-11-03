import React from 'react';
import {
  PlayCircle, ClipboardList, Clock, Stethoscope, Pill, CreditCard,
  Settings, Users, ShieldCheck, BarChart3, FlaskConical, HelpCircle
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useStore } from '../../context/StoreContext';

// Panduan Penggunaan — penjelasan tertulis lengkap: alur harian, tugas per
// peran, penyiapan awal klinik, dan FAQ. Tutorial interaktif bisa dijalankan
// dari tombol di atas halaman ini.

const FLOW = [
  { icon: ClipboardList, title: '1. Pendaftaran', desc: 'Pasien baru dibuatkan rekam medis (nomor otomatis), pasien lama dicari dari NIK/nama. Pilih poli tujuan dan jenis kunjungan — pasien langsung masuk antrean.' },
  { icon: Clock, title: '2. Antrian', desc: 'Daftar tunggu terurut prioritas: Cito/Darurat lebih dulu, lalu Lansia & Disabilitas, lalu urutan waktu daftar. Panggil pasien dari sini atau dari tombol panggil cepat di header.' },
  { icon: Stethoscope, title: '3. Pemeriksaan & SOAP', desc: 'Dokter mengisi keluhan, tanda vital, pemeriksaan fisik, diagnosa ICD-10, tindakan, dan rencana terapi. Simpan sebagai Draft bila belum selesai — draft pasien yang sama bisa dilanjutkan, dan mengganti pasien selalu mengosongkan formulir.' },
  { icon: Pill, title: '4. Resep & Farmasi', desc: 'Resep dari SOAP terbit otomatis dan muncul sebagai antrean kerja di Farmasi. Apoteker memproses lalu menyerahkan obat — stok berkurang tepat saat penyerahan dan tercatat di audit.' },
  { icon: FlaskConical, title: '5. Lab & Radiologi', desc: 'Order penunjang dibuat dari pemeriksaan. Hasil lab hanya bisa divalidasi bila semua parameter terisi; status abnormal dinilai dari rentang rujukan tiap parameter. Ekspertise radiologi wajib ditulis radiolog — sistem tidak mengisi kesimpulan sendiri.' },
  { icon: CreditCard, title: '6. Kasir & Selesai', desc: 'Kasir menerbitkan invoice dari kunjungan final (tindakan + obat + biaya administrasi + PPN sesuai Pengaturan). Satu kunjungan hanya bisa ditagih satu kali. Pembayaran parsial didukung.' }
];

const ROLES = [
  { role: 'Administrator', tasks: 'Mengatur profil & logo klinik, operasional, tarif, tema; membuat akun staf; melihat laporan, audit trail, dan backup data.' },
  { role: 'Dokter', tasks: 'Memeriksa pasien (SOAP), membuat resep dan order penunjang, menerbitkan surat medis, memvalidasi hasil bersama petugas lab.' },
  { role: 'Perawat / Pendaftaran', tasks: 'Mendaftarkan pasien, mengelola antrean dan pemanggilan, membantu pengisian awal pemeriksaan.' },
  { role: 'Farmasi', tasks: 'Memproses antrean resep, menyerahkan obat (stok berkurang otomatis), mengelola data & stok obat.' },
  { role: 'Laboratorium / Radiologi', tasks: 'Mengisi hasil pemeriksaan penunjang dan memvalidasi hasilnya.' },
  { role: 'Kasir', tasks: 'Menerbitkan invoice dari kunjungan, menerima pembayaran, memantau piutang yang belum lunas.' }
];

const FAQ = [
  { q: 'Bagaimana cara mengganti logo dan nama klinik?', a: 'Masuk sebagai admin → Pengaturan → Profil Klinik. Di sana ada tombol Unggah Logo (maks 400 KB) dan kolom nama klinik. Logo langsung tampil di sidebar; nama tampil di sidebar, kop surat, dan laporan.' },
  { q: 'Bagaimana menambah akun untuk staf baru?', a: 'Admin → Manajemen Pengguna → Tambah Pengguna. Isi nama, email, peran, dan kata sandi awal, lalu sampaikan ke staf yang bersangkutan dan minta ia menggantinya lewat menu profil (Ganti Kata Sandi) setelah pertama masuk.' },
  { q: 'Staf lupa kata sandi, bagaimana?', a: 'Admin dapat mereset kata sandi staf dari Manajemen Pengguna (kolom Kredensial → Reset Sandi). Kata sandi admin sendiri hanya bisa diganti setelah masuk — jaga baik-baik akun admin.' },
  { q: 'Apakah data klinik saya tercampur dengan klinik lain?', a: 'Tidak. Setiap klinik yang mendaftar memiliki ruang data sendiri yang terpisah; akun Anda hanya bisa membuka data klinik Anda.' },
  { q: 'Bagaimana membackup data?', a: 'Admin → Pengaturan → Backup Data → Unduh File Backup. Simpan berkas di tempat aman (berisi data medis, tidak terenkripsi). Pemulihan dilakukan dari tombol Pulihkan di halaman yang sama.' },
  { q: 'Bisakah mengganti warna aplikasi?', a: 'Bisa — Pengaturan → Tema Warna. Ada 5 tema; yang berubah hanya warna, bukan tata letak atau fitur. Tema bawaan mengikuti warna landing page RekamMedis.' },
  { q: 'Apakah aplikasi ini sudah terhubung SATUSEHAT?', a: 'Belum. Konfigurasi SATUSEHAT dapat disimpan di Pengaturan → Integrasi, tetapi pertukaran data sungguhan memerlukan backend dan masih berstatus belum terhubung — aplikasi saat ini adalah prototipe yang berjalan di perangkat Anda.' }
];

export const GuideView: React.FC<{ onStartTour: () => void }> = ({ onStartTour }) => {
  const { clinicProfile } = useStore();
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Panduan Penggunaan RekamMedis</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cara kerja {clinicProfile.clinicName} di sistem ini — dari penyiapan awal sampai alur pelayanan harian.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onStartTour} leftIcon={<PlayCircle className="w-4 h-4" />}>
          Jalankan Tutorial Interaktif
        </Button>
      </div>

      <Card title="Alur Pelayanan Harian" subtitle="Enam langkah yang dilalui setiap kunjungan pasien">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FLOW.map((f) => (
            <div key={f.title} className="flex gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <span className="w-9 h-9 rounded-lg bg-clinical-600 text-white flex items-center justify-center shrink-0">
                <f.icon className="w-4.5 h-4.5" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-slate-800">{f.title}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Penyiapan Awal Klinik (khusus admin)" subtitle="Lakukan sekali saat pertama memakai sistem">
        <ol className="space-y-2.5 text-xs text-slate-600 leading-relaxed list-none">
          {[
            'Lengkapi Profil Klinik: izin, kode faskes, alamat, dan unggah logo klinik (Pengaturan → Profil Klinik).',
            'Atur poli yang dibuka, jam layanan, biaya administrasi, dan PPN (Pengaturan → Operasional & Tarif).',
            'Buat akun untuk semua staf dengan peran yang benar (Manajemen Pengguna → Tambah Pengguna).',
            'Pilih tema warna klinik (Pengaturan → Tema Warna) dan unduh backup pertama setelah data awal terisi.'
          ].map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-clinical-100 text-clinical-800 font-extrabold flex items-center justify-center shrink-0 text-[11px]">{i + 1}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500"><Settings className="w-3.5 h-3.5" /> Pengaturan menampung semua konfigurasi</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500"><Users className="w-3.5 h-3.5" /> Satu akun per petugas</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500"><ShieldCheck className="w-3.5 h-3.5" /> Semua tindakan tercatat di Audit Trail</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500"><BarChart3 className="w-3.5 h-3.5" /> Laporan selalu dari data nyata</span>
        </div>
      </Card>

      <Card title="Panduan per Peran" subtitle="Setiap peran melihat menu sesuai hak aksesnya">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <div key={r.role} className="border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-extrabold text-slate-800">{r.role}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{r.tasks}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Sering Ditanyakan" subtitle="Jawaban cepat untuk hal yang paling sering dicari pengguna baru">
        <div className="space-y-3">
          {FAQ.map((f) => (
            <div key={f.q} className="flex gap-3">
              <HelpCircle className="w-4 h-4 text-clinical-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800">{f.q}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
