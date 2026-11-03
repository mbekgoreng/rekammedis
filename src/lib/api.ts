// Klien API backend RekamMedis.
// Aktif bila VITE_API_URL terisi saat build, ATAU endpoint /api/health pada
// origin yang sama merespons (produksi di balik reverse proxy). Bila tidak,
// aplikasi berjalan dalam MODE LOKAL (demo): data hanya di perangkat ini.
import type { SessionData } from './auth';

const ENV_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';

let healthCache: Promise<boolean> | null = null;

export function apiHealth(): Promise<boolean> {
  if (!healthCache) {
    healthCache = (async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 2500);
        const res = await fetch(`${ENV_BASE}/api/health`, { signal: ctrl.signal });
        clearTimeout(t);
        return res.ok;
      } catch {
        return false;
      }
    })();
  }
  return healthCache;
}

export function apiSession(): SessionData | null {
  try {
    const raw = window.localStorage.getItem('tongfang_v3_session') || window.sessionStorage.getItem('tongfang_v3_session');
    return raw ? (JSON.parse(raw) as SessionData) : null;
  } catch {
    return null;
  }
}

export async function apiFetch<T = unknown>(path: string, opts: { method?: string; body?: unknown; token?: string } = {}): Promise<{ status: number; data: T }> {
  const session = apiSession();
  const token = opts.token ?? session?.apiToken;
  const res = await fetch(`${ENV_BASE}${path}`, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}

export interface ApiLoginResult {
  token: string;
  expiresInSeconds: number;
  user: { id: string; clinicId: string; email: string; name: string; role: string; emailVerified: boolean };
  clinic: { id: string; name: string };
  subscription: { plan: string; status: string; trialEndsAt?: string | null; currentPeriodEnd?: string | null } | null;
}

export async function apiLogin(email: string, password: string, remember: boolean): Promise<ApiLoginResult> {
  const { status, data } = await apiFetch<ApiLoginResult & { error?: string }>('/api/auth/login', {
    method: 'POST', body: { email, password, remember }, token: ''
  });
  if (status !== 200) throw new Error(data.error || `Login gagal (HTTP ${status})`);
  return data;
}

export async function apiRegisterClinic(payload: {
  clinicName: string; faskesCode?: string; email: string; password: string; adminName: string; phone?: string; address?: string;
}): Promise<ApiLoginResult> {
  const { status, data } = await apiFetch<ApiLoginResult & { error?: string }>('/api/auth/register-clinic', {
    method: 'POST', body: payload, token: ''
  });
  if (status !== 201) throw new Error(data.error || `Pendaftaran gagal (HTTP ${status})`);
  return data;
}
