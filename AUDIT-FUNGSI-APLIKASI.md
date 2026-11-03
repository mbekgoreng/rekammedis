# Audit Fungsi Total — Aplikasi Rekam Medis (Klinik Tong Fang Ashiap)

**Tanggal audit:** 3 November 2026 · **Metode:** audit statis read-only atas seluruh kode (store, data seed, 17 modul UI, layout, komponen umum) + pemeriksaan silang antar-modul. Tidak ada kode yang diubah.
**Cakupan:** semua modul kecuali auth/login (sedang dikerjakan terpisah; hanya disinggung bila berdampak ke modul lain).
**Catatan versi:** selama audit, working tree sedang aktif diubah untuk integrasi auth (file `src/lib/auth.ts`, `ChangePasswordView.tsx`, dan perubahan `StoreContext.tsx`/`Header.tsx`/`UserManagementView.tsx` belum ter-commit di atas HEAD `4a35d1c`). Temuan mengikuti **working tree di disk**; pada pemeriksaan akhir `tsc -b` bersih. Pada HEAD lama, keamanan peran lebih buruk (ada `switchRole` — pengguna bisa menjadi admin sekali klik); di working tree fitur itu sudah dihapus, tetapi penegakan RBAC tetap tidak ada (lihat temuan Users/Sidebar).

**Skala keparahan:** **Kritis** = merusak data klinis/keuangan, menyesatkan keputusan, atau alur inti mati. **Serius** = fungsi penting salah/tidak lengkap dan berdampak operasional. **Ringan** = cacat terbatas, kosmetik fungsional, atau kode mati.

---

## Ringkasan Eksekutif

Kerangka aplikasinya nyata: state terpusat di `StoreContext`, hampir semua aksi klinis benar-benar mengubah state dan terpersis ke localStorage, dan alur Registrasi → Antrean → Pemeriksaan → Resep benar-benar tersambung. Namun ada pola kerusakan yang berulang di banyak modul:

1. **Angka pajangan yang tidak berasal dari data** — grafik tren dashboard dan hampir seluruh halaman Laporan adalah literal hardcoded.
2. **Alur yang berhenti di tengah** — invoice tidak bisa dibuat dari UI mana pun; dispensing tidak mengurangi stok; resep tidak pernah mencapai status "Selesai"; Pharmacy tidak membaca resep sama sekali.
3. **Sistem diam-diam mengarang data klinis** — SOAP kosong diganti teks generik, ekspertise radiologi kosong diganti temuan "normal", kontak darurat difabrikasi, hasil lab bisa divalidasi kosong.
4. **Snapshot detail basi** — panel detail di Resep, Lab, dan Kasir memakai salinan objek lokal sehingga transisi status tampak macet.
5. **Penomoran dokumen mundur** — generator nomor berbasis `length + 1` menghasilkan nomor jauh di bawah nomor seed dan pada akhirnya bertabrakan (antrean, lab, radiologi, invoice, surat).
6. **RBAC hanya pajangan** — matriks hak akses dirender sebagai tabel, tetapi tidak ada satu pun pengecekan peran yang membatasi menu/modul.

---

## 1. Lapisan Inti — Store, Data Seed, dan App

### 1.1 `src/context/StoreContext.tsx`

- **[Kritis] `schedules` tidak punya aksi dan tidak terpersis** — `StoreContext.tsx:158` — jadwal hanya di-load sekali; tidak ada `useEffect` sinkronisasi ke localStorage (15 effect persist lain ada) dan tidak ada aksi tambah/ubah/hapus/`bookedCount`. Perbaikan: tambahkan aksi jadwal + effect persist, dan naikkan `bookedCount` dari `addQueue`.
- **[Kritis] `saveMedicalRecord` menutup SEMUA antrean pasien** — `StoreContext.tsx:471` — setiap antrean milik `patientId` itu (kunjungan kapan pun, poli apa pun) diubah menjadi `Selesai` setiap kali satu SOAP disimpan, termasuk simpan Draft. Perbaikan: tutup hanya antrean kunjungan aktif terkait (id antrean diteruskan eksplisit).
- **[Serius] Penomoran berbasis `length + 1` di semua dokumen** — `addPatient:354` (No. RM), `addQueue:381`, `createLabOrder:530`, `createRadiologyOrder:570`, `createInvoice:602`, `createCertificate:643` — nomor baru selalu di bawah nomor seed (detail per modul di bawah) dan akan duplikat setelah jumlah data menyusul seed. Perbaikan: simpan counter persisten per jenis dokumen, atau ambil maksimum nomor eksisting + 1.
- **[Serius] `payInvoice` tanpa validasi jumlah** — `StoreContext.tsx:619` — pembayaran negatif/berlebih diterima; `paidAmount` dapat melampaui `total`, status tetap `Paid`. Perbaikan: tolak `amount <= 0` dan `amount > total - paidAmount` (atau catat kembalian secara eksplisit).
- **[Serius] `updateLabResult` selalu memaksa status `Processing`** — `StoreContext.tsx:545` — mengisi satu hasil pada order yang sudah `Validated` membatalkan validasi secara diam-diam. Perbaikan: hanya transisi dari `Requested`; order tervalidasi terkunci.
- **[Serius] Dispensing tidak terhubung ke stok** — `updatePrescriptionStatus:496` hanya mengubah string status; tidak ada pengurangan stok di seluruh alur resep. Perbaikan: pada transisi ke `Selesai`, kurangi stok per item via `updateMedicineStock` dalam satu transaksi logis.
- **[Serius] Audit log: IP fiktif dan jam UTC berlabel WIB** — `StoreContext.tsx:218-232` (dan `logAuditAs:276-286`) — `ipAddress` dibuat acak, timestamp dari `toISOString()` (UTC) tetapi ditampilkan sebagai WIB. Perbaikan: gunakan waktu lokal perangkat dan hapus klaim IP (atau tandai sebagai tidak tersedia).
- **[Ringan] Nomor surat: bulan & tahun hardcoded** — `StoreContext.tsx:643-650` — format selalu `.../2026/02/...` di bulan apa pun. Perbaikan: ambil dari tanggal terbit.
- **[Ringan] `dueDate` invoice = tanggal terbit** — `StoreContext.tsx:602` — jatuh tempo tidak bermakna. Perbaikan: terima parameter jatuh tempo.

### 1.2 `src/data/mockData.ts` (data seed)

- **[Serius] Resep seed tidak cocok dengan master obat** — `mockData.ts:574-603` vs `225-237` — item resep `medicineId: med-3` bernama "Amlodipine **10 mg**" harga Rp3.500, padahal master `med-3` adalah "Amlodipine **5 mg**" Rp2.500. Total resep Rp105.000 tidak dapat direkonsiliasi ke master. Perbaikan: samakan nama/kekuatan/harga item seed dengan master.
- **[Serius] Nomor seed melompati generator** — antrean seed `A-023..A-025, B-011, B-012`, lab `LAB-2026-0041`, radiologi `RAD-2026-0019`, invoice `INV-2026-0120`, surat `SKD/2026/02/089` — semua generator memulai dari hitungan array (lihat 1.1). Dampak gabungan: dokumen baru bernomor lebih kecil dari dokumen lama.
- **[Ringan] Kesalahan data obat `med-8`** — `mockData.ts:324-338` — "Salbutamol **Inhaler**" berkategori `Gastrointestinal`, bentuk `Sirup`, satuan `Botol`. Perbaikan: kategori Respiratori, bentuk Inhaler.
- **[Ringan] Data seed tidak profesional** — dokter `u-3` bernama "Prabowo Jokowow, S teh dua gelas", spesialisasi "Konsultan Umum & Minuman Sehat" (`mockData.ts:33-40, 463-475`). Nama karangan seperti ini tidak layak tampil di sistem yang mengklaim standar enterprise/akreditasi.
- **[Ringan] `bookedCount` jadwal statis** — 18/25, 14/20, 22/35 (`mockData.ts:449,461,473`) tidak pernah berubah oleh aktivitas apa pun (lihat 1.1).
- Catatan positif: invoice seed konsisten secara aritmetika (150rb+120rb+105rb+25rb = subtotal = total = Rp400.000, `paidAmount` penuh); usia pasien seed konsisten dengan tanggal lahirnya; total resep seed konsisten internal (30 × Rp3.500).

### 1.3 `src/App.tsx`

- **[Kritis] Tidak ada gerbang peran di perutean modul** — `App.tsx:65-160` — modul dirender murni dari `currentModule`; peran pengguna tidak pernah dicek. Dikombinasikan dengan Sidebar yang menampilkan semua menu, setiap peran dapat membuka semua modul termasuk Audit Trail dan Pengaturan. Perbaikan: peta modul→peran yang diizinkan, ditegakkan di App dan Sidebar.
- **[Ringan] Dua nama modul, satu layar** — `'medical_records'` dan `'examination'` dirender ke `ExaminationView` yang sama (`App.tsx:113`).

---

## 2. Dashboard — `src/modules/dashboard/DashboardView.tsx`

**Status: sebagian** (navigasi dan aksi antrean berfungsi; statistik menyesatkan)

- **[Kritis] Grafik "Tren Kunjungan 7 Hari Terakhir" hardcoded** — `DashboardView.tsx:340-358` — array literal (Kamis 28 … "Hari Ini" 31) + label `+12.4% vs Minggu Lalu` (:344), tidak dihitung dari data apa pun. Perbaikan: hitung dari `queues`/`medicalRecords` per tanggal, atau hapus grafik sampai data tanggal tersedia.
- **[Kritis] "Total Pasien Hari Ini" = seluruh antrean sepanjang masa** — `DashboardView.tsx:40` — `queues.length`; `QueueItem` tidak memiliki field tanggal (`types/index.ts:152`), sehingga antrean lama di localStorage dihitung sebagai hari ini selamanya. Perbaikan: tambahkan field tanggal pada antrean dan filter berdasarkan tanggal berjalan.
- **[Kritis] "Pendapatan Hari Ini" permanen Rp400.000** — `DashboardView.tsx:46-47` — menjumlahkan semua invoice `Paid` tanpa filter tanggal; satu-satunya invoice adalah seed 15 Feb 2026. Perbaikan: filter `inv.date === hari ini`.
- **[Serius] "Pasien Baru bulan ini" salah rumus** — `DashboardView.tsx:44` — filter `registeredAt >= '2026-01-01'` (sejak awal 2026, bukan bulan berjalan; tahun dikunci). Perbaikan: bandingkan tahun-bulan berjalan.
- **[Serius] "Jadwal Dokter Hari Ini" tidak memeriksa hari** — `DashboardView.tsx:88,313` — hanya `isActive`; ketiga jadwal seed berhari Senin tetapi tampil setiap hari, dengan kuota statis. Perbaikan: filter `dayOfWeek` hari ini dan sinkronkan `bookedCount`.
- **[Ringan] Variabel mati** — `inProgressPatients` (:42) dihitung tetapi tidak ditampilkan.
- Berfungsi: tombol Panggil/Periksa/Selesai pada tabel antrean benar-benar memanggil `callQueuePatient`/`updateQueueStatus` + navigasi pemeriksaan.

## 3. Pasien — `src/modules/patients/`

### 3.1 `PatientListView.tsx` — **Status: sebagian**

- **[Serius] Tombol antrean tidak membawa pasien ke Registrasi** — `PatientListView.tsx:290-293` — memanggil `onSelectPatient` + `onNavigate('registration')`, tetapi RegistrationView memakai state lokal yang mulai dari `null`; petugas harus mencari ulang pasien. Perbaikan: RegistrationView menerima pasien terpilih global sebagai nilai awal.
- **[Serius] Badge status selalu hijau** — `PatientListView.tsx:262` — `variant="success"` untuk semua status termasuk Nonaktif. Perbaikan: petakan variant per status.
- **[Ringan] Usia dari field statis** — `:207` menampilkan `patient.age`, bukan hitungan dari `birthDate`.
- Berfungsi: pencarian (nama/RM/NIK/telepon), filter gender & penjamin, sortir dua arah, Tambah/Edit via modal benar-benar memanggil `addPatient`/`updatePatient`.

### 3.2 `PatientDetailView.tsx` — **Status: sebagian**

- **[Serius] Semua tombol buat-baru kehilangan konteks pasien** — `PatientDetailView.tsx:97,106,282,654` — "Daftarkan Kunjungan", "SOAP Baru", "Buka Dokumen", dan EmptyState Resep/Lab/Radiologi/Surat hanya `onNavigate` tanpa ID pasien/objek; modul tujuan mulai dari nol — rawan salah pasien. Perbaikan: teruskan `patientId` (dan `certificateId` untuk dokumen) ke modul tujuan.
- **[Serius] Badge status lima tab selalu hijau** — `:173,337,481,553,600` — status Menunggu/Dibatalkan/Draft/Requested tampil sebagai `success`; hanya tab Billing yang membedakan.
- **[Ringan] Tab Diagnosa tanpa tanggal/dedup** — `:445-475` — `flatMap` semua diagnosa ditampilkan polos dan berulang, `key={i}` berpotensi konflik.
- Positif penting: seluruh tab (kunjungan, SOAP, resep, lab, radiologi, billing, surat) difilter nyata dari store per `patientId` (`:56-62`) — halaman paling konsisten antar-modul di aplikasi ini.

### 3.3 `PatientFormModal.tsx` — **Status: sebagian**

- **[Serius] NIK hanya dicek 16 digit** — `PatientFormModal.tsx:139-143` — tanpa cek duplikasi NIK dan tanpa konsistensi dengan tanggal lahir/jenis kelamin. Perbaikan: tolak NIK yang sudah terdaftar.
- **[Serius] Tanggal lahir tidak divalidasi** — `:100-110,136-146` — tanggal masa depan ditutupi `Math.max(0, age)` → pasien berusia 0 tahun tersimpan tanpa peringatan. Perbaikan: tolak tanggal kosong/masa depan.
- **[Serius] Kontak darurat difabrikasi diam-diam** — `:163-167` — bila kosong, disimpan sebagai "Keluarga" dengan nomor telepon pasien sendiri, lalu tampil sebagai fakta di detail pasien. Perbaikan: simpan kosong apa adanya.
- **[Ringan] Validasi lain hilang** — format email/telepon tidak ditegakkan (submit dari tombol footer di luar semantik form), nomor BPJS tidak wajib untuk penjamin BPJS, default `age: 36` hardcoded (:26-27), field `status` tanpa kontrol UI.

## 4. Registrasi — `src/modules/registration/RegistrationView.tsx`

**Status: sebagian** (inti registrasi nyata; separuh formulir dibuang)

- **[Kritis] Dokter Poli Bedah & Poli Gigi salah** — `RegistrationView.tsx:63-69,91-101` — penetapan dokter hanya if/else Penyakit Dalam & Gizi; dua poli lain diam-diam memakai dokter Poli Umum (`u-3`). Karcis antrean menampilkan dokter yang salah. Perbaikan: petakan dokter per poli dari `schedules`/users, tolak poli tanpa dokter.
- **[Kritis] Jenis kunjungan & keluhan utama dibuang** — `:43,46,102-111,357-400` — `visitType` dan `complaint` punya UI lengkap tetapi tidak diteruskan ke `addQueue`; `QueueItem` memang tidak punya field untuk keduanya, jadi anamnesis awal hilang tanpa jejak. Perbaikan: tambahkan kedua field ke `QueueItem` dan tampilkan di antrean/pemeriksaan.
- **[Serius] Tidak ada cek jadwal/kuota** — `:33,42` — `selectedDoctorId` dan `schedules` dideklarasikan tetapi tidak pernah dipakai; antrean bisa diterbitkan untuk poli tutup/kuota penuh.
- **[Serius] Tidak ada cegah antrean ganda** — `:85-113` — pasien yang sama dapat didaftarkan berkali-kali ke poli yang sama.
- **[Serius] Nomor antrean baru mundur** — antrean Penyakit Dalam baru menjadi `A-004` (seed sudah A-025) akibat generator store (lihat 1.1).
- **[Ringan] Cetak karcis `window.print()` polos** — `:116-118` tanpa area cetak khusus yang ditegakkan.
- Berfungsi: pencarian & pemilihan pasien (termasuk prioritas Lansia otomatis usia ≥ 60), buat pasien baru lalu otomatis terpilih, submit memanggil `addQueue` dan karcis dirender dari objek antrean store.

## 5. Antrean — `src/modules/queue/QueueView.tsx`

**Status: sebagian**

- **[Kritis] Urutan & "Panggil Cepat" mengabaikan prioritas dan waktu** — `QueueView.tsx:48,161,204-221` — daftar tunggu adalah urutan array apa adanya; pasien `Darurat / Cito` dan Lansia tidak didahulukan; badge prioritas hanya label. Perbaikan: sortir berdasarkan prioritas lalu `registeredTime`.
- **[Serius] Tab filter poli tidak lengkap** — `:52` — daftar poli hardcoded hanya 3 + Semua; antrean Poli Bedah & Gigi & Mulut (yang bisa dibuat Registrasi) tidak punya tab. Daftar poli di dua modul tidak bersumber sama.
- **[Serius] Transisi status ilegal** — `:349-371` — "Periksa" tersedia untuk antrean `Menunggu` (belum dipanggil) dan `Dibatalkan` (menghidupkan kembali antrean batal); "Selesai" tersedia tanpa pernah diperiksa.
- **[Serius] "Panggil Ulang" menurunkan status** — `:181` — memanggil `callQueuePatient` pada pasien `Sedang Diperiksa`; aksi store tanpa syarat mengubahnya kembali ke `Dipanggil` (StoreContext.tsx:410).
- **[Ringan] Ringkasan salah hitung** — `:49,241,245` — "Sedang/Dipanggil" hanya menghitung status `Dipanggil` (seed: tampil 1, seharusnya 2); label "Selesai Hari Ini" mewarisi cacat tanpa-tanggal.
- Berfungsi: panggil (chime + speech), mulai periksa, batal, dan monitor TV semuanya aksi store nyata.

## 6. Pemeriksaan (SOAP) — `src/modules/examination/ExaminationView.tsx`

**Status: sebagian** (simpan SOAP & e-resep bekerja; tanpa validasi dan rawan kontaminasi antar-pasien)

- **[Kritis] Draft tidak bisa dilanjutkan; setiap simpan = record baru** — `ExaminationView.tsx:46,197` + `StoreContext.tsx:425` — record tersimpan tidak pernah dimuat kembali ke formulir. Simpan draft lalu final = dua record, dan final kedua menggandakan resep ke farmasi. Perbaikan: muat draft ke formulir dan perbarui record yang sama.
- **[Kritis] Ganti pasien tidak mereset formulir** — `:124-128` — `useEffect` hanya menyinkronkan ID pasien; keluhan, tanda vital, diagnosa, resep pasien sebelumnya tetap terisi. Data pasien A dapat tersimpan atas nama pasien B. Perbaikan: reset/muat state formulir per pasien.
- **[Kritis] Kolom kosong diganti teks karangan saat simpan** — `:197,211-214` — keluhan utama kosong menjadi "Pemeriksaan kesehatan rutin", RPS/RPD/obat diganti kalimat generik. Rekam medis final berisi anamnesis yang tidak pernah disampaikan pasien. Perbaikan: validasi wajib, jangan pernah mengarang isi klinis.
- **[Serius] Formulir dibuka dengan data bawaan pasien lain** — `:92-109` — diagnosa default selalu I10 Hipertensi, pemeriksaan fisik terisi normal, tindakan Rp150.000 terpasang, `nextVisitDate` default `2026-03-15` (lampau).
- **[Serius] Tanda vital tanpa validasi rentang** — `:424-467` — `parseInt || 0` tanpa min/max: SpO2 250%, TD 0/0 lolos tersimpan final. (BMI benar dihitung dari berat/tinggi, `:132-140`.)
- **[Serius] Peringatan alergi tidak memblokir** — `:188-195,775-786` — banner saja; obat pemicu alergi tetap bisa diresepkan dan disimpan final.
- **[Serius] Resep tanpa cek stok, jumlah bisa negatif** — `:161-181,755` — `medQty` tidak dibandingkan dengan `med.stock`; input tanpa `min`. Harga satuan benar diambil dari master (`:177`), tetapi dosis teks bebas dapat menyimpang dari kekuatan master.
- **[Serius] Tidak ada jalur order lab/radiologi & hasil penunjang tidak tampil** — modul tidak menyentuh `createLabOrder`/`createRadiologyOrder`/`labOrders`/`radiologyOrders` sama sekali; alur klinis putus di tengah.
- **[Ringan] Durasi & instruksi resep tanpa input** — `:117,119` — selalu 5 hari dan "Minum teratur setelah makan" untuk semua obat.
- **[Ringan] Daftar tindakan adalah state mati** — `:107-109` — satu tindakan Rp150.000 selalu ikut tersimpan tanpa UI tambah/edit/hapus.
- **[Ringan] Pesan sukses menyesatkan** — `:239,322` — banner "resep diteruskan ke farmasi" muncul juga setelah Simpan Draft (store hanya membuat resep pada final).
- **[Ringan] Cetak mencetak seluruh halaman** — `:863` — `window.print()` tanpa kelas `no-print`/`print-only` (tersedia di `index.css:28-44`).

## 7. Resep — `src/modules/prescription/PrescriptionView.tsx`

**Status: sebagian**

- **[Kritis] Dispensing tidak mengurangi stok** — `PrescriptionView.tsx:277-295` + store (lihat 1.1) — obat dapat "diserahkan" berkali-kali, inventori tidak pernah berkurang.
- **[Kritis] Resep tidak muncul di modul Farmasi** — notifikasi resep baru menaut ke modul `pharmacy` (`StoreContext.tsx:451-478`), tetapi `PharmacyView` tidak membaca `prescriptions` sama sekali. Apoteker membuka Instalasi Farmasi dan tidak melihat antrean resep.
- **[Serius] Status `Selesai`/`Dibatalkan` tidak dapat dicapai** — `:277-295` — UI hanya menyediakan Menunggu Farmasi → Diproses → Siap Diambil; semua resep menggantung selamanya.
- **[Serius] Panel detail snapshot basi** — `:39` — `selectedRx` salinan lokal; setelah klik proses, panel tetap menampilkan status lama sampai baris diklik ulang.
- **[Ringan] Kode mati** — `:27-35` — `createPrescription`, `patients`, `medicines`, `currentUser` diambil tetapi tidak dipakai.
- **[Ringan] Cetak mencetak seluruh halaman** — `:203`.
- Berfungsi: resep dari pemeriksaan benar-benar muncul di sini (daftar, filter status, pratinjau item & total dari `totalCost` store).

## 8. Farmasi — `src/modules/pharmacy/PharmacyView.tsx`

**Status: sebagian** (inventori bekerja; fungsi farmasi klinis absen)

- **[Kritis] Tidak ada fungsi dispensing sama sekali** — `PharmacyView.tsx:22-23` — modul bernama "Instalasi Farmasi" hanya memakai `medicines`, `addMedicine`, `updateMedicineStock`: tidak ada antrean resep, verifikasi, atau penyerahan obat.
- **[Serius] Pengeluaran stok berlebih diam-diam di-clamp** — `:79-85` + `StoreContext.tsx:515` — delta keluar melebihi stok diterima, store memotong ke 0 (`Math.max(0, ...)`) tanpa peringatan, sedangkan audit mencatat jumlah penuh yang tidak pernah keluar. Selisih stok fisik vs catatan tidak terdeteksi.
- **[Serius] Validasi modal terlewati** — `:284,351` — tombol Simpan di footer Modal memanggil handler di luar `<form onSubmit>`; penanda wajib tidak ditegakkan: obat tanpa nama dan penyesuaian bernilai 0 tetap tersimpan.
- **[Ringan] Obat kedaluwarsa dihitung "hampir kedaluwarsa"** — `:60-64` — `diffDays <= 180` mencakup nilai negatif.
- **[Ringan] Kode obat otomatis rawan duplikat** — `:87-93` — berbasis `medicines.length + 1`.
- Berfungsi: metrik stok menipis/kosong dari data nyata; tambah master obat & penyesuaian stok terpersis.

## 9. Laboratorium — `src/modules/laboratory/LaboratoryView.tsx`

**Status: sebagian** (order/input/validasi terpersis; tidak aman secara klinis)

- **[Kritis] Hasil kosong bisa divalidasi resmi** — `LaboratoryView.tsx:275-285` — tombol validasi tampil untuk semua order belum `Validated` tanpa syarat satu pun hasil terisi. Lembar kosong dapat menjadi hasil resmi atas nama analis. Perbaikan: validasi hanya bila semua item terisi.
- **[Kritis] Penentuan abnormal memakai ambang tunggal 60–140 untuk semua parameter** — `:38-47` — `referenceRange` tidak dibaca. Hb, trombosit, gula — semuanya dinilai dengan ambang yang sama; penanda abnormal tidak dapat dipercaya. Perbaikan: nilai per parameter dari rentang rujukan.
- **[Serius] Hasil terisi tidak bisa dikoreksi; order tervalidasi bisa ter-unvalidasi diam-diam** — `:230` + `StoreContext.tsx:545` — input hanya dirender bila hasil kosong; mengisi parameter kosong pada order `Validated` memaksa status kembali ke `Processing` tanpa peringatan.
- **[Serius] Nomor order mundur** — order baru pertama `LAB-2026-0002`, seed sudah `LAB-2026-0041`; akan duplikat setelah ±40 order (lihat 1.1).
- **[Serius] Snapshot detail basi** — `:30` — setelah simpan/validasi, panel tetap menampilkan objek lama sampai baris diklik ulang.
- **[Ringan] Paket pemeriksaan hardcoded** — `:54-118` — isi panel (nama uji, rentang, satuan) konstanta lokal per kategori; tidak ada master pemeriksaan dan tidak ada uji satuan di luar 3 paket.
- **[Ringan] Hasil tidak mengalir ke dokter** — hasil tervalidasi hanya tampil di modul ini dan daftar PatientDetail; ExaminationView tidak membacanya.
- **[Ringan] Cetak mencetak seluruh halaman** — `:189`.

## 10. Radiologi — `src/modules/radiology/RadiologyView.tsx`

**Status: sebagian**

- **[Serius] Ekspertise kosong diisi temuan karangan** — `RadiologyView.tsx:37-47` — simpan dengan form kosong menyimpan "Cor dan pulmo dalam batas normal." / "Tidak tampak kelainan radiologis aktif." sebagai temuan resmi atas nama radiolog. Laporan "normal" dapat terbit tanpa pernah dibaca. Perbaikan: tolak ekspertise kosong.
- **[Serius] Tahap `Dijadwalkan`/`Selesai Scan` tidak dapat dicapai** — `:105-112,215-248` — badge mengenal kedua status itu tetapi tidak ada aksi UI; satu-satunya transisi melompat dari `Permintaan` langsung ke `Hasil Terbaca` — order yang belum di-scan pun bisa "terbaca".
- **[Serius] Nomor order mundur** — order baru pertama `RAD-2026-0002`, seed `RAD-2026-0019` (lihat 1.1).
- **[Ringan] "DICOM Image Viewer" dekorasi** — `:189-195` — kotak placeholder teks; tidak ada citra apa pun, tetapi ekspertise tetap dapat disimpan berdasarkan citra yang tidak pernah ditampilkan.
- **[Ringan] Ekspertise terkunci permanen + snapshot basi** — `:27,197-214` — tidak ada jalur koreksi/addendum setelah terbaca; hasil baru tidak langsung tampil.
- **[Ringan] Order hanya dari modul ini; hasil tidak tampil di pemeriksaan** — `:49-65`.
- **[Ringan] Cetak mencetak seluruh halaman** — `:165`.
- Berfungsi: pembuatan order dan penyimpanan temuan/kesan/radiolog terpersis ke store.

## 11. Jadwal Dokter — `src/modules/schedule/DoctorScheduleView.tsx`

**Status: sebagian** (tampilan saja; filter rusak, CRUD dekorasi)

- **[Serius] Filter hari rusak total** — `DoctorScheduleView.tsx:29-31` — kondisi `s.dayOfWeek === selectedDay || s.isActive`: semua jadwal seed aktif, jadi tab hari apa pun menampilkan jadwal Senin. Perbaikan: filter hanya `dayOfWeek` (status aktif sebagai filter terpisah).
- **[Serius] Modal "Tambah Jadwal" dekorasi** — `:155-182` — semua `Input` tanpa `value`/`onChange`; "Simpan Jadwal" hanya menutup modal. Semua yang diketik hilang.
- **[Ringan] Tombol "Kelola Jadwal" tanpa `onClick`** — `:145-147` — no-op total.
- **[Ringan] `bookedCount` pajangan & cabang `'ALL'` mati** — `:25,29` (lihat juga 1.1).

## 12. Kasir / Billing — `src/modules/billing/BillingView.tsx`

**Status: sebagian** (pembayaran bekerja di atas data yang tidak bisa lahir)

- **[Kritis] Invoice tidak bisa dibuat dari UI mana pun** — `createInvoice` (`StoreContext.tsx:602`) tidak dipanggil satu pun view di seluruh aplikasi (terverifikasi pencarian menyeluruh). Kasir tidak dapat menagih kunjungan/resep baru — tidak manual, tidak otomatis dari kunjungan. Seluruh modul hidup dari satu invoice seed yang sudah lunas. Perbaikan: tombol "Buat Invoice" dari kunjungan/resep selesai, atau terbitkan invoice otomatis saat SOAP final.
- **[Serius] Pembayaran tanpa validasi batas** — `BillingView.tsx:54-59,326-333` + store (lihat 1.1) — nominal negatif/berlebih diterima; `totalPendingRevenue` (:42-44) dapat terdistorsi.
- **[Serius] Panel kuitansi basi setelah membayar** — `:23` — snapshot `selectedInvoice`; panel dan modal menampilkan status/sisa lama sampai baris diklik ulang — risiko kasir menagih dua kali.
- **[Ringan] Kuitansi tanpa pajak & sisa bayar** — `:278-291` — tipe `Invoice` punya `tax` (`types/index.ts:236`) tetapi rincian cetak hanya subtotal/diskon/total; bila pajak > 0 angka tidak klop. `paidAmount`/sisa juga absen.
- **[Ringan] "Total Penerimaan Lunas" menjumlahkan nilai tagihan** — `:38-40` — `i.total` untuk status Paid, bukan `paidAmount` yang benar-benar diterima.
- **[Ringan] Cetak mencetak seluruh halaman** — `:200` — Sidebar & Header tidak disembunyikan saat print (hanya footer App berlabel `no-print`).
- Berfungsi: pencarian invoice, modal bayar terisi otomatis sebesar sisa, pembayaran parsial menghasilkan status `Partial`, metode bayar tersimpan.

## 13. Surat Medis — `src/modules/letters/MedicalLettersView.tsx`

**Status: sebagian** (penerbitan bekerja; isi dokumen cacat)

- **[Serius] Terbilang durasi hardcoded "(Tiga)"** — `MedicalLettersView.tsx:196` — surat 1/2/5 hari tetap tertulis "(Tiga)". Angka dan kata bertentangan dalam dokumen resmi. Perbaikan: fungsi terbilang dari `durationDays`.
- **[Serius] Penomoran surat kacau** — nomor pertama buatan pengguna `001` padahal seed `089`; bulan hardcoded; "Surat Kontrol Ulang" memakai prefix `SRK` yang sama dengan rujukan (lihat 1.1).
- **[Serius] "Surat Kontrol Ulang" terbit tanpa isi** — tipe ditawarkan di form (`:313`) tetapi pratinjau hanya punya blok isi untuk Sakit/Sehat/Rujukan (`:190-234`); surat kontrol tercetak hanya kop + data pasien + penutup.
- **[Serius] Surat dapat ditandatangani peran apa pun dengan SIP karangan** — `:42-43` — `doctorName` = siapa pun yang login; akun tanpa SIP memakai literal `SIP.503/442.1/DOKTER/2024`. Tanpa penegakan RBAC, kasir/perawat dapat menerbitkan surat sakit atas namanya dengan nomor SIP dokter fiktif.
- **[Ringan] Diagnosis tidak dicetak pada Surat Sakit** — `diagnosisText` hanya tampil di blok Rujukan (`:227`).
- Berfungsi: penerbitan memanggil `createCertificate`, pasien dari store, tanggal selesai dihitung dari mulai + durasi, daftar & pratinjau ter-update.

## 14. Laporan — `src/modules/reports/ReportsView.tsx`

**Status: dekorasi**

- **[Kritis] Tabel "10 Besar Penyakit" hardcoded; hitungan asli dibuang** — `ReportsView.tsx:24-33` membangun `topDiagnoses` dari `medicalRecords`, tetapi variabel itu tidak pernah dirender; tabel (`:164-173`) merender array literal (I10 = 42 kasus/28,4%, dst.). Laporan morbiditas menampilkan angka karangan. Perbaikan: render `topDiagnoses` yang sudah dihitung.
- **[Serius] Filter periode mati** — `:20,52-67` — state `period` hanya mengubah highlight tombol; tidak satu pun agregat memakainya.
- **[Serius] KPI difabrikasi** — `:85` total kunjungan = `medicalRecords.length * 14 + 28` + tren "+8.5%" literal; "Item Obat Terdistribusi 842 Satuan" (`:107`) dan "Rata-rata Waktu Tunggu 14.2 Menit" (`:122`) literal statis.
- **[Serius] Komposisi pendapatan hardcoded & bertentangan dengan halaman yang sama** — `:186-192` literal total ±Rp31,1 juta, sementara angka store di halaman yang sama `totalRevenue` = Rp400.000.
- **[Ringan] `totalRevenue` menghitung invoice belum dibayar sebagai pendapatan** — `:36,97` — tanpa filter status, dilabeli "tertagih".
- **[Ringan] Ekspor tidak ada** — ikon `Download`/`Filter`/`Calendar` diimpor (`:5-8`) tetapi tidak dipakai; satu-satunya aksi adalah cetak seluruh halaman.

## 15. Pengguna & RBAC — `src/modules/users/UserManagementView.tsx`

**Status: sebagian** (reset sandi admin bekerja; RBAC pajangan)

- **[Kritis] RBAC hanya matriks tampilan, tanpa penegakan di mana pun** — `permissionMatrix` (`UserManagementView.tsx:33-53`) adalah array literal yang hanya dirender menjadi tabel centang. Sidebar merender semua menu untuk semua peran, App merender modul apa pun tanpa cek peran; satu-satunya cek role di seluruh aplikasi adalah `isAdmin` di file ini (:22) untuk tombol reset. Klaim subtitle "Setiap role hanya memiliki otorisasi pada modul yang relevan" (`:173`) tidak benar secara fungsional. Perbaikan: tegakkan matriks yang sama di Sidebar + App.
- **[Serius] Tambah pengguna tidak ada** — ikon `UserPlus` diimpor (:5) tetapi tidak dipakai; store tidak punya aksi tambah/edit/nonaktifkan pengguna. Daftar beku pada 8 akun seed.
- **[Ringan] Input sandi baru bertipe teks terang** — `:125-126` — `type="text"` untuk kata sandi yang diketik admin (terlihat di layar). Perbaikan: `type="password"`.
- Berfungsi (working tree): Reset Sandi khusus admin benar-benar bekerja — `handleReset` (:24-31) → `resetUserPassword` store (hash tersimpan, tercatat di audit).
- Catatan HEAD: pada commit lama, file ini dan Header memakai `switchRole` (beralih peran bebas termasuk admin tanpa kredensial) — sudah dihapus di working tree.

## 16. Audit Trail — `src/modules/audit/AuditTrailView.tsx`

**Status: sebagian**

- **[Serius] Klaim "Immutable Tamper-Evident Logging" palsu** — `AuditTrailView.tsx:41-44` — log adalah plaintext di localStorage (`StoreContext.tsx:210-212`) tanpa hash-chain/tanda tangan; siapa pun dengan akses browser dapat mengedit/menghapus log lewat DevTools tanpa jejak. (Sisi baik: UI tidak menyediakan tombol hapus/edit.)
- **[Serius] Isi log tidak dapat dipakai forensik** — IP fiktif acak dan jam UTC berlabel WIB (lihat 1.1).
- **[Ringan] Filter modul tidak lengkap** — `:30` — daftar filter tidak memuat `Radiologi`, padahal store mencatat log modul itu (`StoreContext.tsx:585`); log radiologi hanya muncul di "Semua Modul".
- **[Ringan] Tanpa ekspor & paginasi** — ikon `Download` (:7) tidak dipakai; seluruh log dirender dalam satu tabel.
- Berfungsi: pencarian (pengguna/aksi/detail/IP) dan filter modul bekerja; log benar-benar bertambah dari hampir semua aksi store (pasien, antrean, SOAP, resep, farmasi, lab, radiologi, kasir, surat, login/logout/ganti & reset sandi).

## 17. Pengaturan Klinik — `src/modules/settings/ClinicSettingsView.tsx`

**Status: sebagian** (backup bekerja; simpan profil dekorasi)

- **[Serius] "Simpan Perubahan Profil" tidak menyimpan apa pun** — `ClinicSettingsView.tsx:29-33` — `handleSave` hanya menyalakan banner sukses 3 detik; tidak ada aksi settings di store dan tidak ada penulisan localStorage. Perubahan hilang saat pindah modul/reload, dan kop surat di Billing/Letters/Resep tetap memakai nama klinik hardcoded di view masing-masing — banner menyatakan "berhasil disimpan" (`:67-72`) padahal tidak. Perbaikan: simpan profil klinik ke store dan jadikan sumber kop semua dokumen.
- **[Serius] Backup diklaim "terenkripsi", nyatanya JSON plaintext berisi data medis** — subtitle `:139`; `handleExportBackup` (`:36-52`) mengunduh JSON mentah (pasien + rekam medis lengkap) tanpa enkripsi/kata sandi. Klaim keamanan palsu untuk berkas yang sangat sensitif.
- **[Ringan] Backup tidak lengkap & tanpa restore** — `:38-46` hanya mengekspor `facility + patients + medicalRecords + medicines + invoices`; resep, lab, radiologi, surat, antrean, pengguna, dan audit log tidak ikut; tidak ada fungsi impor/restore di seluruh aplikasi.
- Berfungsi: unduhan backup menghasilkan berkas JSON dari data store terkini; hitungan snapshot (`:147`) dinamis.

## 18. Layout & Komponen Umum

### 18.1 `Header.tsx` — **Status: berfungsi penuh** (untuk cakupan header)
Badge notifikasi dinamis; tombol panggil antrean memanggil `callQueuePatient`; Ctrl+K membuka pencarian; menu akun berisi Ganti Kata Sandi (navigasi) dan Logout (aksi store). Satu cacat: **[Ringan]** import `UserRole` mati (`Header.tsx:16`).

### 18.2 `Sidebar.tsx` — **Status: sebagian**
- **[Kritis] Semua menu tampil untuk semua peran** — `Sidebar.tsx:43-89,167-213` — `menuSections` statis tanpa satu pun cek `currentUser.role` (peran hanya label, `:148`). Ini pintu utama kegagalan RBAC (lihat temuan 15).
- **[Ringan] Dua menu, satu layar** — `'examination'` dan `'medical_records'` membuka view yang sama.
- Berfungsi: badge antrean menunggu & stok minimum dihitung dari store; menu aktif, collapse, drawer mobile bekerja.

### 18.3 `GlobalSearchModal.tsx` — **Status: berfungsi sebagian besar**
Pencarian benar-benar atas data store (pasien/obat/dokter/invoice) dan klik pasien membuka detail yang benar. **[Ringan]** klik invoice/obat tidak menunjuk itemnya (Billing membuka invoice default) (`:234-237`); **[Ringan]** label "ESC" ditampilkan tetapi tidak ada handler Escape/backdrop/tombol tutup (`:89-100`).

### 18.4 `NotificationsDropdown.tsx` — **Status: berfungsi penuh**
Klik menandai dibaca + navigasi modul, "Tandai Semua Dibaca", klik-luar menutup, badge sinkron dengan Header.

### 18.5 `components/common/*` — **Status: berfungsi penuh**
Button/Modal/Input/Select/Tabs/Card/Badge tidak ditemukan rusak; Modal menutup via X/Escape dan mengunci scroll (tidak menutup via klik backdrop — perilaku, bukan kerusakan).

---

## 19. Ringkasan: Berfungsi vs Rusak/Dekorasi

| Modul | Status | Inti penilaian |
|---|---|---|
| Dashboard | Sebagian | Aksi antrean nyata; statistik & grafik menyesatkan |
| Daftar Pasien | Sebagian | CRUD + cari/saring nyata; handoff registrasi putus |
| Detail Pasien | Sebagian | Riwayat lintas-modul nyata; tombol aksi kehilangan konteks |
| Form Pasien | Sebagian | Tersimpan nyata; validasi identitas lemah |
| Registrasi | Sebagian | Antrean lahir nyata; dokter 2 poli salah, keluhan dibuang |
| Antrean | Sebagian | Panggil/periksa nyata; prioritas diabaikan, transisi ilegal |
| Pemeriksaan/SOAP | Sebagian | Simpan + e-resep nyata; tanpa validasi, draft duplikat, kontaminasi antar-pasien |
| Resep | Sebagian | Daftar nyata; dispensing & status akhir mati |
| Farmasi | Sebagian | Inventori nyata; dispensing tidak ada sama sekali |
| Laboratorium | Sebagian | Order/hasil/validasi terpersis; validasi kosong & ambang abnormal salah |
| Radiologi | Sebagian | Order/ekspertise terpersis; temuan karangan, workflow lompat |
| Jadwal Dokter | Sebagian | Tampilan saja; filter rusak, CRUD dekorasi |
| Kasir/Billing | Sebagian | Bayar nyata; invoice tidak bisa dibuat |
| Surat Medis | Sebagian | Terbit nyata; isi dokumen cacat (terbilang, nomor, isi kosong) |
| Laporan | **Dekorasi** | Hampir semua angka hardcoded |
| Pengguna/RBAC | Sebagian | Reset sandi nyata; RBAC tanpa penegakan |
| Audit Trail | Sebagian | Log bertambah & tersaring; integritas & isi log lemah |
| Pengaturan | Sebagian | Backup nyata; simpan profil dekorasi, klaim enkripsi palsu |
| Header | Berfungsi penuh | — |
| Sidebar | Sebagian | Navigasi nyata; gagal RBAC |
| Pencarian Global | Sebagian besar | Pencarian nyata; deep-link & penutupan cacat ringan |
| Notifikasi | Berfungsi penuh | — |
| Komponen Umum | Berfungsi penuh | — |

**Yang benar-benar berfungsi end-to-end:** registrasi pasien → antrean → panggil → pemeriksaan SOAP final → resep terbit → (berhenti di farmasi); order lab/radiologi → hasil → validasi; pembayaran invoice seed; penerbitan surat; reset sandi admin; pencarian global; notifikasi.
**Yang rusak/dekorasi:** seluruh halaman Laporan; grafik & statistik "hari ini" di Dashboard; pembuatan invoice; dispensing & pengurangan stok; CRUD jadwal; simpan profil klinik; klaim enkripsi backup; klaim audit "immutable"; penegakan RBAC.

---

## 20. Sepuluh Perbaikan Prioritas Teratas

1. **Hentikan fabrikasi data klinis** — SOAP kosong, ekspertise radiologi kosong, kontak darurat kosong, dan hasil lab kosong tidak boleh lagi diganti/diisi teks karangan atau divalidasi; tambahkan validasi wajib di ExaminationView, RadiologyView, LaboratoryView, PatientFormModal.
2. **Perbaiki formulir pemeriksaan: reset per pasien + draft yang bisa dilanjutkan** — cegah data pasien A tersimpan atas nama pasien B dan duplikasi record/resep (ExaminationView + `saveMedicalRecord` mendukung update).
3. **Sambungkan farmasi ke resep dan stok** — PharmacyView membaca antrean resep; status resep bisa mencapai `Selesai`; dispensing mengurangi stok secara atomik dan menolak stok tidak cukup.
4. **Buat invoice bisa lahir** — terbitkan invoice dari kunjungan/resep (otomatis saat SOAP final atau tombol di Billing), dengan perhitungan pajak/sisa yang benar di kuitansi.
5. **Tegakkan RBAC sungguhan** — satu peta peran→modul yang dipakai Sidebar, App, dan aksi sensitif (penerbitan surat hanya dokter, reset sandi hanya admin, audit trail hanya admin).
6. **Perbaiki penomoran dokumen** — counter persisten per jenis (antrean per hari, LAB/RAD/INV/surat/No. RM) yang tidak mundur dan tidak duplikat terhadap seed maupun data lama.
7. **Bersihkan angka pajangan** — Dashboard dan Laporan: semua angka dihitung dari store dengan filter tanggal yang benar (tambahkan field tanggal pada antrean), atau hapus metrik yang datanya belum ada (tren 7 hari, waktu tunggu, 10 besar penyakit — hitungan aslinya sebenarnya sudah ditulis di ReportsView tetapi tidak dirender).
8. **Amankan alur antrean** — sortir prioritas (Cito → Lansia → waktu daftar), transisi status yang sah saja (tidak bisa Selesai tanpa Periksa, tidak bisa Periksa dari Dibatalkan), dan tutup hanya antrean kunjungan terkait saat SOAP disimpan.
9. **Perbaiki panel detail yang basi** — Prescription/Laboratory/Billing: turunkan objek terpilih dari store berdasarkan ID (bukan snapshot `useState`) agar status selalu mutakhir dan tidak terjadi penagihan/validasi ganda.
10. **Jujurkan & lengkapi pengaturan + backup** — simpan profil klinik ke store sebagai sumber kop dokumen; backup mencakup semua entitas, tambahkan restore, dan hapus klaim "terenkripsi"/"immutable" sampai benar-benar diimplementasikan.

---

## 21. Penilaian: Sejauh Mana Ini Sistem Rekam Medis Profesional?

**Yang sudah menyerupai sistem profesional:**
- Alur klinisnya berbentuk benar: pendaftaran → antrean poli → SOAP terstruktur dengan diagnosa ICD-10 → e-prescribing → farmasi → laboratorium/radiologi → kasir → surat medis. Tanda vital memuat BMI terhitung; resep mengambil harga dari master obat.
- Konsep keamanan dasar hadir: akun per peran dengan hash kata sandi, audit trail yang dicatat hampir di semua aksi, matriks hak akses yang dirancang per modul, dan halaman detail pasien yang mengonsolidasikan seluruh riwayat dari satu sumber data.
- Konsistensi data antar-modul di beberapa titik nyata (resep dari SOAP muncul di modul Resep; riwayat pasien lengkap di Detail Pasien).

**Kesenjangan terbesar (mengapa ini masih prototipe, bukan sistem produksi):**

1. **Tidak ada backend — seluruh data medis plaintext di localStorage browser** (`tongfang_v3_*`). Ini kesenjangan paling fundamental terhadap Permenkes 24/2022: RME wajib diselenggarakan lewat sistem elektronik yang menjamin keamanan, keutuhan, kerahasiaan, dan ketersediaan data (Pasal 13–15), dengan penyimpanan pada pusat data/peladen yang memenuhi syarat. Data di localStorage hilang saat cache dibersihkan, berpindah mengikuti peramban (bukan pasien), dapat dibaca/diubah siapa pun yang memegang perangkat, dan tidak ada enkripsi at-rest. UU PDP No. 27/2022 juga menempatkan data kesehatan sebagai data pribadi spesifik yang wajib dilindungi berlapis.
2. **Tidak ada interoperabilitas SATUSEHAT** — Permenkes 24/2022 (Pasal 21) mewajibkan RME terhubung ke platform SATUSEHAT (standar HL7 FHIR). Aplikasi ini tidak memiliki API, format pertukaran, atau pemetaan FHIR apa pun; klaim "Interoperabilitas SatuSehat" di footer hanya teks.
3. **RBAC tidak ditegakkan & tanda tangan tidak ada** — Permenkes mensyaratkan akses sesuai kewenangan dan rekam medis ditandatangani (elektronik) oleh PPA. Di sini semua peran membuka semua modul, dan surat medis dapat terbit atas nama peran apa pun dengan nomor SIP karangan.
4. **Integritas catatan lemah** — audit trail dapat diedit dari DevTools, IP-nya fiktif, jamnya meleset zona waktu; rekam medis final dapat terkontaminasi data pasien lain dan berisi teks karangan sistem. Untuk dokumen yang bernilai hukum (retensi rekam medis diatur bertahun-tahun dan menjadi bukti), ini tidak dapat diterima.
5. **Pengaman keselamatan pasien belum berfungsi** — alergi tidak memblokir resep, abnormalitas lab dinilai dengan ambang tunggal yang salah, tanda vital tanpa batas kewajaran, stok tidak berkurang saat obat diserahkan. Sistem profesional menaruh *hard stop* pada titik-titik ini.
6. **Keandalan operasional belum ada** — tidak ada restore dari backup, penomoran dokumen dapat duplikat, dan angka manajerial (dashboard/laporan) sebagian karangan — manajemen tidak bisa mengambil keputusan dari sistem ini.

**Kesimpulan:** sebagai **prototipe/demo alur**, aplikasi ini di atas rata-rata — kerangka modul, alur klinis, dan konsistensi state-nya nyata dan sebagian besar tombol benar-benar bekerja. Sebagai **sistem rekam medis profesional**, ia belum memenuhi syarat minimum: fondasi penyimpanan, keamanan, interoperabilitas, dan integritasnya belum ada. Urutan jalan yang masuk akal: perbaiki dulu 10 prioritas di atas (integritas alur di sisi klien), lalu bangun backend (API + basis data server + autentikasi server-side + audit log append-only), integrasi SATUSEHAT, dan tanda tangan elektronik — tanpa itu, aplikasi ini tidak boleh menyentuh data pasien asli.
