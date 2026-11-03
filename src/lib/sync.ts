// Sinkronisasi data klinik ke server (mode API).
// localStorage tetap menjadi cache lokal; setiap penulisan irisan data juga
// dikirim ke server dengan nomor versi (optimistic concurrency). Bila server
// menolak karena versi (409 — data diubah perangkat lain), snapshot server
// diambil alih dan aplikasi dimuat ulang sekali agar semua perangkat sejajar.
import { dataKey } from './clinics';
import { apiFetch, apiSession } from './api';

export const SYNC_KEYS = [
  'users', 'clinic_profile', 'settings', 'currentUser', 'patients', 'medicines',
  'queues', 'schedules', 'records', 'prescriptions', 'lab_orders',
  'radiology_orders', 'invoices', 'certificates', 'audit_logs', 'notifications'
] as const;

const versions = new Map<string, number>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const pending = new Map<string, string>();

const vKey = (clinicId: string, key: string) => `${clinicId}:${key}`;

export function syncActiveFor(clinicId: string): boolean {
  const s = apiSession();
  return !!s?.apiToken && s.clinicId === clinicId;
}

// Ambil seluruh data server ke cache lokal. Mengembalikan true bila server
// sudah memiliki data (snapshot server dipakai), false bila server kosong
// (data lokal perangkat ini akan diunggah oleh efek penyimpanan Store).
export async function hydrateFromServer(clinicId: string): Promise<boolean> {
  const { status, data } = await apiFetch<{ data: Record<string, { value: unknown; version: number }> }>('/api/data');
  if (status !== 200) return false;
  const entries = Object.entries(data.data || {});
  for (const [key, entry] of entries) {
    localStorage.setItem(dataKey(clinicId, key), JSON.stringify(entry.value));
    versions.set(vKey(clinicId, key), entry.version);
  }
  for (const key of SYNC_KEYS) {
    if (!versions.has(vKey(clinicId, key))) versions.set(vKey(clinicId, key), 0);
  }
  return entries.length > 0;
}

async function pushNow(clinicId: string, key: string) {
  const raw = pending.get(vKey(clinicId, key));
  if (raw === undefined) return;
  pending.delete(vKey(clinicId, key));
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return; }
  const baseVersion = versions.get(vKey(clinicId, key)) || 0;
  const { status, data } = await apiFetch<{ version?: number }>('/api/data/' + encodeURIComponent(key), {
    method: 'PUT', body: { baseVersion, value }
  });
  if (status === 200 && typeof data.version === 'number') {
    versions.set(vKey(clinicId, key), data.version);
    return;
  }
  if (status === 409) {
    const guardKey = `rm_sync_reload_${clinicId}`;
    const last = Number(sessionStorage.getItem(guardKey) || 0);
    if (Date.now() - last > 60_000) {
      sessionStorage.setItem(guardKey, String(Date.now()));
      await hydrateFromServer(clinicId);
      window.location.reload();
    }
    return;
  }
  // 402 (langganan berakhir) atau kegagalan lain: data tetap aman di lokal;
  // penulisan berikutnya akan mencoba lagi. Tidak mengganggu pekerjaan user.
}

// Tulis irisan data: selalu ke cache lokal, dan antrekan ke server bila sesi API aktif.
export function persistSlice(clinicId: string, key: string, json: string): void {
  localStorage.setItem(dataKey(clinicId, key), json);
  if (!syncActiveFor(clinicId)) return;
  pending.set(vKey(clinicId, key), json);
  const tKey = vKey(clinicId, key);
  const old = timers.get(tKey);
  if (old) clearTimeout(old);
  timers.set(tKey, setTimeout(() => { void pushNow(clinicId, key); }, 700));
}
