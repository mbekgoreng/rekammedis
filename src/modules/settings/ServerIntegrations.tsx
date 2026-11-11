import React, { useEffect, useState } from 'react';
import { ShieldCheck, PlugZap, SearchCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { apiFetch } from '../../lib/api';
import { syncActiveFor } from '../../lib/sync';

// Kredensial integrasi MODE SERVER: disimpan terenkripsi di brankas server
// (AES-256-GCM) dan tidak pernah kembali ke browser. Komponen ini hanya
// tampil bila aplikasi berjalan dalam mode server; pada mode lokal, tab
// Integrasi memakai kolom konfigurasi biasa.

interface ProviderStatus { configured: boolean; environment?: string; filledFields?: string[] }

const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-clinical-500';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';

export const ServerIntegrations: React.FC = () => {
  const { clinicId, currentUser } = useStore();
  const active = syncActiveFor(clinicId);
  const [status, setStatus] = useState<Record<string, ProviderStatus>>({});
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [kartu, setKartu] = useState('');
  const [pesertaResult, setPesertaResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadStatus = async () => {
    const { data } = await apiFetch<{ providers: Record<string, ProviderStatus> }>('/api/integrations/credentials');
    setStatus(data.providers || {});
  };
  useEffect(() => { if (active) void loadStatus(); }, [active]);

  if (!active) return null;
  const isAdmin = currentUser.role === 'admin';
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (provider: 'satusehat' | 'pcare', fields: string[]) => {
    setBusy(true); setMsg(null);
    const body: Record<string, string> = {};
    for (const f of fields) if (form[`${provider}.${f}`]) body[f] = form[`${provider}.${f}`];
    if (form[`${provider}.environment`]) body.environment = form[`${provider}.environment`];
    const { status: code, data } = await apiFetch<{ error?: string }>(`/api/integrations/credentials/${provider}`, { method: 'PUT', body });
    setBusy(false);
    const label = provider === 'satusehat' ? 'SATUSEHAT' : 'P-Care';
    setMsg(code === 200 ? `Kredensial ${label} tersimpan terenkripsi di server.` : data.error || 'Gagal menyimpan.');
    if (code === 200) void loadStatus();
  };

  const testSatusehat = async () => {
    setBusy(true); setTestResult(null);
    const { data } = await apiFetch<{ connected?: boolean; note?: string; error?: string }>('/api/integrations/satusehat/test', { method: 'POST', body: {} });
    setBusy(false);
    setTestResult(data.connected ? `Terhubung (${data.note || 'token diterima'})` : `Belum terhubung: ${data.error || 'tidak ada respons'}`);
  };

  const cekPeserta = async () => {
    if (!kartu.trim()) return;
    setBusy(true); setPesertaResult(null);
    const { data } = await apiFetch<{ ok?: boolean; result?: unknown; error?: string }>('/api/integrations/pcare/cek-peserta', {
      method: 'POST', body: { noKartu: kartu.trim() }
    });
    setBusy(false);
    setPesertaResult(data.ok ? JSON.stringify(data.result, null, 2).slice(0, 1200) : `Gagal: ${data.error || 'tidak ada respons'}`);
  };

  const badge = (p: string) => status[p]?.configured
    ? <span className="text-emerald-700 font-bold">TERSIMPAN DI SERVER ({status[p]?.environment})</span>
    : <span className="text-amber-700 font-bold">BELUM DIISI</span>;

  return (
    <div className="space-y-4 mb-6">
      <div className="flex gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
        <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
        <p className="text-xs leading-relaxed">
          <strong>Mode Server aktif.</strong> Kredensial di bagian ini disimpan <strong>terenkripsi di server</strong> dan
          dipakai server untuk bridging — tidak tersimpan di browser dan tidak ditampilkan kembali.
          Kolom konfigurasi lokal di bawah bagian ini tidak lagi dipakai untuk kredensial mode server.
        </p>
      </div>
      {msg && <p className="text-xs font-semibold text-clinical-700 bg-clinical-50 border border-clinical-100 rounded-lg px-3 py-2">{msg}</p>}

      <div className="border border-slate-200 rounded-xl p-4 space-y-3">
        <p className="text-xs font-bold text-slate-700 flex items-center gap-2"><PlugZap className="w-4 h-4 text-clinical-600" /> SATUSEHAT — Status: {badge('satusehat')}</p>
        {isAdmin ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={labelCls}>Client ID</label><input className={inputCls} value={form['satusehat.clientId'] || ''} onChange={set('satusehat.clientId')} placeholder="Client ID dari SATUSEHAT" /></div>
            <div><label className={labelCls}>Client Secret</label><input type="password" className={inputCls} value={form['satusehat.clientSecret'] || ''} onChange={set('satusehat.clientSecret')} placeholder="Client Secret" /></div>
            <div><label className={labelCls}>Organization ID (ID SATUSEHAT faskes)</label><input className={inputCls} value={form['satusehat.organizationId'] || ''} onChange={set('satusehat.organizationId')} placeholder="1000xxxxx" /></div>
            <div><label className={labelCls}>Environment</label>
              <select className={inputCls} value={form['satusehat.environment'] || 'sandbox'} onChange={set('satusehat.environment')}>
                <option value="sandbox">Sandbox (uji coba)</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>
        ) : <p className="text-[11px] text-slate-500">Hanya administrator klinik yang dapat mengubah kredensial.</p>}
        <div className="flex gap-2">
          {isAdmin && <button disabled={busy} onClick={() => void save('satusehat', ['clientId', 'clientSecret', 'organizationId'])} className="px-3 py-2 bg-clinical-600 text-white rounded-lg text-xs font-bold disabled:opacity-50">Simpan ke Server</button>}
          <button disabled={busy} onClick={() => void testSatusehat()} className="px-3 py-2 border border-slate-300 bg-white rounded-lg text-xs font-bold text-slate-600 disabled:opacity-50">Uji Koneksi</button>
        </div>
        {testResult && <p className="text-[11px] text-slate-600 whitespace-pre-wrap">{testResult}</p>}
      </div>

      <div className="border border-slate-200 rounded-xl p-4 space-y-3">
        <p className="text-xs font-bold text-slate-700 flex items-center gap-2"><PlugZap className="w-4 h-4 text-clinical-600" /> P-Care BPJS — Status: {badge('pcare')}</p>
        {isAdmin ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={labelCls}>Cons ID</label><input className={inputCls} value={form['pcare.consId'] || ''} onChange={set('pcare.consId')} placeholder="Cons ID bridging" /></div>
            <div><label className={labelCls}>Secret Key</label><input type="password" className={inputCls} value={form['pcare.secretKey'] || ''} onChange={set('pcare.secretKey')} placeholder="Secret key" /></div>
            <div><label className={labelCls}>Username P-Care</label><input className={inputCls} value={form['pcare.username'] || ''} onChange={set('pcare.username')} /></div>
            <div><label className={labelCls}>Password P-Care</label><input type="password" className={inputCls} value={form['pcare.password'] || ''} onChange={set('pcare.password')} /></div>
            <div><label className={labelCls}>Kode Aplikasi (kdAplikasi)</label><input className={inputCls} value={form['pcare.kdAplikasi'] || ''} onChange={set('pcare.kdAplikasi')} placeholder="095" /></div>
            <div><label className={labelCls}>Environment</label>
              <select className={inputCls} value={form['pcare.environment'] || 'sandbox'} onChange={set('pcare.environment')}>
                <option value="sandbox">Sandbox (uji coba)</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>
        ) : <p className="text-[11px] text-slate-500">Hanya administrator klinik yang dapat mengubah kredensial.</p>}
        {isAdmin && <button disabled={busy} onClick={() => void save('pcare', ['consId', 'secretKey', 'username', 'password', 'kdAplikasi', 'userKey'])} className="px-3 py-2 bg-clinical-600 text-white rounded-lg text-xs font-bold disabled:opacity-50">Simpan ke Server</button>}
        <div className="flex gap-2 items-end">
          <div className="flex-1"><label className={labelCls}>Cek Kepesertaan — Nomor Kartu BPJS</label>
            <input className={inputCls} value={kartu} onChange={(e) => setKartu(e.target.value)} placeholder="0002xxxxxxxxx" /></div>
          <button disabled={busy || !status.pcare?.configured} onClick={() => void cekPeserta()} className="px-3 py-2 border border-slate-300 bg-white rounded-lg text-xs font-bold text-slate-600 disabled:opacity-50 flex items-center gap-1.5">
            <SearchCheck className="w-4 h-4" /> Cek via P-Care
          </button>
        </div>
        {pesertaResult && <pre className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{pesertaResult}</pre>}
      </div>

    </div>
  );
};
