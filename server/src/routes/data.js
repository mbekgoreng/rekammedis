// API data aplikasi per klinik (tenant-isolated).
// Setiap "kunci" adalah satu irisan data frontend (patients, queues, records,
// invoices, settings, ...). Server menyimpan JSON apa adanya per klinik dengan
// nomor versi untuk deteksi konflik tulis (optimistic concurrency):
// PUT wajib membawa baseVersion; bila versi server lebih baru -> 409.
import { nowIso } from '../db.js';

const ALLOWED_KEYS = new Set([
  'users', 'clinic_profile', 'settings', 'currentUser', 'patients', 'medicines',
  'queues', 'schedules', 'records', 'prescriptions', 'lab_orders',
  'radiology_orders', 'invoices', 'certificates', 'audit_logs', 'notifications'
]);

// Matriks otorisasi TULIS per peran per irisan (audit klinis 2026-11-12):
// sebelumnya token peran APA PUN — termasuk kasir — dapat menimpa seluruh
// data klinis klinik. Kini penulisan dibatasi pada peran yang memang
// bekerja pada irisan itu. Irisan yang tidak tercantum (currentUser,
// notifications) boleh ditulis semua peran terautentikasi karena dihasilkan
// oleh aktivitas sesi itu sendiri. 'audit_logs' diperlakukan khusus:
// append-only (lihat handler PUT) agar jejak tidak bisa ditimpa klien.
const WRITE_ROLES = {
  users: ['admin'],
  clinic_profile: ['admin'],
  settings: ['admin'],
  patients: ['admin', 'doctor', 'nurse', 'cashier'],
  records: ['admin', 'doctor', 'nurse'],
  prescriptions: ['admin', 'doctor', 'nurse', 'pharmacist'],
  medicines: ['admin', 'pharmacist'],
  lab_orders: ['admin', 'doctor', 'nurse', 'lab'],
  radiology_orders: ['admin', 'doctor', 'nurse', 'lab'],
  queues: ['admin', 'doctor', 'nurse', 'cashier'],
  schedules: ['admin', 'doctor', 'nurse', 'cashier'],
  invoices: ['admin', 'cashier'],
  certificates: ['admin', 'doctor', 'nurse']
};

export function subscriptionState(db, clinicId) {
  const sub = db.prepare('SELECT * FROM subscriptions WHERE clinic_id = ?').get(clinicId);
  if (!sub) return { plan: 'trial', status: 'trialing', expired: false };
  const now = Date.now();
  let expired = false;
  if (sub.status === 'trialing' && sub.trial_ends_at && new Date(sub.trial_ends_at).getTime() < now) expired = true;
  if (sub.status === 'active' && sub.current_period_end && new Date(sub.current_period_end).getTime() < now) expired = true;
  if (sub.status === 'suspended') expired = true;
  return { ...sub, expired };
}

export function registerDataRoutes(router, ctx) {
  const { db } = ctx;

  router.get('/api/data', (req, res) => {
    const rows = db.prepare('SELECT key, value, version, updated_at FROM clinic_data WHERE clinic_id = ?')
      .all(req.authUser.clinic_id);
    const data = {};
    for (const r of rows) data[r.key] = { value: JSON.parse(r.value), version: r.version, updatedAt: r.updated_at };
    return res.json(200, { data });
  }, { auth: true });

  router.put('/api/data/:key', (req, res, body) => {
    const key = req.params.key;
    if (!ALLOWED_KEYS.has(key)) return res.json(400, { error: `Kunci data tidak dikenal: ${key}` });
    const allowedWriters = WRITE_ROLES[key];
    if (allowedWriters && !allowedWriters.includes(req.authUser.role)) {
      return res.json(403, { error: `Peran ${req.authUser.role} tidak berwenang menulis data ${key}.`, code: 'ROLE_FORBIDDEN' });
    }
    const sub = subscriptionState(db, req.authUser.clinic_id);
    if (sub.expired) {
      return res.json(402, { error: 'Masa langganan berakhir. Data Anda aman tersimpan; perpanjang langganan untuk melanjutkan pencatatan.', code: 'SUBSCRIPTION_EXPIRED' });
    }
    const clinicId = req.authUser.clinic_id;
    const existing = db.prepare('SELECT value, version FROM clinic_data WHERE clinic_id = ? AND key = ?').get(clinicId, key);
    const baseVersion = Number(body?.baseVersion || 0);
    if (existing && existing.version !== baseVersion) {
      return res.json(409, { error: 'Data telah berubah di perangkat lain. Muat ulang data terbaru lalu coba lagi.', code: 'VERSION_CONFLICT', serverVersion: existing.version });
    }
    const version = existing ? existing.version + 1 : 1;
    let value = JSON.stringify(body?.value ?? null);
    // audit_logs bersifat APPEND-ONLY di server: entri yang sudah tersimpan
    // tidak dapat dihapus atau diubah klien mana pun — PUT hanya boleh
    // MENAMBAH entri baru (berdasarkan id). Tanpa ini, satu kredensial staf
    // yang bocor dapat menghapus jejak aksesnya sendiri.
    if (key === 'audit_logs' && existing) {
      try {
        const oldArr = JSON.parse(existing.value);
        const newArr = JSON.parse(value);
        if (Array.isArray(oldArr) && Array.isArray(newArr)) {
          const known = new Set(oldArr.map(e => e && e.id));
          const additions = newArr.filter(e => e && e.id && !known.has(e.id));
          value = JSON.stringify([...additions, ...oldArr]);
        }
      } catch { /* nilai tidak valid sebagai array: simpan apa adanya */ }
    }
    if (Buffer.byteLength(value) > 8 * 1024 * 1024) return res.json(413, { error: 'Ukuran data melebihi batas 8 MB per kunci.' });
    if (existing) {
      db.prepare('UPDATE clinic_data SET value = ?, version = ?, updated_at = ? WHERE clinic_id = ? AND key = ?')
        .run(value, version, nowIso(), clinicId, key);
    } else {
      db.prepare('INSERT INTO clinic_data (clinic_id, key, value, version, updated_at) VALUES (?, ?, ?, ?, ?)')
        .run(clinicId, key, value, version, nowIso());
    }
    return res.json(200, { key, version });
  }, { auth: true });
}
