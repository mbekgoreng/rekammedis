// Server RekamMedis — titik masuk.
// Framework mini di atas node:http (tanpa dependensi): router pola ":param",
// middleware auth JWT klinik & platform, CORS, penyajian panel platform.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb, nowIso } from './db.js';
import { verifyJwt, hashPassword, newId } from './crypto.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerDataRoutes } from './routes/data.js';
import { registerClinicUserRoutes } from './routes/clinicUsers.js';
import { registerIntegrationRoutes } from './routes/integrations.js';
import { registerBillingRoutes } from './routes/billing.js';
import { registerPlatformRoutes } from './routes/platform.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- .env sederhana (KEY=VALUE per baris) ---
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const config = {
  port: Number(process.env.PORT || 8787),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'rekammedis.db'),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-ganti-di-produksi-minimal-32-karakter',
  vaultKey: process.env.VAULT_KEY || '0'.repeat(64),
  appPublicUrl: process.env.APP_PUBLIC_URL || 'http://127.0.0.1:8901/app/',
  mailWebhookUrl: process.env.MAIL_WEBHOOK_URL || '',
  midtransServerKey: process.env.MIDTRANS_SERVER_KEY || '',
  midtransIsProduction: process.env.MIDTRANS_ENV === 'production'
};

const db = openDb(config.dbPath);
const ctx = { db, config };

// Bootstrap admin platform dari env bila belum ada.
if (process.env.PLATFORM_ADMIN_EMAIL && process.env.PLATFORM_ADMIN_PASSWORD) {
  const existing = db.prepare('SELECT id FROM platform_admins WHERE email = ?').get(process.env.PLATFORM_ADMIN_EMAIL.toLowerCase());
  if (!existing) {
    db.prepare('INSERT INTO platform_admins (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
      .run(newId('padm'), process.env.PLATFORM_ADMIN_EMAIL.toLowerCase(), hashPassword(process.env.PLATFORM_ADMIN_PASSWORD), nowIso());
    console.log(`[rekammedis-server] admin platform dibuat: ${process.env.PLATFORM_ADMIN_EMAIL}`);
  }
}

// --- Router mini ---
const routes = [];
function addRoute(method, pattern, handler, opts = {}) {
  const keys = [];
  const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, (m) => { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
  routes.push({ method, pattern, regex, keys, handler, opts });
}
const router = {
  get: (p, h, o) => addRoute('GET', p, h, o),
  post: (p, h, o) => addRoute('POST', p, h, o),
  put: (p, h, o) => addRoute('PUT', p, h, o)
};

function makeRes(raw) {
  return {
    json(status, obj) {
      const body = JSON.stringify(obj);
      raw.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      raw.end(body);
    }
  };
}

function clinicAuth(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const payload = token && verifyJwt(token, config.jwtSecret);
  if (!payload || payload.kind !== 'clinic') { res.json(401, { error: 'Sesi tidak valid. Silakan masuk kembali.' }); return false; }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
  if (!user || !user.is_active || user.token_version !== payload.tv || user.clinic_id !== payload.clinicId) {
    res.json(401, { error: 'Sesi telah dicabut. Silakan masuk kembali.' });
    return false;
  }
  req.authUser = user;
  return true;
}

registerAuthRoutes(router, ctx);
registerDataRoutes(router, ctx);
registerClinicUserRoutes(router, ctx);
registerIntegrationRoutes(router, ctx);
registerBillingRoutes(router, ctx);
registerPlatformRoutes(router, ctx);

const platformDir = path.join(__dirname, '..', 'public', 'platform');

const server = http.createServer(async (req, rawRes) => {
  const res = makeRes(rawRes);
  rawRes.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  rawRes.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  rawRes.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  if (req.method === 'OPTIONS') { rawRes.writeHead(204); rawRes.end(); return; }

  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  if (pathname === '/api/health') {
    return res.json(200, { ok: true, service: 'rekammedis-server', env: config.nodeEnv, time: nowIso() });
  }

  // Panel platform (statis)
  if (pathname === '/platform' || pathname === '/platform/') {
    const file = path.join(platformDir, 'index.html');
    if (fs.existsSync(file)) {
      rawRes.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      rawRes.end(fs.readFileSync(file));
      return;
    }
    return res.json(404, { error: 'Panel platform belum tersedia.' });
  }

  const route = routes.find((r) => r.method === req.method && r.regex.test(pathname));
  if (!route) return res.json(404, { error: 'Endpoint tidak ditemukan.' });
  const match = pathname.match(route.regex);
  req.params = {};
  route.keys.forEach((k, i) => { req.params[k] = decodeURIComponent(match[i + 1]); });

  let body = null;
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 10 * 1024 * 1024) return res.json(413, { error: 'Body terlalu besar.' });
      chunks.push(chunk);
    }
    const text = Buffer.concat(chunks).toString('utf8');
    if (text) {
      try { body = JSON.parse(text); } catch { return res.json(400, { error: 'Body bukan JSON valid.' }); }
    }
  }

  try {
    if (route.opts.auth && !clinicAuth(req, res)) return;
    if (route.opts.guard) {
      let proceeded = false;
      route.opts.guard(req, res, () => { proceeded = true; });
      if (!proceeded) return;
    }
    await route.handler(req, res, body);
  } catch (err) {
    console.error('[rekammedis-server] error:', err);
    if (!rawRes.headersSent) res.json(500, { error: 'Kesalahan server internal.' });
  }
});

server.listen(config.port, () => {
  console.log(`[rekammedis-server] berjalan di http://127.0.0.1:${config.port} (env: ${config.nodeEnv}, db: ${config.dbPath})`);
});
