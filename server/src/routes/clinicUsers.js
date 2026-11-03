// Manajemen akun petugas milik satu klinik (hanya admin klinik).
// Akun di sini adalah akun LOGIN server; daftar petugas yang tampil di aplikasi
// disinkronkan dari sini agar staf baru benar-benar bisa masuk.
import { hashPassword, newId } from '../crypto.js';
import { nowIso } from '../db.js';

const ROLES = ['admin', 'doctor', 'nurse', 'pharmacist', 'cashier', 'lab'];

export function registerClinicUserRoutes(router, ctx) {
  const { db } = ctx;
  const adminOnly = (req, res) => {
    if (req.authUser.role !== 'admin') { res.json(403, { error: 'Hanya administrator klinik yang dapat mengelola akun petugas.' }); return false; }
    return true;
  };

  router.get('/api/clinic/users', (req, res) => {
    const rows = db.prepare('SELECT id, email, name, role, email_verified, is_active, created_at FROM users WHERE clinic_id = ? ORDER BY created_at')
      .all(req.authUser.clinic_id);
    return res.json(200, {
      users: rows.map((u) => ({
        id: u.id, email: u.email, name: u.name, role: u.role,
        emailVerified: !!u.email_verified, isActive: !!u.is_active, createdAt: u.created_at
      }))
    });
  }, { auth: true });

  router.post('/api/clinic/users', (req, res, body) => {
    if (!adminOnly(req, res)) return;
    const { email, name, role, password } = body || {};
    if (!email || !name || !role || !password) return res.json(400, { error: 'Nama, email, peran, dan kata sandi wajib diisi.' });
    if (!ROLES.includes(role)) return res.json(400, { error: `Peran tidak dikenal: ${role}` });
    if (String(password).length < 6) return res.json(400, { error: 'Kata sandi minimal 6 karakter.' });
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(String(email).toLowerCase());
    if (existing) return res.json(409, { error: 'Email sudah dipakai akun lain (lintas klinik). Gunakan email berbeda.' });
    const id = newId('user');
    db.prepare('INSERT INTO users (id, clinic_id, email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.authUser.clinic_id, String(email).toLowerCase(), name, role, hashPassword(String(password)), nowIso());
    return res.json(201, { user: { id, email: String(email).toLowerCase(), name, role, isActive: true } });
  }, { auth: true });

  router.post('/api/clinic/users/:id/reset-password', (req, res, body) => {
    if (!adminOnly(req, res)) return;
    const target = db.prepare('SELECT * FROM users WHERE id = ? AND clinic_id = ?').get(req.params.id, req.authUser.clinic_id);
    if (!target) return res.json(404, { error: 'Akun tidak ditemukan di klinik Anda.' });
    if (String(body?.newPassword || '').length < 6) return res.json(400, { error: 'Kata sandi baru minimal 6 karakter.' });
    db.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?')
      .run(hashPassword(String(body.newPassword)), target.id);
    return res.json(200, { ok: true });
  }, { auth: true });

  router.post('/api/clinic/users/:id/active', (req, res, body) => {
    if (!adminOnly(req, res)) return;
    const target = db.prepare('SELECT * FROM users WHERE id = ? AND clinic_id = ?').get(req.params.id, req.authUser.clinic_id);
    if (!target) return res.json(404, { error: 'Akun tidak ditemukan di klinik Anda.' });
    if (target.id === req.authUser.id && !body?.isActive) return res.json(400, { error: 'Anda tidak dapat menonaktifkan akun sendiri.' });
    db.prepare('UPDATE users SET is_active = ?, token_version = token_version + 1 WHERE id = ?')
      .run(body?.isActive ? 1 : 0, target.id);
    return res.json(200, { ok: true, isActive: !!body?.isActive });
  }, { auth: true });
}
