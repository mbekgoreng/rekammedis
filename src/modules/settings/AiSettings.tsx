import React, { useEffect, useState } from 'react';
import { Sparkles, ShieldCheck, KeyRound } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { apiFetch } from '../../lib/api';
import { syncActiveFor } from '../../lib/sync';
import { Card } from '../../components/common/Card';

// Pengaturan AI — konfigurasi mode "Tanya AI" khusus admin, TERPISAH dari
// tab Integrasi (keputusan owner). API key penyedia eksternal disimpan
// TERENKRIPSI di brankas server (provider 'ai') dan tidak pernah kembali
// ke browser; yang tampil di sini hanya status terisi/belum.

const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-clinical-500';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';

export const AiSettings: React.FC = () => {
  const { clinicId } = useStore();
  const active = syncActiveFor(clinicId);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [filled, setFilled] = useState<string[]>([]);
  const [form, setForm] = useState({ apiKey: '', baseUrl: '', model: '' });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await apiFetch<{ providers: Record<string, { configured: boolean; filledFields?: string[] }> }>('/api/integrations/credentials');
    const ai = data.providers?.ai;
    setConfigured(!!ai?.configured);
    setFilled(ai?.filledFields || []);
  };
  useEffect(() => { if (active) void load(); }, [active]);

  const save = async () => {
    setBusy(true); setMsg(null);
    const body: Record<string, string> = {};
    if (form.apiKey) body.apiKey = form.apiKey;
    if (form.baseUrl) body.baseUrl = form.baseUrl;
    if (form.model) body.model = form.model;
    if (Object.keys(body).length === 0) { setBusy(false); setMsg('Tidak ada perubahan untuk disimpan.'); return; }
    const { status, data } = await apiFetch<{ error?: string }>('/api/integrations/credentials/ai', { method: 'PUT', body });
    setBusy(false);
    if (status === 200) {
      setMsg('Pengaturan AI tersimpan terenkripsi di server. Menu Tanya AI siap dipakai admin.');
      setForm({ apiKey: '', baseUrl: '', model: '' });
      void load();
    } else {
      setMsg(data.error || 'Gagal menyimpan pengaturan AI.');
    }
  };

  return (
    <Card
      title={<span className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-clinical-600" /> Pengaturan AI — Tanya AI</span>}
      subtitle="API key penyedia AI eksternal untuk menu Tanya AI (khusus admin). Terpisah dari integrasi SATUSEHAT/BPJS."
    >
      {!active ? (
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
          <ShieldCheck className="w-5 h-5 shrink-0 text-amber-600" />
          <div className="text-xs leading-relaxed space-y-2">
            <p>
              <strong>Pengaturan AI aktif pada mode server.</strong> Aplikasi saat ini berjalan dalam mode lokal (demo),
              jadi belum ada tempat aman untuk menyimpan API key — key tidak pernah disimpan di browser.
            </p>
            <p>
              Setelah backend RekamMedis berjalan di server klinik, formulir di halaman ini menyimpan API key
              <strong> terenkripsi di brankas server</strong>, dan menu <strong>Tanya AI</strong> langsung dapat
              dipakai oleh administrator.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
            <KeyRound className="w-5 h-5 shrink-0 text-emerald-600" />
            <p className="text-xs leading-relaxed">
              Status API key:{' '}
              <strong>{configured ? 'TERSIMPAN DI SERVER' : 'BELUM DIISI'}</strong>
              {configured && filled.length > 0 && <> — kolom terisi: {filled.join(', ')}</>}. Key dipakai server untuk
              meneruskan pertanyaan admin ke penyedia AI; tidak ditampilkan kembali setelah disimpan. Mengisi kolom
              yang sudah ada akan menimpa nilai lamanya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>API Key Penyedia AI</label>
              <input type="password" className={inputCls} value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="sk-..." autoComplete="off" />
            </div>
            <div>
              <label className={labelCls}>Model</label>
              <input className={inputCls} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="gpt-4o-mini (bawaan bila kosong)" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Base URL — endpoint OpenAI-compatible</label>
              <input className={inputCls} value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://api.openai.com/v1 (bawaan bila kosong)" />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Mendukung penyedia <strong>OpenAI-compatible</strong>: OpenAI, OpenRouter, AtmoRouter, Gemini
            (endpoint kompatibel), dan sejenisnya — sesuaikan Base URL &amp; Model dengan penyedia Anda.
            Hanya administrator yang dapat mengubah pengaturan ini dan memakai menu Tanya AI.
          </p>

          {msg && <p className="text-xs font-semibold text-clinical-700 bg-clinical-50 border border-clinical-100 rounded-lg px-3 py-2">{msg}</p>}
          <div className="flex justify-end">
            <button disabled={busy} onClick={() => void save()} className="px-4 py-2 bg-clinical-600 text-white rounded-lg text-xs font-bold disabled:opacity-50">
              {busy ? 'Menyimpan…' : 'Simpan Pengaturan AI'}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};
