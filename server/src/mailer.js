// Pengiriman email: bila MAIL_WEBHOOK_URL diisi, email dikirim via POST JSON
// {to, subject, html} ke webhook tersebut (mis. jembatan ke penyedia SMTP/API
// email). Bila kosong, email hanya dicatat di outbox DB (terlihat di panel
// platform) — mode pengembangan; JANGAN pakai mode ini untuk produksi.
import { newId } from './crypto.js';
import { nowIso } from './db.js';

export async function sendMail(ctx, { to, subject, html }) {
  const id = newId('mail');
  ctx.db.prepare('INSERT INTO mail_outbox (id, to_email, subject, body, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, to, subject, html, nowIso());
  if (ctx.config.mailWebhookUrl) {
    try {
      const res = await fetch(ctx.config.mailWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html })
      });
      if (res.ok) {
        ctx.db.prepare('UPDATE mail_outbox SET sent_at = ? WHERE id = ?').run(nowIso(), id);
        return { delivered: true };
      }
      return { delivered: false, reason: `webhook HTTP ${res.status}` };
    } catch (err) {
      return { delivered: false, reason: String(err).slice(0, 200) };
    }
  }
  return { delivered: false, reason: 'MAIL_WEBHOOK_URL belum dikonfigurasi — email tersimpan di outbox' };
}
