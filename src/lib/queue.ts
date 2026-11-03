import type { QueueItem } from '../types';

// Urutan pemanggilan antrean: Darurat/Cito lebih dulu, lalu Lansia/Disabilitas,
// lalu Biasa — di dalam kelompok yang sama, siapa mendaftar lebih awal dipanggil dulu.
const PRIORITY_RANK: Record<QueueItem['priority'], number> = {
  'Darurat / Cito': 0,
  'Lansia/Disabilitas': 1,
  Biasa: 2
};

export function sortByPriority(list: QueueItem[]): QueueItem[] {
  return [...list].sort(
    (a, b) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      a.registeredTime.localeCompare(b.registeredTime)
  );
}
