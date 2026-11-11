import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Trash2, ShieldAlert, KeyRound } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { apiFetch } from '../../lib/api';
import { syncActiveFor } from '../../lib/sync';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

// Mode "Tanya AI" — KHUSUS ADMIN (RBAC: permissions.ts membatasi modul ini
// ke peran admin, dan server menegakkan hal yang sama di /api/ai/ask).
//
// Pertanyaan diteruskan server ke penyedia AI eksternal (OpenAI-compatible)
// memakai API key milik klinik yang tersimpan TERENKRIPSI di brankas server
// (Pengaturan → Integrasi). API key tidak pernah berada di browser.
// Percakapan hanya hidup di sesi halaman ini — tidak disimpan sebagai data
// klinik, dan halaman ini TIDAK mengirim data pasien apa pun ke penyedia AI.

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Jelaskan perbedaan kode ICD-10 J06.9 dan J00 dengan contoh kasusnya',
  'Buatkan draf pengumuman jam layanan klinik selama bulan Ramadan',
  'Apa saja syarat akreditasi klinik pratama yang paling sering jadi temuan?',
  'Ide konten media sosial klinik untuk sebulan, bertema kesehatan preventif',
  'Ringkas aturan retensi rekam medis menurut Permenkes 24/2022'
];

export const AiAssistantView: React.FC = () => {
  const { clinicId, currentUser } = useStore();
  const serverMode = syncActiveFor(clinicId);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [model, setModel] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!serverMode) return;
    void apiFetch<{ providers: Record<string, { configured: boolean }> }>('/api/integrations/credentials')
      .then(({ data }) => setConfigured(!!data.providers?.ai?.configured))
      .catch(() => setConfigured(false));
  }, [serverMode]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const ask = async (raw?: string) => {
    const question = (raw ?? input).trim();
    if (!question || busy) return;
    setError(null);
    setInput('');
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

  if (!serverMode) {
    return (
      <Card title="Tanya AI — Khusus Admin" subtitle="Asisten AI serbaguna dengan API key penyedia eksternal">
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
          <div className="text-xs leading-relaxed space-y-2">
            <p>
              <strong>Mode Tanya AI memerlukan mode server.</strong> Aplikasi saat ini berjalan dalam mode lokal (demo),
              sehingga pertanyaan tidak dapat diteruskan ke penyedia AI — API key tidak boleh disimpan di browser.
            </p>
            <p>
              Setelah backend RekamMedis aktif di server klinik, administrator mengisi API key penyedia AI
              (OpenAI / OpenRouter / AtmoRouter / penyedia OpenAI-compatible lainnya) di
              <strong> Pengaturan → Integrasi</strong>, dan menu ini langsung dapat dipakai — hanya oleh admin.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-clinical-600" /> Tanya AI — Khusus Admin
          </span>
        }
        subtitle={
          configured
            ? `Terhubung ke penyedia AI eksternal${model ? ` • model terakhir: ${model}` : ''} • API key tersimpan terenkripsi di server`
            : 'Tanyakan apa saja: klinis umum, administrasi, regulasi, surat-menyurat, hingga pengetahuan umum'
        }
      >
        {configured === false && (
          <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 mb-4">
            <KeyRound className="w-5 h-5 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed">
              <strong>API key AI belum diatur.</strong> Isi API key penyedia AI Anda di
              <strong> Pengaturan → Integrasi → AI (Tanya AI)</strong> — key tersimpan terenkripsi di server dan
              tidak pernah ditampilkan kembali. Setelah terisi, Anda dapat langsung bertanya di sini.
            </p>
          </div>
        )}

        <div ref={scrollRef} className="h-[46vh] overflow-y-auto space-y-3 pr-1 mb-4">
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-3">
              <p className="text-xs text-slate-500">Belum ada percakapan. Contoh pertanyaan:</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={configured === false}
                    onClick={() => void ask(s)}
                    className="text-[11px] px-3 py-1.5 rounded-full border border-slate-300 bg-white hover:border-clinical-500 hover:text-clinical-700 font-semibold text-slate-600 disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-clinical-600 text-white rounded-br-md'
                    : 'bg-slate-100 text-slate-800 rounded-bl-md border border-slate-200'
                }`}
              >
                {m.role === 'assistant' && <span className="block text-[10px] font-black text-clinical-700 mb-1">AI</span>}
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-slate-100 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-clinical-600 animate-spin" />
                AI sedang menjawab…
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>
        )}

        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void ask();
              }
            }}
            rows={2}
            maxLength={4000}
            placeholder={`Tanya apa saja, ${currentUser.name.split(' ')[0]}… (Enter untuk mengirim, Shift+Enter baris baru)`}
            className="flex-1 text-xs bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinical-500 resize-none"
          />
          <Button variant="primary" size="sm" disabled={busy || !input.trim() || configured === false} onClick={() => void ask()} leftIcon={<Send className="w-3.5 h-3.5" />}>
            Kirim
          </Button>
          {messages.length > 0 && (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => { setMessages([]); setError(null); }} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
              Bersihkan
            </Button>
          )}
        </div>
        <p className="text-[10px] text-slate-400 mt-2">
          Percakapan tidak disimpan sebagai data klinik dan tidak memuat data pasien. Jawaban AI adalah bahan
          pertimbangan — verifikasi hal klinis & regulasi pada sumber resminya.
        </p>
      </Card>
    </div>
  );
};
