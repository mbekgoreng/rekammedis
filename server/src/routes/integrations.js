// Brankas kredensial integrasi per klinik + eksekusi integrasi.
// Kredensial (SATUSEHAT, P-Care, dst.) disimpan TERENKRIPSI AES-256-GCM di
// server dan tidak pernah dikirim kembali ke browser — GET hanya memberi tahu
// status "sudah diisi/belum" dan petunjuk non-rahasia (mis. environment).
import { vaultEncrypt, vaultDecrypt } from '../crypto.js';
import { nowIso } from '../db.js';
import { getAccessToken, syncRecordToSatusehat } from '../integrations/satusehat.js';
import { getPeserta } from '../integrations/pcare.js';

const PROVIDERS = {
  satusehat: { fields: ['clientId', 'clientSecret', 'organizationId', 'environment'], label: 'SATUSEHAT' },
  pcare: { fields: ['consId', 'secretKey', 'username', 'password', 'kdAplikasi', 'userKey', 'environment'], label: 'P-Care BPJS' },
  // API key AI eksternal (OpenAI-compatible) untuk mode "Tanya AI" khusus
  // admin — disimpan terenkripsi sama seperti kredensial integrasi lain.
  ai: { fields: ['apiKey', 'baseUrl', 'model'], label: 'AI (Tanya AI)' }
};

export function loadCredentials(ctx, clinicId, provider) {
  const row = ctx.db.prepare('SELECT enc_payload FROM integration_credentials WHERE clinic_id = ? AND provider = ?')
    .get(clinicId, provider);
  if (!row) return null;
  try { return JSON.parse(vaultDecrypt(row.enc_payload, ctx.config.vaultKey)); } catch { return null; }
}

export function registerIntegrationRoutes(router, ctx) {
  const { db, config } = ctx;
  const adminOnly = (req, res) => {
    if (req.authUser.role !== 'admin') { res.json(403, { error: 'Hanya administrator klinik yang mengelola kredensial integrasi.' }); return false; }
    return true;
  };

  router.get('/api/integrations/credentials', (req, res) => {
    const status = {};
    for (const [provider, spec] of Object.entries(PROVIDERS)) {
      const creds = loadCredentials(ctx, req.authUser.clinic_id, provider);
      status[provider] = creds
        ? { configured: true, environment: creds.environment || 'sandbox', filledFields: spec.fields.filter((f) => !!creds[f]) }
        : { configured: false };
    }
    return res.json(200, { providers: status });
  }, { auth: true });

  router.put('/api/integrations/credentials/:provider', (req, res, body) => {
    if (!adminOnly(req, res)) return;
    const spec = PROVIDERS[req.params.provider];
    if (!spec) return res.json(400, { error: `Penyedia tidak dikenal: ${req.params.provider}` });
    const clean = {};
    for (const f of spec.fields) if (body?.[f] !== undefined) clean[f] = String(body[f]);
    const existing = loadCredentials(ctx, req.authUser.clinic_id, req.params.provider) || {};
    const merged = { ...existing, ...clean };
    const missing = spec.fields.filter((f) => ['clientId', 'clientSecret', 'organizationId', 'consId', 'secretKey', 'username', 'password', 'apiKey'].includes(f) && !merged[f]);
    const payload = vaultEncrypt(JSON.stringify(merged), config.vaultKey);
    db.prepare(`INSERT INTO integration_credentials (clinic_id, provider, enc_payload, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(clinic_id, provider) DO UPDATE SET enc_payload = excluded.enc_payload, updated_at = excluded.updated_at`)
      .run(req.authUser.clinic_id, req.params.provider, payload, nowIso());
    return res.json(200, { ok: true, provider: req.params.provider, missingFields: missing });
  }, { auth: true });

  router.post('/api/integrations/satusehat/test', async (req, res) => {
    const creds = loadCredentials(ctx, req.authUser.clinic_id, 'satusehat');
    if (!creds?.clientId || !creds?.clientSecret) {
      return res.json(400, { error: 'Kredensial SATUSEHAT belum lengkap. Isi client ID & secret di Pengaturan → Integrasi (tersimpan terenkripsi di server).' });
    }
    try {
      await getAccessToken(creds);
      return res.json(200, { connected: true, environment: creds.environment || 'sandbox', note: 'Token SATUSEHAT berhasil diperoleh.' });
    } catch (err) {
      return res.json(502, { connected: false, error: String(err.message || err).slice(0, 300) });
    }
  }, { auth: true });

  router.post('/api/integrations/satusehat/sync-record', async (req, res, body) => {
    const creds = loadCredentials(ctx, req.authUser.clinic_id, 'satusehat');
    if (!creds?.clientId) return res.json(400, { error: 'Kredensial SATUSEHAT belum diisi.' });
    if (!creds.organizationId) return res.json(400, { error: 'Organization ID SATUSEHAT klinik belum diisi.' });
    const clinicId = req.authUser.clinic_id;
    const readSlice = (key) => {
      const row = db.prepare('SELECT value FROM clinic_data WHERE clinic_id = ? AND key = ?').get(clinicId, key);
      return row ? JSON.parse(row.value) : [];
    };
    const record = readSlice('records').find((r) => r.id === body?.recordId);
    if (!record) return res.json(404, { error: 'Rekam medis tidak ditemukan di data klinik.' });
    if (record.status !== 'Final') return res.json(400, { error: 'Hanya rekam medis berstatus Final yang dikirim ke SATUSEHAT.' });
    const patient = readSlice('patients').find((p) => p.id === record.patientId);
    if (!patient) return res.json(404, { error: 'Data pasien tidak ditemukan.' });
    try {
      const result = await syncRecordToSatusehat(creds, { record, patient, practitionerNik: body?.practitionerNik });
      // Catat hasil sinkronisasi sebagai irisan data khusus server.
      const logRow = db.prepare('SELECT value, version FROM clinic_data WHERE clinic_id = ? AND key = ?').get(clinicId, 'satusehat_sync');
      const log = logRow ? JSON.parse(logRow.value) : {};
      log[record.id] = { ...result, syncedAt: nowIso(), by: req.authUser.id };
      db.prepare(`INSERT INTO clinic_data (clinic_id, key, value, version, updated_at) VALUES (?, 'satusehat_sync', ?, 1, ?)
        ON CONFLICT(clinic_id, key) DO UPDATE SET value = excluded.value, version = version + 1, updated_at = excluded.updated_at`)
        .run(clinicId, JSON.stringify(log), nowIso());
      return res.json(200, { ok: true, ...result });
    } catch (err) {
      return res.json(502, { ok: false, error: String(err.message || err).slice(0, 400) });
    }
  }, { auth: true });

  router.post('/api/integrations/pcare/cek-peserta', async (req, res, body) => {
    const creds = loadCredentials(ctx, req.authUser.clinic_id, 'pcare');
    if (!creds?.consId) return res.json(400, { error: 'Kredensial P-Care belum diisi. Simpan Cons ID & secret key di Pengaturan → Integrasi (server).' });
    try {
      const result = await getPeserta(creds, { noKartu: body?.noKartu, nik: body?.nik });
      return res.json(200, { ok: true, environment: creds.environment || 'sandbox', result });
    } catch (err) {
      return res.json(502, { ok: false, error: String(err.message || err).slice(0, 300) });
    }
  }, { auth: true });
}
