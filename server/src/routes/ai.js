// Mode "Tanya AI" — pertanyaan bebas ke model AI eksternal, KHUSUS admin.
//
// Keamanan & desain:
// - Hanya peran admin klinik yang boleh memakai (403 untuk peran lain) —
//   ditegakkan di server, bukan hanya menu disembunyikan.
// - API key TIDAK PERNAH berada di browser: admin mengisinya di Pengaturan →
//   Integrasi, tersimpan terenkripsi di brankas server (provider 'ai'), dan
//   server yang meneruskan pertanyaan ke penyedia.
// - Penyedia bersifat OpenAI-compatible (POST {baseUrl}/chat/completions):
//   OpenAI, OpenRouter, AtmoRouter, Gemini (endpoint kompatibel), dsb.
//   baseUrl & model dapat diatur per klinik; bawaan OpenAI + gpt-4o-mini.
// - Rate limit sederhana per klinik: 20 pertanyaan/menit.
import { loadCredentials } from './integrations.js';

const rateBuckets = new Map(); // clinicId -> number[] (timestamp ms)

function rateLimited(clinicId) {
  const now = Date.now();
  const arr = (rateBuckets.get(clinicId) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  rateBuckets.set(clinicId, arr);
  return arr.length > 20;
}

const SYSTEM_PROMPT = [
  'Kamu adalah asisten AI serbaguna untuk administrator sebuah klinik di Indonesia,',
  'di dalam aplikasi rekam medis elektronik RekamMedis.',
  'Jawablah pertanyaan apa pun dengan jelas, ringkas, dan praktis, dalam bahasa yang sama',
  'dengan pertanyaan pengguna (umumnya Bahasa Indonesia).',
  'Kamu boleh membantu hal klinis umum, administrasi, surat-menyurat, regulasi, teknologi,',
  'dan pertanyaan pengetahuan umum. Untuk hal klinis, jawabanmu adalah bahan pertimbangan',
  'profesional — bukan pengganti penilaian dokter yang menangani pasien.'
].join(' ');

export function registerAiRoutes(router, ctx) {
  router.post('/api/ai/ask', async (req, res, body) => {
    if (req.authUser.role !== 'admin') {
      return res.json(403, { error: 'Mode Tanya AI hanya tersedia untuk administrator klinik.' });
    }
    const question = String(body?.question || '').trim();
    if (!question) return res.json(400, { error: 'Pertanyaan tidak boleh kosong.' });
    if (question.length > 4000) return res.json(400, { error: 'Pertanyaan terlalu panjang (maksimal 4000 karakter).' });
    if (rateLimited(req.authUser.clinic_id)) {
      return res.json(429, { error: 'Terlalu banyak pertanyaan dalam waktu singkat. Tunggu sebentar lalu coba lagi.' });
    }

    const creds = loadCredentials(ctx, req.authUser.clinic_id, 'ai');
    if (!creds?.apiKey) {
      return res.json(400, {
        error: 'API key AI belum diatur. Isi API key penyedia AI di Pengaturan → Pengaturan AI (tersimpan terenkripsi di server) terlebih dahulu.',
        code: 'AI_NOT_CONFIGURED'
      });
    }
    const baseUrl = String(creds.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const model = String(creds.model || 'gpt-4o-mini');

    const history = Array.isArray(body?.history)
      ? body.history
          .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
      : [];

    let upstream;
    try {
      upstream = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${creds.apiKey}`
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: question }
          ]
        }),
        signal: AbortSignal.timeout(60_000)
      });
    } catch (err) {
      return res.json(502, { error: `Tidak dapat menghubungi penyedia AI: ${String(err.message || err).slice(0, 200)}` });
    }

    let data = null;
    try { data = await upstream.json(); } catch { /* respons bukan JSON */ }
    if (!upstream.ok) {
      const detail = data?.error?.message || data?.error || `HTTP ${upstream.status}`;
      return res.json(502, { error: `Penyedia AI menolak permintaan: ${String(detail).slice(0, 300)}` });
    }
    const answer = data?.choices?.[0]?.message?.content;
    if (!answer) return res.json(502, { error: 'Penyedia AI tidak mengembalikan jawaban yang dapat dibaca.' });
    return res.json(200, { answer, model });
  }, { auth: true });
}
