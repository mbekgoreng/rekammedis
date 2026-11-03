// Autentikasi sisi-klien RekamMedis.
//
// CATATAN KEAMANAN: aplikasi ini belum memiliki backend, jadi login di sini
// adalah gerbang akses di sisi browser (kata sandi tersimpan sebagai hash
// SHA-256 bergaram per-pengguna, sesi berbatas waktu). Ini BUKAN pengganti
// autentikasi server — data aplikasi tetap berada di localStorage perangkat.
// Keamanan sesungguhnya memerlukan backend (API + basis data server).

export const DEFAULT_PASSWORD = 'klinik2026';

const SALT_PREFIX = 'rekammedis';
export const SESSION_STORAGE_KEY = 'tongfang_v3_session';

/** Hash kata sandi: SHA-256 atas "rekammedis:<userId>:<password>" (hex). */
export async function hashPassword(userId: string, password: string): Promise<string> {
  const raw = `${SALT_PREFIX}:${userId}:${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback untuk konteks non-aman (bukan kriptografis, hanya agar fungsi tetap jalan)
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

export interface SessionData {
  userId: string;
  email: string;
  /** Klinik pemilik akun — sesi selalu terikat ke satu ruang kerja klinik. */
  clinicId: string;
  loginAt: number;
  expiresAt: number;
  remember: boolean;
}

export function loadSession(): SessionData | null {
  try {
    const raw =
      window.localStorage.getItem(SESSION_STORAGE_KEY) ||
      window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionData;
    if (!parsed.userId || !parsed.expiresAt || parsed.expiresAt <= Date.now()) {
      clearSession();
      return null;
    }
    // Sesi lama (sebelum multi-klinik) dianggap milik klinik bawaan
    if (!parsed.clinicId) parsed.clinicId = 'tongfang';
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: SessionData): void {
  clearSession();
  const storage = session.remember ? window.localStorage : window.sessionStorage;
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // abaikan
  }
}

// ---- Pengaman percobaan login (anti brute-force sederhana) ----

const GUARD_KEY = 'tongfang_v3_login_guard';
const MAX_FAILS = 5;
const LOCK_MS = 60_000;

interface LoginGuard {
  fails: number;
  lockUntil: number;
}

export function loadGuard(): LoginGuard {
  try {
    const raw = window.sessionStorage.getItem(GUARD_KEY);
    if (raw) return JSON.parse(raw) as LoginGuard;
  } catch {
    // abaikan
  }
  return { fails: 0, lockUntil: 0 };
}

export function recordFailedLogin(maxFails: number = MAX_FAILS, lockMs: number = LOCK_MS): LoginGuard {
  const guard = loadGuard();
  guard.fails += 1;
  if (guard.fails >= maxFails) {
    guard.lockUntil = Date.now() + lockMs;
    guard.fails = 0;
  }
  try {
    window.sessionStorage.setItem(GUARD_KEY, JSON.stringify(guard));
  } catch {
    // abaikan
  }
  return guard;
}

export function resetGuard(): void {
  try {
    window.sessionStorage.removeItem(GUARD_KEY);
  } catch {
    // abaikan
  }
}
