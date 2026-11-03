// Util kripto berbasis node:crypto saja:
// - Sandi: scrypt dengan garam acak per pengguna (format scrypt$N$salt$hash).
// - JWT HS256 ditandatangani manual (header.payload.signature, base64url).
// - Brankas kredensial: AES-256-GCM dengan kunci dari VAULT_KEY (hex 32 byte).
import crypto from 'node:crypto';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, nStr, saltHex, hashHex] = String(stored).split('$');
    if (scheme !== 'scrypt') return false;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, {
      N: Number(nStr), r: 8, p: 1
    });
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');

export function signJwt(payload, secret, expiresInSec) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSec }));
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyJwt(token, secret) {
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function sha256Hex(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function vaultEncrypt(plaintext, vaultKeyHex) {
  const key = Buffer.from(vaultKeyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: enc.toString('hex')
  });
}

export function vaultDecrypt(payload, vaultKeyHex) {
  const key = Buffer.from(vaultKeyHex, 'hex');
  const { iv, tag, data } = JSON.parse(payload);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]).toString('utf8');
}

export function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(9).toString('base64url').replace(/[^a-zA-Z0-9]/g, '')}`;
}
