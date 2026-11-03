// Rute autentikasi & registrasi klinik.
// - Registrasi klinik: membuat klinik + akun admin + langganan trial 14 hari +
//   token verifikasi email. Email admin unik lintas klinik.
// - Login: JWT (12 jam, atau 7 hari bila "ingat saya"), memuat clinicId & peran.
// - Lupa sandi: token sekali pakai (hash disimpan), tautan dikirim via mailer.
// - Keamanan: scrypt, kunci akun sementara setelah 8 gagal login (15 menit),
//   token_version untuk mencabut sesi.
import { hashPassword, verifyPassword, signJwt, randomToken, sha256Hex, newId } from '../crypto.js';
import { nowIso } from '../db.js';
import { sendMail } from '../mailer.js';

const failedLogins = new Map(); // email -> {count, lockedUntil}

function publicUser(u) {
  return {
    id: u.id, clinicId: u.clinic_id, email: u.email, name: u.name,
    role: u.role, emailVerified: !!u.email_verified, isActive: !!u.is_active
  };
}

function issueSession(ctx, user, remember) {
  const seconds = remember ? 7 * 24 * 3600 : 12 * 3600;
  const token = signJwt(
    { sub: user.id, clinicId: user.clinic_id, role: user.role, tv: user.token_version, kind: 'clinic' },
    ctx.config.jwtSecret, seconds
  );
  return { token, expiresInSeconds: seconds, user: publicUser(user) };
}

function audit(ctx, clinicId, userId, action, detail, req) {
  ctx.db.prepare('INSERT INTO audit_log (id, clinic_id, user_id, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(newId('aud'), clinicId, userId, action, detail || null, req.socket?.remoteAddress || null, nowIso());
}

export function registerAuthRoutes(router, ctx) {
  const { db, config } = ctx;

  router.post('/api/auth/register-clinic', async (req, res, body) => {
    const { clinicName, faskesCode, email, password, adminName, phone, address } = body || {};
    if (!clinicName || !email || !password || !adminName) {
      return res.json(400, { error: 'Nama klinik, nama admin, email, dan kata sandi wajib diisi.' });
    }
    if (String(password).length < 8) {
      return res.json(400, { error: 'Kata sandi minimal 8 karakter.' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(String(email).toLowerCase());
    if (existing) return res.json(409, { error: 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.' });

    const clinicId = newId('clinic');
    const userId = newId('user');
    const now = nowIso();
    const trialEnd = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
    db.exec('BEGIN');
    try {
      db.prepare('INSERT INTO clinics (id, name, faskes_code, email, phone, address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(clinicId, clinicName, faskesCode || null, String(email).toLowerCase(), phone || null, address || null, now);
      db.prepare('INSERT INTO users (id, clinic_id, email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(userId, clinicId, String(email).toLowerCase(), adminName, 'admin', hashPassword(password), now);
      db.prepare('INSERT INTO subscriptions (clinic_id, plan, status, trial_ends_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        .run(clinicId, 'trial', 'trialing', trialEnd, now);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      return res.json(500, { error: `Gagal mendaftarkan klinik: ${String(err).slice(0, 160)}` });
    }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    // Token verifikasi email (berlaku 48 jam)
    const verifyToken = randomToken();
    db.prepare('INSERT INTO tokens (id, user_id, kind, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(newId('tok'), userId, 'verify', sha256Hex(verifyToken), new Date(Date.now() + 48 * 3600 * 1000).toISOString(), now);
    const link = `${config.appPublicUrl}#/verifikasi-email?token=${verifyToken}`;
    const mail = await sendMail(ctx, {
      to: user.email,
      subject: 'Verifikasi email RekamMedis',
      html: `<p>Halo ${adminName},</p><p>Klinik <strong>${clinicName}</strong> berhasil didaftarkan. Klik tautan berikut untuk memverifikasi email Anda (berlaku 48 jam):</p><p><a href="${link}">${link}</a></p>`
    });
    audit(ctx, clinicId, userId, 'clinic.registered', clinicName, req);
    const session = issueSession(ctx, user, true);
    return res.json(201, {
      ...session,
      clinic: { id: clinicId, name: clinicName },
      subscription: { plan: 'trial', status: 'trialing', trialEndsAt: trialEnd },
      emailDelivery: mail
    });
  });

  router.post('/api/auth/login', (req, res, body) => {
    const email = String(body?.email || '').toLowerCase();
    const password = String(body?.password || '');
    const remember = !!body?.remember;
    const lock = failedLogins.get(email);
    if (lock && lock.lockedUntil > Date.now()) {
      return res.json(423, { error: 'Terlalu banyak percobaan gagal. Akun dikunci sementara 15 menit.' });
    }
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    const ok = user && user.is_active && verifyPassword(password, user.password_hash);
    if (!ok) {
      const entry = failedLogins.get(email) || { count: 0, lockedUntil: 0 };
      entry.count += 1;
      if (entry.count >= 8) { entry.lockedUntil = Date.now() + 15 * 60 * 1000; entry.count = 0; }
      failedLogins.set(email, entry);
      audit(ctx, user?.clinic_id || null, user?.id || null, 'auth.login_failed', email, req);
      return res.json(401, { error: 'Email atau kata sandi salah.' });
    }
    failedLogins.delete(email);
    const clinic = db.prepare('SELECT id, name FROM clinics WHERE id = ?').get(user.clinic_id);
    const sub = db.prepare('SELECT * FROM subscriptions WHERE clinic_id = ?').get(user.clinic_id);
    audit(ctx, user.clinic_id, user.id, 'auth.login', null, req);
    return res.json(200, {
      ...issueSession(ctx, user, remember),
      clinic,
      subscription: sub ? {
        plan: sub.plan, status: sub.status,
        trialEndsAt: sub.trial_ends_at, currentPeriodEnd: sub.current_period_end
      } : null
    });
  });

  router.get('/api/auth/me', (req, res) => {
    const u = req.authUser;
    const clinic = db.prepare('SELECT id, name FROM clinics WHERE id = ?').get(u.clinic_id);
    const sub = db.prepare('SELECT * FROM subscriptions WHERE clinic_id = ?').get(u.clinic_id);
    return res.json(200, {
      user: publicUser(u), clinic,
      subscription: sub ? { plan: sub.plan, status: sub.status, trialEndsAt: sub.trial_ends_at, currentPeriodEnd: sub.current_period_end } : null
    });
  }, { auth: true });

  router.post('/api/auth/change-password', (req, res, body) => {
    const u = req.authUser;
    if (!verifyPassword(String(body?.oldPassword || ''), u.password_hash)) {
      return res.json(401, { error: 'Kata sandi lama salah.' });
    }
    if (String(body?.newPassword || '').length < 6) {
      return res.json(400, { error: 'Kata sandi baru minimal 6 karakter.' });
    }
    db.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?')
      .run(hashPassword(String(body.newPassword)), u.id);
    audit(ctx, u.clinic_id, u.id, 'auth.password_changed', null, req);
    // Sesi lain dicabut (token_version naik); sesi ini menerima token segar
    // agar pengguna tidak terputus dari pekerjaannya.
    const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(u.id);
    const session = issueSession(ctx, fresh, true);
    return res.json(200, { ok: true, token: session.token, expiresInSeconds: session.expiresInSeconds, note: 'Sesi lain telah dicabut.' });
  }, { auth: true });

  router.post('/api/auth/forgot-password', async (req, res, body) => {
    const email = String(body?.email || '').toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    // Selalu balas sukses agar tidak membocorkan keberadaan akun.
    if (user) {
      const token = randomToken();
      db.prepare('INSERT INTO tokens (id, user_id, kind, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(newId('tok'), user.id, 'reset', sha256Hex(token), new Date(Date.now() + 3600 * 1000).toISOString(), nowIso());
      const link = `${config.appPublicUrl}#/reset-sandi?token=${token}`;
      await sendMail(ctx, {
        to: email,
        subject: 'Reset kata sandi RekamMedis',
        html: `<p>Kami menerima permintaan reset kata sandi. Tautan berikut berlaku 1 jam:</p><p><a href="${link}">${link}</a></p><p>Abaikan email ini bila Anda tidak memintanya.</p>`
      });
      audit(ctx, user.clinic_id, user.id, 'auth.reset_requested', null, req);
      const dev = config.nodeEnv !== 'production';
      return res.json(200, { ok: true, ...(dev ? { devResetLink: link } : {}) });
    }
    return res.json(200, { ok: true });
  });

  router.post('/api/auth/reset-password', (req, res, body) => {
    const tokenHash = sha256Hex(String(body?.token || ''));
    const row = db.prepare("SELECT * FROM tokens WHERE token_hash = ? AND kind = 'reset' AND used_at IS NULL").get(tokenHash);
    if (!row || row.expires_at < nowIso()) return res.json(400, { error: 'Tautan reset tidak valid atau sudah kedaluwarsa.' });
    if (String(body?.newPassword || '').length < 8) return res.json(400, { error: 'Kata sandi baru minimal 8 karakter.' });
    db.prepare('UPDATE tokens SET used_at = ? WHERE id = ?').run(nowIso(), row.id);
    db.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?')
      .run(hashPassword(String(body.newPassword)), row.user_id);
    audit(ctx, null, row.user_id, 'auth.reset_completed', null, req);
    return res.json(200, { ok: true });
  });

  router.post('/api/auth/verify-email', (req, res, body) => {
    const tokenHash = sha256Hex(String(body?.token || ''));
    const row = db.prepare("SELECT * FROM tokens WHERE token_hash = ? AND kind = 'verify' AND used_at IS NULL").get(tokenHash);
    if (!row || row.expires_at < nowIso()) return res.json(400, { error: 'Tautan verifikasi tidak valid atau sudah kedaluwarsa.' });
    db.prepare('UPDATE tokens SET used_at = ? WHERE id = ?').run(nowIso(), row.id);
    db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(row.user_id);
    return res.json(200, { ok: true });
  });
}
