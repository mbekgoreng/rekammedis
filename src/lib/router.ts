import { useCallback, useEffect, useState } from 'react';

// Router ringan berbasis History API untuk aplikasi di bawah /app/.
// Setiap modul punya URL sendiri (deep-link, tombol kembali/maju browser,
// bagikan tautan, judul tab per halaman) tanpa dependensi tambahan.
//
// Peta modul -> path adalah sumber tunggal: Sidebar, Workspace, dan semua
// pemanggil onNavigate tetap memakai id modul; konversi ke URL di sini.

export const APP_BASE = '/app';

export interface RouteDef {
  module: string;
  /** segmen path di bawah /app, mis. '/pasien' */
  segment: string;
  title: string;
}

export const ROUTES: RouteDef[] = [
  { module: 'dashboard', segment: '/dashboard', title: 'Dashboard' },
  { module: 'guide', segment: '/panduan', title: 'Panduan Penggunaan' },
  { module: 'queue', segment: '/antrean', title: 'Antrian' },
  { module: 'registration', segment: '/pendaftaran', title: 'Pendaftaran' },
  { module: 'patients', segment: '/pasien', title: 'Data Pasien' },
  { module: 'patient_detail', segment: '/pasien', title: 'Detail Pasien' },
  { module: 'examination', segment: '/pemeriksaan', title: 'Pemeriksaan & SOAP' },
  { module: 'medical_records', segment: '/rekam-medis', title: 'Rekam Medis' },
  { module: 'prescription', segment: '/resep', title: 'Resep Digital' },
  { module: 'pharmacy', segment: '/farmasi', title: 'Farmasi & Stok' },
  { module: 'laboratory', segment: '/laboratorium', title: 'Laboratorium' },
  { module: 'radiology', segment: '/radiologi', title: 'Radiologi' },
  { module: 'letters', segment: '/surat-medis', title: 'Surat Medis' },
  { module: 'schedule', segment: '/jadwal-dokter', title: 'Jadwal Dokter' },
  { module: 'billing', segment: '/kasir', title: 'Pembayaran & Kasir' },
  { module: 'bpjs', segment: '/bpjs', title: 'BPJS & Kapitasi' },
  { module: 'reports', segment: '/laporan', title: 'Laporan Fasilitas' },
  { module: 'users', segment: '/pengguna', title: 'Manajemen Pengguna' },
  { module: 'audit', segment: '/audit', title: 'Audit Trail' },
  { module: 'settings', segment: '/pengaturan', title: 'Pengaturan Klinik' },
  { module: 'change_password', segment: '/ganti-sandi', title: 'Ganti Kata Sandi' },
];

const byModule = new Map(ROUTES.map((r) => [r.module, r]));
const bySegment = new Map(
  ROUTES.filter((r) => r.module !== 'patient_detail').map((r) => [r.segment, r])
);

export interface ParsedRoute {
  module: string;
  patientId: string | null;
  /** true bila path tidak dikenal sama sekali */
  notFound: boolean;
}

export function parseRoute(pathname: string): ParsedRoute {
  let rest = pathname;
  if (rest === APP_BASE || rest === APP_BASE + '/') rest = '/dashboard';
  else if (rest.startsWith(APP_BASE + '/')) rest = rest.slice(APP_BASE.length);
  if (rest.length > 1 && rest.endsWith('/')) rest = rest.slice(0, -1);

  // Detail pasien: /pasien/<id>
  const detail = rest.match(/^\/pasien\/([^/]+)$/);
  if (detail) {
    return { module: 'patient_detail', patientId: decodeURIComponent(detail[1]), notFound: false };
  }
  const def = bySegment.get(rest);
  if (def) return { module: def.module, patientId: null, notFound: false };
  return { module: 'dashboard', patientId: null, notFound: true };
}

export function moduleToPath(module: string, patientId?: string | null): string {
  if (module === 'patient_detail' && patientId) {
    return `${APP_BASE}/pasien/${encodeURIComponent(patientId)}`;
  }
  const def = byModule.get(module);
  return APP_BASE + (def ? def.segment : '/dashboard');
}

export function routeTitle(module: string): string {
  return byModule.get(module)?.title ?? 'Dashboard';
}

const ROUTE_EVENT = 'rekammedis:routechange';

export function navigateTo(path: string, opts?: { replace?: boolean }) {
  const url = new URL(path, window.location.origin);
  const current = window.location.pathname + window.location.search;
  const target = url.pathname + url.search;
  if (current === target) return;
  if (opts?.replace) window.history.replaceState({}, '', target);
  else window.history.pushState({}, '', target);
  window.dispatchEvent(new Event(ROUTE_EVENT));
}

/** Hook: rute aktif yang selalu sinkron dengan URL (push, replace, popstate). */
export function useRoute(): { route: ParsedRoute; navigate: (module: string, patientId?: string | null) => void } {
  const [route, setRoute] = useState<ParsedRoute>(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const update = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', update);
    window.addEventListener(ROUTE_EVENT, update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener(ROUTE_EVENT, update);
    };
  }, []);

  const navigate = useCallback((module: string, patientId?: string | null) => {
    navigateTo(moduleToPath(module, patientId));
  }, []);

  return { route, navigate };
}
