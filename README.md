# Klinik Tong Fang Ashiap — Sistem Rekam Medis Elektronik (EMR) Enterprise

Aplikasi Rekam Medis Elektronik (Electronic Medical Record / EMR) modern dan profesional dengan standar **Modern Clinical Enterprise Software**, dirancang untuk klinik, dokter, perawat, apoteker, analis laboratorium, kasir, dan manajemen fasilitas kesehatan.

---

## 🏥 Fitur Utama

1. **Dashboard Pelayanan Klinis**:
   - Statistik real-time (kunjungan, pasien baru, antrean, pendapatan hari ini).
   - Antrean poliklinik langsung & timeline jadwal praktik dokter.
   - Grafik kunjungan dan feed audit trail aktivitas klinis.

2. **Manajemen Pasien & Rekam Medis (EMR)**:
   - Direktori pasien lengkap dengan pencarian No. RM, NIK 16 digit, dan nama.
   - Peringatan visual untuk **Alergi Obat** dan **Penyakit Kronis**.
   - Halaman detail pasien dengan 9 tab (Overview, SOAP Timeline, Riwayat Kunjungan, Diagnosis ICD-10, Riwayat Resep, Laboratorium, Radiologi, Dokumen, dan Billing).

3. **Pemeriksaan Medis & Format SOAP**:
   - **S (Subjective)**: Keluhan utama, RPS, RPD, riwayat pengobatan.
   - **O (Objective)**: Tanda vital lengkap, kalkulator BMI otomatis, pemeriksaan fisik per sistem organ.
   - **A (Assessment)**: Diagnosa primer & sekunder dengan pencarian kode ICD-10.
   - **P (Plan)**: Rencana terapi, tindakan medis, e-prescribing dengan validasi alergi otomatis.

4. **Antrian Poliklinik Real-time**:
   - Tampilan monitor ruang tunggu (TV Display) panggilan pasien.
   - Dilengkapi **Audio Bel Chime** sintetis & suara panggilan Text-to-Speech bahasa Indonesia.

5. **Instalasi Farmasi & E-Prescribing**:
   - Resep digital langsung terhubung dari ruang poli ke instalasi farmasi.
   - Monitoring stok obat, alert obat menipis (*low stock*), dan peringatan obat mendekati kadaluarsa.
   - Penyesuaian stok (*Stock In / Stock Out*) & cetak resep dokter resmi.

6. **Laboratorium & Radiologi**:
   - Order panel pemeriksaan laboratorium (Hematologi, Kimia Klinik, Profil Lipid) dengan penanda hasil abnormal.
   - Order pencitraan radiologi (Rontgen Thorax, USG, Panoramic) dengan viewer citra & lembar ekspertise dokter spesialis.

7. **Kasir, Billing & Surat Medis**:
   - Perhitungan otomatis jasa konsultasi, tindakan medis, resep obat, dan lab.
   - Berbagai metode pembayaran (Tunai, QRIS, Transfer, EDC, Klaim BPJS).
   - Generator surat keterangan sakit, surat keterangan berbadan sehat, dan surat rujukan.

8. **Keamanan & Role-Based Access Control (RBAC)**:
   - Hak akses khusus untuk 6 peran: Dokter, Perawat, Apoteker, Kasir, Laboran, Admin.
   - Audit trail forensik keamanan pencatatan data medis (Siapa, Melakukan Apa, Kapan, IP Address).
   - Backup data lokal ke format JSON.

---

## 🛠️ Teknologi

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Audio & Speech**: Web Audio API (Chime) & Web Speech Synthesis

---

## 🚀 Cara Menjalankan

1. **Clone repository**:
   ```bash
   git clone https://github.com/mbekgoreng/rekammedis.git
   cd rekammedis
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan development server**:
   ```bash
   npm run dev
   ```
   Buka browser di `http://localhost:5200` atau port yang ditampilkan di terminal.

4. **Build untuk produksi**:
   ```bash
   npm run build
   ```
