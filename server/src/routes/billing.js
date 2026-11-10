// Langganan klinik (billing platform).
// Paket & harga adalah konfigurasi produk — ubah di PLANS bila kebijakan harga
// berubah. Pembayaran: (1) Midtrans Snap bila MIDTRANS_SERVER_KEY terpasang di
// environment server platform; (2) mode manual: instruksi transfer + pembayaran
// dikonfirmasi admin platform dari panel. Keduanya tercatat di tabel payments.
import crypto from 'node:crypto';
import { newId } from '../crypto.js';
import { nowIso } from '../db.js';
import { subscriptionState } from './data.js';

// Skema harga atas keputusan owner (2026-11-03): DISKON 50% dari harga
// normal; harga setelah diskon Basic = Rp79rb/bulan (Pro Rp149rb/bulan).
// monthly = harga yang benar-benar dibayar; normalMonthly = harga normal
// sebelum diskon (ditampilkan tercoret di panel langganan).
export const PLANS = {
  basic: { name: 'Basic', monthly: 79000, normalMonthly: 158000, discountPercent: 50, features: ['Semua modul RME', 'SATUSEHAT', 'Multi-petugas'] },
  pro: { name: 'Pro', monthly: 149000, normalMonthly: 298000, discountPercent: 50, features: ['Semua fitur Basic', 'Bridging P-Care BPJS', 'Antrean Mobile JKN', 'Prioritas dukungan'] }
};

export function extendSubscription(db, clinicId, plan, months) {
  const sub = db.prepare('SELECT * FROM subscriptions WHERE clinic_id = ?').get(clinicId);
  const base = sub?.current_period_end && new Date(sub.current_period_end).getTime() > Date.now()
    ? new Date(sub.current_period_end) : new Date();
  const end = new Date(base.getTime() + months * 30 * 24 * 3600 * 1000).toISOString();
  db.prepare(`INSERT INTO subscriptions (clinic_id, plan, status, current_period_end, updated_at) VALUES (?, ?, 'active', ?, ?)
    ON CONFLICT(clinic_id) DO UPDATE SET plan = excluded.plan, status = 'active', current_period_end = excluded.current_period_end, updated_at = excluded.updated_at`)
    .run(clinicId, plan, end, nowIso());
  return end;
}

export function registerBillingRoutes(router, ctx) {
  const { db, config } = ctx;

  router.get('/api/billing', (req, res) => {
    const sub = subscriptionState(db, req.authUser.clinic_id);
    const payments = db.prepare('SELECT id, plan, months, amount, status, gateway, created_at, paid_at FROM payments WHERE clinic_id = ? ORDER BY created_at DESC LIMIT 10')
      .all(req.authUser.clinic_id);
    return res.json(200, {
      subscription: {
        plan: sub.plan, status: sub.status, expired: sub.expired,
        trialEndsAt: sub.trial_ends_at, currentPeriodEnd: sub.current_period_end
      },
      plans: PLANS,
      gatewayConfigured: !!config.midtransServerKey,
      payments
    });
  }, { auth: true });

  router.post('/api/billing/checkout', async (req, res, body) => {
    const plan = PLANS[body?.plan];
    if (!plan) return res.json(400, { error: 'Paket tidak dikenal.' });
    const months = [1, 3, 6, 12].includes(Number(body?.months)) ? Number(body.months) : 1;
    const amount = plan.monthly * months;
    const paymentId = newId('pay');
    if (config.midtransServerKey) {
      const orderId = `RM-${paymentId}`;
      const snapBase = config.midtransIsProduction ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
      try {
        const snapRes = await fetch(`${snapBase}/snap/v1/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${config.midtransServerKey}:`).toString('base64')}`
          },
          body: JSON.stringify({
            transaction_details: { order_id: orderId, gross_amount: amount },
            customer_details: { email: req.authUser.email },
            item_details: [{ id: body.plan, price: plan.monthly, quantity: months, name: `RekamMedis ${plan.name} ${months} bulan` }]
          })
        });
        const snap = await snapRes.json().catch(() => ({}));
        if (!snapRes.ok || !snap.token) throw new Error(JSON.stringify(snap).slice(0, 200));
        db.prepare('INSERT INTO payments (id, clinic_id, plan, months, amount, status, gateway, gateway_ref, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .run(paymentId, req.authUser.clinic_id, body.plan, months, amount, 'pending', 'midtrans', orderId, nowIso());
        return res.json(201, { mode: 'midtrans', paymentId, snapToken: snap.token, redirectUrl: snap.redirect_url, amount });
      } catch (err) {
        return res.json(502, { error: `Gateway pembayaran gagal: ${String(err.message || err).slice(0, 200)}` });
      }
    }
    db.prepare('INSERT INTO payments (id, clinic_id, plan, months, amount, status, gateway, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(paymentId, req.authUser.clinic_id, body.plan, months, amount, 'awaiting_confirmation', 'manual', nowIso());
    return res.json(201, {
      mode: 'manual',
      paymentId, amount,
      instructions: 'Gateway pembayaran online belum diaktifkan oleh platform. Lakukan transfer sesuai petunjuk yang diberikan admin RekamMedis, lalu pembayaran Anda dikonfirmasi manual dari panel platform (maks. 1x24 jam kerja). Cantumkan kode pembayaran pada berita transfer.',
      paymentCode: paymentId
    });
  }, { auth: true });

  // Callback Midtrans (publik; keaslian diverifikasi via signature_key SHA512).
  router.post('/api/billing/midtrans-callback', (req, res, body) => {
    if (!config.midtransServerKey) return res.json(404, { error: 'Gateway tidak aktif.' });
    const { order_id, status_code, gross_amount, signature_key, transaction_status } = body || {};
    const expected = crypto.createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${config.midtransServerKey}`).digest('hex');
    const sigBuf = Buffer.from(String(signature_key || ''));
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return res.json(403, { error: 'Signature tidak valid.' });
    }
    const payment = db.prepare('SELECT * FROM payments WHERE gateway_ref = ?').get(order_id);
    if (!payment) return res.json(404, { error: 'Pembayaran tidak ditemukan.' });
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      db.prepare("UPDATE payments SET status = 'paid', paid_at = ? WHERE id = ?").run(nowIso(), payment.id);
      extendSubscription(db, payment.clinic_id, payment.plan, payment.months);
    } else if (['deny', 'cancel', 'expire'].includes(transaction_status)) {
      db.prepare("UPDATE payments SET status = 'failed' WHERE id = ?").run(payment.id);
    }
    return res.json(200, { ok: true });
  });
}
