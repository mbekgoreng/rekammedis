import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles, SendHorizonal, Plus, Settings2, Copy, Check,
  ShieldAlert, KeyRound, Stethoscope, FileText, Megaphone, Lightbulb
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { apiFetch } from '../../lib/api';
import { syncActiveFor } from '../../lib/sync';
import { navigateTo, moduleToPath } from '../../lib/router';

// Mode "Tanya AI" — KHUSUS ADMIN. Antarmuka meniru pola Gemini: sapaan
// gradien besar, kartu saran, jawaban AI tampil polos dengan ikon kilau
// (bukan balon), pesan pengguna sebagai balon lembut di kanan, dan bilah
// input berbentuk pil melayang di bawah.
//
// Pertanyaan diteruskan server ke penyedia AI eksternal memakai API key
// klinik dari Pengaturan AI (terenkripsi di brankas server) — key tidak
// pernah berada di browser. Percakapan hanya hidup di sesi halaman ini.

interface ChatMessage { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS: { icon: React.ReactNode; text: string }[] = [
  { icon: <Stethoscope className="w-4 h-4" />, text: 'Jelaskan perbedaan kode ICD-10 J06.9 dan J00 dengan contoh kasusnya' },
  { icon: <FileText className="w-4 h-4" />, text: 'Buatkan draf pengumuman jam layanan klinik selama bulan Ramadan' },
  { icon: <ShieldAlert className="w-4 h-4" />, text: 'Ringkas aturan retensi rekam medis menurut Permenkes 24/2022' },
  { icon: <Megaphone className="w-4 h-4" />, text: 'Ide konten media sosial klinik sebulan bertema kesehatan preventif' }
];

/** Perender teks jawaban sederhana & aman: **tebal**, `kode`, daftar "- ". */
function renderRich(text: string): React.ReactNode {
  const inline = (s: string, keyBase: string): React.ReactNode[] => {
    const parts = s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**')) return <strong key={keyBase + i}>{p.slice(2, -2)}</strong>;
      if (p.startsWith('`') && p.endsWith('`')) return <code key={keyBase + i} className="bg-slate-200/70 px-1 rounded text-[0.92em]">{p.slice(1, -1)}</code>;
      return <React.Fragment key={keyBase + i}>{p}</React.Fragment>;
    });
  };
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = (k: number) => {
    if (list.length) {
      out.push(
        <ul key={'ul' + k} className="list-disc pl-5 space-y-1 my-1.5">
          {list.map((li, j) => <li key={j}>{inline(li, 'li' + k + '-' + j)}</li>)}
        </ul>
      );
      list = [];
    }
  };
  lines.forEach((line, i) => {
    const t = line.trim();
    if (/^[-*•]\s+/.test(t)) { list.push(t.replace(/^[-*•]\s+/, '')); return; }
    flush(i);
    if (t === '') { out.push(<div key={'sp' + i} className="h-2" />); return; }
    if (/^#{1,3}\s+/.test(t)) {
      out.push(<p key={'h' + i} className="font-bold mt-2">{inline(t.replace(/^#{1,3}\s+/, ''), 'h' + i)}</p>);
      return;
    }
    out.push(<p key={'p' + i}>{inline(line, 'p' + i)}</p>);
  });
  flush(lines.length);
  return out;
}

export const AiAssistantView: React.FC = () => {
  const { clinicId, currentUser } = useStore();
  const serverMode = syncActiveFor(clinicId);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [model, setModel] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!serverMode) return;
    void apiFetch<{ providers: Record<string, { configured: boolean }> }>('/api/integrations/credentials')
      .then(({ data }) => setConfigured(!!data.providers?.ai?.configured))
      .catch(() => setConfigured(false));
  }, [serverMode]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const goAiSettings = () => {
    try { window.sessionStorage.setItem('rm-settings-tab', 'ai'); } catch { /* abaikan */ }
    navigateTo(moduleToPath('settings'));
  };

  const ask = async (raw?: string) => {
    const question = (raw ?? input).trim();
    if (!question || busy || configured === false) return;
    setError(null);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    const history = messages.slice(-10);
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setBusy(true);
    const { status, data } = await apiFetch<{ answer?: string; model?: string; error?: string }>('/api/ai/ask', {
      method: 'POST',
      body: { question, history }
    });
    setBusy(false);
    if (status === 200 && data.answer) {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer as string }]);
      if (data.model) setModel(data.model);
    } else {
      setError(data.error || 'Pertanyaan gagal diproses. Coba lagi.');
    }
  };

  const copyMsg = async (idx: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(idx);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* clipboard tidak tersedia */ }
  };

  const firstName = currentUser.name.split(' ')[0];

  return (
    <div className="flex flex-col h-[calc(100vh-9.5rem)] max-w-3xl mx-auto w-full">
      {/* Kepala halaman */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 via-violet-500 to-rose-400 flex items-center justify-center shadow">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-800 leading-tight">Tanya AI</p>
            <p className="text-[11px] text-slate-500 leading-tight">
              Khusus admin{model ? ` • ${model}` : ''}{configured ? ' • terhubung ke penyedia AI' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => { setMessages([]); setError(null); }}
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full px-3 py-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Chat baru
            </button>
          )}
          <button
            type="button"
            onClick={goAiSettings}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full px-3 py-1.5"
          >
            <Settings2 className="w-3.5 h-3.5" /> Pengaturan AI
          </button>
        </div>
      </div>

      {/* Badan percakapan */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 pb-4">
        {!serverMode ? (
          <div className="mt-10 flex gap-3 p-5 bg-amber-50 border border-amber-200 rounded-3xl text-amber-900">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-2">
              <p>
                <strong>Mode Tanya AI memerlukan mode server.</strong> Aplikasi saat ini berjalan dalam mode lokal
                (demo), sehingga pertanyaan tidak dapat diteruskan ke penyedia AI — API key tidak boleh disimpan
                di browser.
              </p>
              <p>
                Setelah backend RekamMedis aktif di server klinik, isi API key penyedia AI di
                <strong> Pengaturan → Pengaturan AI</strong>, dan halaman ini langsung dapat dipakai — hanya oleh admin.
              </p>
              <button type="button" onClick={goAiSettings} className="mt-1 px-3.5 py-2 rounded-full bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700">
                Buka Pengaturan AI
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="pt-10 sm:pt-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.15]">
              <span className="bg-gradient-to-r from-sky-500 via-violet-500 to-rose-500 bg-clip-text text-transparent">
                Halo, {firstName}
              </span>
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-400 mt-2">Ada yang bisa saya bantu hari ini?</p>

            {configured === false && (
              <div className="mt-8 flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-3xl text-amber-900 max-w-xl">
                <KeyRound className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p>
                    <strong>API key AI belum diatur.</strong> Isi API key penyedia AI Anda di Pengaturan AI —
                    key tersimpan terenkripsi di server dan tidak pernah ditampilkan kembali.
                  </p>
                  <button type="button" onClick={goAiSettings} className="mt-2 px-3.5 py-2 rounded-full bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700">
                    Buka Pengaturan AI
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 max-w-2xl">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  disabled={configured === false}
                  onClick={() => void ask(s.text)}
                  className="group text-left bg-slate-100 hover:bg-slate-200/80 rounded-3xl p-4 h-28 flex flex-col justify-between transition disabled:opacity-40"
                >
                  <span className="text-[13px] font-medium text-slate-700 leading-snug">{s.text}</span>
                  <span className="self-end w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-500 group-hover:text-violet-600 shadow-sm">
                    {s.icon}
                  </span>
                </button>
              ))}
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-8">
              <Lightbulb className="w-3.5 h-3.5" />
              Tanyakan apa saja — klinis umum, administrasi, regulasi, surat-menyurat, hingga pengetahuan umum.
            </p>
          </div>
        ) : (
          <div className="space-y-7 pt-2">
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] bg-[#e9eef6] text-slate-800 rounded-3xl rounded-br-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex gap-3">
                  <span className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-sky-400 via-violet-500 to-rose-400 flex items-center justify-center mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm leading-relaxed text-slate-800 space-y-1">{renderRich(m.content)}</div>
                    <button
                      type="button"
                      onClick={() => void copyMsg(i, m.content)}
                      className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600"
                    >
                      {copied === i ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === i ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                </div>
              )
            )}
            {busy && (
              <div className="flex gap-3 items-center">
                <span className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-sky-400 via-violet-500 to-rose-400 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </span>
                <div className="flex items-center gap-1.5" aria-label="AI sedang menjawab">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-slate-400 ml-1.5 font-medium">Sedang menjawab…</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bilah input pil */}
      {serverMode && (
        <div className="pt-2">
          {error && (
            <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5 mb-3">{error}</p>
          )}
          <div className="flex items-end gap-2 bg-white border border-slate-200 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.25)] rounded-[28px] pl-5 pr-2 py-2 focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-100 transition">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void ask();
                }
              }}
              rows={1}
              maxLength={4000}
              placeholder="Tanya apa saja…"
              className="flex-1 text-sm bg-transparent py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-[140px]"
            />
            <button
              type="button"
              disabled={busy || !input.trim() || configured === false}
              onClick={() => void ask()}
              aria-label="Kirim pertanyaan"
              className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-sky-500 via-violet-500 to-rose-500 text-white flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition shadow"
            >
              <SendHorizonal className="w-4.5 h-4.5" />
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-2.5 px-4">
            Tanya AI dapat membuat kesalahan — periksa kembali hal penting. Percakapan tidak disimpan sebagai data
            klinik dan tidak memuat data pasien.
          </p>
        </div>
      )}
    </div>
  );
};
