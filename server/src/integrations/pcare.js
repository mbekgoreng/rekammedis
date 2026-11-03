// Klien bridging P-Care BPJS Kesehatan.
// Autentikasi per spesifikasi bridging BPJS: header X-Cons-ID, X-Timestamp,
// X-Signature = base64(HMAC-SHA256(consId & timestamp, secretKey)), dan
// Authorization Basic (username:password:kdAplikasi). Kredensial diterbitkan
// BPJS per faskes dan disimpan terenkripsi di brankas server.
//
// Catatan kejujuran implementasi: endpoint peserta di environment production
// mengembalikan payload terenkripsi (AES-256-CBC + LZ-string) — dekripsi
// diterapkan sesuai skema yang terdokumentasi (kunci diturunkan dari
// consId+secretKey+timestamp). Tanpa kredensial resmi faskes, jalur ini tidak
// dapat diuji ujung-ke-ujung di sini; environment sandbox/dev umumnya
// mengembalikan JSON biasa dan ditangani lebih dulu.
import crypto from 'node:crypto';

const BASES = {
  sandbox: 'https://apijkn-dev.bpjs-kesehatan.go.id/pcare-rest-dev',
  production: 'https://apijkn.bpjs-kesehatan.go.id/pcare-rest'
};

export function buildHeaders(creds) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac('sha256', creds.secretKey)
    .update(`${creds.consId}&${timestamp}`)
    .digest('base64');
  const basic = Buffer.from(`${creds.username}:${creds.password}:${creds.kdAplikasi || '095'}`).toString('base64');
  return {
    timestamp,
    headers: {
      'X-Cons-ID': creds.consId,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
      Authorization: `Basic ${basic}`,
      ...(creds.userKey ? { 'X-User-Key': creds.userKey } : {}),
      'Content-Type': 'application/json'
    }
  };
}

async function pcareGet(creds, path) {
  const base = BASES[creds.environment || 'sandbox'];
  const { headers, timestamp } = buildHeaders(creds);
  const res = await fetch(`${base}/${path}`, { headers });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  if (json && json.response !== undefined) {
    if (typeof json.response === 'string') {
      // Payload terenkripsi (production): coba dekripsi skema terdokumentasi.
      try {
        const decrypted = decryptResponse(json.response, creds, timestamp);
        return { metaData: json.metaData, response: JSON.parse(decrypted) };
      } catch {
        return { metaData: json.metaData, response: null, encrypted: true,
          note: 'Respons terenkripsi tidak dapat dibuka dengan skema dekripsi saat ini — perlu penyesuaian dengan kredensial production faskes.' };
      }
    }
    return json;
  }
  if (!res.ok) throw new Error(`P-Care HTTP ${res.status}: ${text.slice(0, 200)}`);
  return json;
}

function decryptResponse(encryptedB64, creds, timestamp) {
  const keyHash = crypto.createHash('sha256').update(`${creds.consId}${creds.secretKey}${timestamp}`).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyHash, keyHash.subarray(0, 16));
  const out = Buffer.concat([decipher.update(Buffer.from(encryptedB64, 'base64')), decipher.final()]);
  return out.toString('utf8');
}

// Cek kepesertaan dari nomor kartu (jenisKartu 'noka') atau NIK ('nik').
export async function getPeserta(creds, { noKartu, nik }) {
  if (noKartu) return pcareGet(creds, `peserta/${encodeURIComponent(noKartu)}/jenisKartu/noka`);
  if (nik) return pcareGet(creds, `peserta/${encodeURIComponent(nik)}/jenisKartu/nik`);
  throw new Error('noKartu atau nik wajib diisi.');
}

export async function getProviderPeserta(creds) {
  return pcareGet(creds, 'provider');
}
