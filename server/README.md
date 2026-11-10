# RekamMedis Server

Backend resmi RekamMedis: autentikasi server, data multi-tenant per klinik,
brankas kredensial integrasi, langganan, dan panel platform. Tanpa server ini,
aplikasi web berjalan dalam **mode lokal (demo)** — data hanya di browser.

## Menjalankan

```bash
cd server
cp .env.example .env   # isi JWT_SECRET, VAULT_KEY, admin platform
node src/index.js      # Node >= 22, tanpa npm install (nol dependensi)
```

- API: `http://127.0.0.1:8787/api/health`
- Panel platform: `http://127.0.0.1:8787/platform/`

## Arsitektur singkat

| Bagian | Isi |
|---|---|
| `src/routes/auth.js` | Registrasi klinik (trial 7 hari), login JWT, ganti/reset sandi, verifikasi email, kunci brute-force |
| `src/routes/data.js` | Data aplikasi per klinik (`clinic_data`), isolasi tenant, optimistic concurrency (versi), gerbang langganan berakhir (402 untuk penulisan) |
| `src/routes/clinicUsers.js` | Akun petugas per klinik (hanya admin): buat, reset sandi, aktif/nonaktifkan |
| `src/routes/integrations.js` | Brankas kredensial terenkripsi AES-256-GCM (SATUSEHAT & P-Care), uji koneksi, sinkron rekam medis, cek peserta |
| `src/integrations/satusehat.js` | OAuth2 + FHIR R4 (Encounter, Condition ICD-10, lookup IHS dari NIK) |
| `src/integrations/pcare.js` | Bridging P-Care: signature HMAC-SHA256, cek kepesertaan |
| `src/routes/billing.js` | Paket langganan, checkout Midtrans Snap (bila kunci terpasang) atau mode manual, callback terverifikasi signature |
| `src/routes/platform.js` + `public/platform/` | Panel superadmin: klinik, pembayaran, aktivasi manual, outbox email |

Sandi pengguna: **scrypt**. Sesi: **JWT HS256** dengan `token_version` untuk
pencabutan sesi. Database: **SQLite (WAL)** via `node:sqlite` — skema SQL
standar dan portabel; untuk skala besar migrasi ke PostgreSQL tinggal
mengganti lapisan `src/db.js`.

## Menghubungkan frontend

Frontend otomatis memakai server bila salah satu terpenuhi:

1. Build dengan `VITE_API_URL=https://api.rekammedis.web.id`, atau
2. Frontend dan API satu origin (reverse proxy meneruskan `/api` ke server).

Tanpa keduanya, frontend tetap berjalan mode lokal seperti sebelumnya.

## Contoh produksi (VPS + Caddy)

```caddy
api.rekammedis.web.id {
    reverse_proxy 127.0.0.1:8787
}
```

systemd:

```ini
[Unit]
Description=RekamMedis Server
After=network.target

[Service]
WorkingDirectory=/opt/rekammedis/server
ExecStart=/usr/bin/node src/index.js
Restart=always
EnvironmentFile=/opt/rekammedis/server/.env

[Install]
WantedBy=multi-user.target
```

## Cadangan data

Cadangkan berkala file database + WAL: `data/rekammedis.db`, `data/rekammedis.db-wal`.
Uji pemulihan di mesin terpisah sebelum menganggap cadangan valid.

## Yang masih memerlukan akun/keputusan owner

- Kredensial SATUSEHAT per faskes (dari Kemenkes) → isi lewat aplikasi:
  Pengaturan → Integrasi (mode server).
- Kredensial bridging P-Care per faskes (dari BPJS) → tempat yang sama.
- Kunci Midtrans (`MIDTRANS_SERVER_KEY`) untuk pembayaran online otomatis;
  tanpa kunci, checkout berjalan mode manual dan dikonfirmasi dari panel.
- Webhook email (`MAIL_WEBHOOK_URL`) agar email verifikasi/reset benar-benar
  terkirim; tanpa itu email hanya masuk outbox panel platform.
- Penyelenggara TTE tersertifikasi untuk tanda tangan elektronik dokumen
  medis (integrasi menyusul setelah fondasi ini stabil).
