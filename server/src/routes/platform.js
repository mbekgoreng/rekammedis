// Panel platform (superadmin pemilik RekamMedis): ringkasan tenant, kelola
// langganan, konfirmasi pembayaran manual, dan membaca outbox email (dev).
// Autentikasi terpisah dari akun klinik: JWT kind 'platform'.
import { verifyPassword, signJwt, verifyJwt } from '../crypto.js';
import { extendSubscription } from './billing.js';
import { subscriptionState } from './data.js';

export function requirePlatform(ctx) {
  return (req, res, next) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const payload = token && verifyJwt(token, ctx.config.jwtSecret);
    if (!payload || payload.kind !== 'platform') return res.json(401, { error: 'Sesi platform tidak valid.' });
    req.platformAdmin = payload;
    return next();
  };
}

export function registerPlatformRoutes(router, ctx) {
  const { db } = ctx;
  const guard = requirePlatform(ctx);

  router.post('/api/platform/login', (req, res, body) => {
    const admin = db.prepare('SELECT * FROM platform_admins WHERE email = ?').get(String(body?.email || '').toLowerCase());
    if (!admin || !verifyPassword(String(body?.password || ''), admin.password_hash)) {
      return res.json(401, { error: 'Email atau kata sandi platform salah.' });
    }
    const token = signJwt({ sub: admin.id, email: admin.email, kind: 'platform' }, ctx.config.jwtSecret, 8 * 3600);
    return res.json(200, { token, email: admin.email });
  });

  router.get('/api/platform/overview', (req, res) => {
    const clinics = db.prepare('SELECT COUNT(*) AS n FROM clinics').get().n;
    const users = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
    const paid = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS n FROM payments WHERE status = 'paid'").get();
    const pending = db.prepare("SELECT COUNT(*) AS n FROM payments WHERE status = 'awaiting_confirmation'").get().n;
    return res.json(200, { clinics, users, revenueTotal: paid.total, paidCount: paid.n, pendingPayments: pending });
  }, { platform: true, guard });

  router.get('/api/platform/clinics', (req, res) => {
    const rows = db.prepare(`SELECT c.id, c.name, c.email, c.faskes_code, c.status, c.created_at,
        (SELECT COUNT(*) FROM users u WHERE u.clinic_id = c.id) AS user_count
      FROM clinics c ORDER BY c.created_at DESC`).all();
    const out = rows.map((c) => {
      const sub = subscriptionState(db, c.id);
      return {
        ...c,
        subscription: { plan: sub.plan, status: sub.status, expired: sub.expired, trialEndsAt: sub.trial_ends_at, currentPeriodEnd: sub.current_period_end }
      };
    });
    return res.json(200, { clinics: out });
  }, { platform: true, guard });

  router.post('/api/platform/clinics/:id/activate', (req, res, body) => {
    const clinic = db.prepare('SELECT id FROM clinics WHERE id = ?').get(req.params.id);
    if (!clinic) return res.json(404, { error: 'Klinik tidak ditemukan.' });
    const plan = body?.plan === 'pro' ? 'pro' : 'basic';
    const months = Math.max(1, Math.min(36, Number(body?.months) || 1));
    const end = extendSubscription(db, clinic.id, plan, months);
    return res.json(200, { ok: true, currentPeriodEnd: end });
  }, { platform: true, guard });

  router.post('/api/platform/payments/:id/confirm', (req, res) => {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
    if (!payment) return res.json(404, { error: 'Pembayaran tidak ditemukan.' });
    if (payment.status === 'paid') return res.json(200, { ok: true, note: 'Sudah terkonfirmasi sebelumnya.' });
    db.prepare("UPDATE payments SET status = 'paid', paid_at = datetime('now') WHERE id = ?").run(payment.id);
    const end = extendSubscription(db, payment.clinic_id, payment.plan, payment.months);
    return res.json(200, { ok: true, currentPeriodEnd: end });
  }, { platform: true, guard });

  router.get('/api/platform/payments', (req, res) => {
    const rows = db.prepare(`SELECT p.*, c.name AS clinic_name FROM payments p JOIN clinics c ON c.id = p.clinic_id
      ORDER BY p.created_at DESC LIMIT 50`).all();
    return res.json(200, { payments: rows });
  }, { platform: true, guard });

  router.get('/api/platform/outbox', (req, res) => {
    const rows = db.prepare('SELECT id, to_email, subject, created_at, sent_at FROM mail_outbox ORDER BY created_at DESC LIMIT 30').all();
    return res.json(200, { outbox: rows });
  }, { platform: true, guard });
}
