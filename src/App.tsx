import React, { Suspense, useEffect, useState } from 'react';
import { LoginView } from './modules/auth/LoginView';
import { dataKey } from './lib/clinics';
import { apiFetch } from './lib/api';
import { hydrateFromServer } from './lib/sync';
import type { User } from './types';
import { loadSession, type SessionData } from './lib/auth';

// Cangkang ruang kerja (store + sidebar/header + seluruh modul) dimuat
// sebagai chunk terpisah lewat React.lazy — chunk awal yang diterima
// pengunjung di halaman masuk hanya berisi App tipis + LoginView + lib kecil.
const loadWorkspace = () => import('./Workspace');
const Workspace = React.lazy(loadWorkspace);

/** Layar pemuatan bermerek (logo + nama RekamMedis), selaras panel masuk. */
const ShellLoadingScreen: React.FC<{ title?: string; subtitle?: string }> = ({
  title = 'Memuat ruang kerja…',
  subtitle = 'Menyiapkan aplikasi RekamMedis'
}) => (
  <div
    className="min-h-screen flex items-center justify-center font-sans"
    style={{ background: 'linear-gradient(150deg, #17155E 0%, #213A75 48%, #2F698B 100%)' }}
  >
    <div className="text-center text-white px-6">
      <span className="bg-white rounded-2xl p-2 inline-flex shadow-lg">
        <img src="/logo.svg" alt="Logo RekamMedis" className="w-12 h-12" />
      </span>
      <p className="font-extrabold text-xl tracking-tight mt-4">RekamMedis</p>
      <p className="text-sm font-semibold text-white/85 mt-3">{title}</p>
      <p className="text-[11px] text-white/60 mt-1">{subtitle}</p>
      <div className="mt-6 flex justify-center">
        <span
          className="w-8 h-8 rounded-full border-[3px] border-white/25 border-t-[#84E488] animate-spin"
          role="status"
          aria-label="Memuat"
        />
      </div>
    </div>
  </div>
);

export default function App() {
  const [session, setSession] = useState<SessionData | null>(() => loadSession());
  const [bootKey, setBootKey] = useState<string | null>(null);
  const sessionKey = session?.apiToken ? `${session.clinicId}:${session.apiToken}` : null;

  // Prefetch chunk cangkang: mulai dimuat saat halaman masuk idle
  // (requestIdleCallback; cadangan setTimeout ±1200ms) atau saat interaksi
  // pertama pengguna dengan halaman — mana yang lebih dulu — supaya proses
  // masuk sesudahnya terasa instan.
  useEffect(() => {
    if (session) return;
    let cancelled = false;
    const prefetch = () => {
      if (!cancelled) void loadWorkspace();
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (typeof w.requestIdleCallback === 'function') {
      idleId = w.requestIdleCallback(prefetch, { timeout: 2500 });
    } else {
      timer = setTimeout(prefetch, 1200);
    }
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'focusin'];
    events.forEach((ev) => window.addEventListener(ev, prefetch, { once: true, capture: true }));
    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(idleId);
      if (timer) clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, prefetch, { capture: true }));
    };
  }, [session]);

  // Mode server: sebelum ruang kerja dimuat, tarik snapshot server ke cache
  // lokal dan samakan daftar akun login dari server (sumber kebenaran akun).
  useEffect(() => {
    let alive = true;
    (async () => {
      if (session?.apiToken) {
        try {
          await hydrateFromServer(session.clinicId);
          const usersRes = await apiFetch<{ users: { id: string; email: string; name: string; role: User['role']; isActive: boolean }[] }>('/api/clinic/users');
          const meRes = await apiFetch<{ user: { id: string }; clinic: { id: string; name: string } }>('/api/auth/me');
          if (usersRes.data.users) {
            const prevRaw = localStorage.getItem(dataKey(session.clinicId, 'users'));
            const prev: User[] = prevRaw ? (JSON.parse(prevRaw) as User[]) : [];
            const mapped: User[] = usersRes.data.users.map((su) => {
              const local = prev.find((u) => u.id === su.id || u.email === su.email);
              return {
                id: su.id, email: su.email, name: su.name, role: su.role, isActive: su.isActive,
                department: local?.department, sipNumber: local?.sipNumber, avatar: local?.avatar
              };
            });
            localStorage.setItem(dataKey(session.clinicId, 'users'), JSON.stringify(mapped));
            const me = mapped.find((u) => u.id === meRes.data.user?.id);
            if (me) localStorage.setItem(dataKey(session.clinicId, 'currentUser'), JSON.stringify(me));
          }
          if (meRes.data.clinic && !localStorage.getItem(dataKey(session.clinicId, 'clinic_profile'))) {
            localStorage.setItem(dataKey(session.clinicId, 'clinic_profile'), JSON.stringify({
              clinicName: meRes.data.clinic.name, licenseNumber: '', faskesCode: '',
              address: '', phone: '', email: '', directorName: ''
            }));
          }
        } catch {
          // Server tak terjangkau: lanjut dengan cache lokal perangkat ini.
        }
      }
      if (alive && sessionKey) setBootKey(sessionKey);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);

  if (!session) {
    return <LoginView onAuthenticated={() => setSession(loadSession())} />;
  }

  if (session.apiToken && bootKey !== sessionKey) {
    return (
      <ShellLoadingScreen
        title="Menyiapkan ruang kerja klinik…"
        subtitle="Mengambil data terbaru dari server RekamMedis"
      />
    );
  }

  return (
    <Suspense fallback={<ShellLoadingScreen />}>
      <Workspace clinicId={session.clinicId} onLogout={() => setSession(null)} />
    </Suspense>
  );
}
