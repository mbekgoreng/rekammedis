import React, { useEffect, useState } from 'react';
import { BadgeCheck, CreditCard, Clock3 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { apiFetch } from '../../lib/api';
import { syncActiveFor } from '../../lib/sync';

// Panel Langganan (mode server): status paket klinik, perpanjangan, dan
// riwayat pembayaran platform. Pada mode lokal panel ini menjelaskan bahwa
// langganan dikelola lewat server.

interface BillingData {
  subscription: { plan: string; status: string; expired: boolean; trialEndsAt?: string | null; currentPeriodEnd?: string | null };
  plans: Record<string, { name: string; monthly: number; normalMonthly?: number; discountPercent?: number; features: string[] }>;
  gatewayConfigured: boolean;
  payments: { id: string; plan: string; months: number; amount: number; status: string; gateway?: string; created_at: string }[];
}

const rp = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

export const SubscriptionPanel: React.FC = () => {
  const { clinicId } = useStore();
  const active = syncActiveFor(clinicId);
  const [data, setData] = useState<BillingData | null>(null);
  const [months, setMonths] = useState(1);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: d } = await apiFetch<BillingData>('/api/billing');
    setData(d);
  };
  useEffect(() => { if (active) void load(); }, [active]);

  if (!active) {
    return (
      <div className="flex gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
        <Clock3 className="w-5 h-5 shrink-0 text-slate-400" />
        <p className="text-xs leading-relaxed">
          Langganan dikelola oleh <strong>server RekamMedis</strong>. Aplikasi ini sedang berjalan dalam mode lokal
          (demo di perangkat), sehingga belum ada langganan yang berjalan. Saat klinik Anda terhubung ke server,
          status paket, masa trial, dan perpanjangan akan tampil di sini.
        </p>
      </div>
    );
  }

  const checkout = async (plan: string) => {
    setBusy(true); setNote(null);
    const { status, data: d } = await apiFetch<{ mode?: string; redirectUrl?: string; instructions?: string; paymentCode?: string; amount?: number; error?: string }>(
      '/api/billing/checkout', { method: 'POST', body: { plan, months } }
    );
    setBusy(false);
    if (status !== 201) { setNote(d.error || 'Checkout gagal.'); return; }
    if (d.mode === 'midtrans' && d.redirectUrl) {
      window.open(d.redirectUrl, '_blank', 'noopener');
      setNote('Halaman pembayaran dibuka di tab baru. Status langganan diperbarui otomatis setelah pembayaran berhasil.');
    } else {
      setNote(`${d.instructions || ''} Kode pembayaran: ${d.paymentCode} — jumlah ${rp(d.amount || 0)}.`);
    }
    void load();
  };

  const sub = data?.subscription;
  return (
    <div className="space-y-5">
      <div className="flex gap-3 p-4 bg-clinical-50 border border-clinical-100 rounded-xl">
        <BadgeCheck className="w-5 h-5 shrink-0 text-clinical-600" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <p className="font-bold text-slate-800">
            Status: {sub ? (sub.expired ? 'BERAKHIR — perpanjang untuk melanjutkan pencatatan ke server' : sub.status === 'trialing' ? `Masa trial sampai ${sub.trialEndsAt?.slice(0, 10)}${sub.trialEndsAt ? ` (sisa ${Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86400000))} hari)` : ''}` : `Paket ${sub.plan.toUpperCase()} aktif sampai ${sub.currentPeriodEnd?.slice(0, 10)}`) : 'Memuat…'}
          </p>
          <p>Data klinik Anda tetap aman tersimpan meski langganan berakhir; penulisan data baru ke server dijeda sampai perpanjangan aktif.</p>
        </div>
      </div>
      {note && <p className="text-xs font-semibold text-slate-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{note}</p>}

      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-600">Durasi:</label>
        <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white">
          <option value={1}>1 bulan</option><option value={3}>3 bulan</option>
          <option value={6}>6 bulan</option><option value={12}>12 bulan</option>
        </select>
        <span className="text-[11px] text-slate-400">{data?.gatewayConfigured ? 'Pembayaran online (Midtrans) aktif.' : 'Gateway online belum aktif — konfirmasi manual oleh admin platform.'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data && Object.entries(data.plans).map(([key, plan]) => (
          <div key={key} className="border border-slate-200 rounded-xl p-4">
            <p className="text-sm font-extrabold text-slate-800">{plan.name}</p>
            {plan.normalMonthly && plan.normalMonthly > plan.monthly && (
              <p className="text-[11px] font-bold text-emerald-700 mt-1">DISKON {plan.discountPercent || 50}% <span className="text-slate-400 line-through font-semibold">{rp(plan.normalMonthly * months)}</span></p>
            )}
            <p className="text-xl font-black text-clinical-700 mt-1">{rp(plan.monthly * months)}<span className="text-[11px] text-slate-400 font-semibold"> / {months} bulan</span></p>
            <ul className="text-[11px] text-slate-500 mt-2 space-y-1">
              {plan.features.map((f) => <li key={f}>• {f}</li>)}
            </ul>
            <button disabled={busy} onClick={() => void checkout(key)} className="mt-3 px-3 py-2 bg-clinical-600 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> {sub?.plan === key && sub?.status === 'active' ? 'Perpanjang' : 'Pilih Paket Ini'}
            </button>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-bold text-slate-700 mb-2">Riwayat Pembayaran</p>
        {data && data.payments.length === 0 && <p className="text-[11px] text-slate-400">Belum ada pembayaran tercatat.</p>}
        <div className="space-y-1.5">
          {data?.payments.map((p) => (
            <div key={p.id} className="flex justify-between text-[11px] border border-slate-100 rounded-lg px-3 py-2 bg-white">
              <span>{p.created_at.slice(0, 10)} — {p.plan} × {p.months} bln ({p.gateway || 'manual'})</span>
              <span className="font-bold">{rp(p.amount)} • {p.status === 'paid' ? 'LUNAS' : p.status === 'awaiting_confirmation' ? 'MENUNGGU KONFIRMASI' : p.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
