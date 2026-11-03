// Klien SATUSEHAT (Kemenkes) — OAuth2 client credentials + FHIR R4.
// Kredensial per faskes (client_id, client_secret, organization_id) diterbitkan
// SATUSEHAT untuk setiap klinik dan disimpan terenkripsi di brankas server.
// Tanpa kredensial, fungsi di sini tidak dipanggil sama sekali.
//
// Referensi: https://satusehat.kemkes.go.id/platform/docs
// Sandbox:    auth https://api-satusehat-dev.dto.kemkes.go.id/oauth2/v1
//             fhir https://api-satusehat-dev.dto.kemkes.go.id/fhir-r4/v1
// Production: auth https://api-satusehat.kemkes.go.id/oauth2/v1
//             fhir https://api-satusehat.kemkes.go.id/fhir-r4/v1

const BASES = {
  sandbox: {
    auth: 'https://api-satusehat-dev.dto.kemkes.go.id/oauth2/v1',
    fhir: 'https://api-satusehat-dev.dto.kemkes.go.id/fhir-r4/v1'
  },
  production: {
    auth: 'https://api-satusehat.kemkes.go.id/oauth2/v1',
    fhir: 'https://api-satusehat.kemkes.go.id/fhir-r4/v1'
  }
};

export async function getAccessToken(creds) {
  const base = BASES[creds.environment || 'sandbox'];
  const form = new URLSearchParams({ client_id: creds.clientId, client_secret: creds.clientSecret });
  const res = await fetch(`${base.auth}/accesstoken?grant_type=client_credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(`SATUSEHAT menolak permintaan token (HTTP ${res.status}): ${JSON.stringify(json).slice(0, 200)}`);
  }
  return { token: json.access_token, base };
}

async function fhir(token, base, method, path, body) {
  const res = await fetch(`${base.fhir}/${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`FHIR ${method} ${path} gagal (HTTP ${res.status}): ${JSON.stringify(json).slice(0, 300)}`);
  }
  return json;
}

// Cari nomor IHS pasien dari NIK (identifier resmi Kemenkes).
export async function lookupPatientIhs(token, base, nik) {
  const bundle = await fhir(token, base, 'GET',
    `Patient?identifier=${encodeURIComponent(`https://fhir.kemkes.go.id/id/nik|${nik}`)}`);
  const entry = bundle.entry?.[0];
  return entry?.resource?.id || null;
}

export async function lookupPractitionerIhs(token, base, nik) {
  const bundle = await fhir(token, base, 'GET',
    `Practitioner?identifier=${encodeURIComponent(`https://fhir.kemkes.go.id/id/nik|${nik}`)}`);
  const entry = bundle.entry?.[0];
  return entry?.resource?.id || null;
}

export function buildEncounter({ organizationId, patientIhs, practitionerIhs, practitionerName, visitDate, recordId }) {
  const start = new Date(visitDate);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return {
    resourceType: 'Encounter',
    identifier: [{ system: `http://sys-ids.kemkes.go.id/encounter/${organizationId}`, value: recordId }],
    status: 'finished',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
    subject: { reference: `Patient/${patientIhs}`, display: undefined },
    participant: [{
      type: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
          code: 'ATND', display: 'attender'
        }]
      }],
      individual: practitionerIhs
        ? { reference: `Practitioner/${practitionerIhs}` }
        : { display: practitionerName }
    }],
    period: { start: start.toISOString(), end: end.toISOString() },
    serviceProvider: { reference: `Organization/${organizationId}` }
  };
}

export function buildCondition({ patientIhs, encounterId, diagnosis, recordedDate }) {
  return {
    resourceType: 'Condition',
    clinicalStatus: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }]
    },
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-category',
        code: 'encounter-diagnosis', display: 'Encounter Diagnosis'
      }]
    }],
    code: {
      coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: diagnosis.code, display: diagnosis.name }]
    },
    subject: { reference: `Patient/${patientIhs}` },
    encounter: { reference: `Encounter/${encounterId}` },
    recordedDate: new Date(recordedDate).toISOString()
  };
}

export async function syncRecordToSatusehat(creds, { record, patient, practitionerNik }) {
  const { token, base } = await getAccessToken(creds);
  const patientIhs = await lookupPatientIhs(token, base, patient.nik);
  if (!patientIhs) {
    throw new Error('Pasien belum terdaftar di SATUSEHAT (IHS tidak ditemukan dari NIK). Daftarkan pasien terlebih dahulu.');
  }
  const practitionerIhs = practitionerNik ? await lookupPractitionerIhs(token, base, practitionerNik).catch(() => null) : null;
  const encounter = await fhir(token, base, 'POST', 'Encounter', buildEncounter({
    organizationId: creds.organizationId,
    patientIhs,
    practitionerIhs,
    practitionerName: record.doctorName,
    visitDate: record.visitDate,
    recordId: record.id
  }));
  const conditions = [];
  for (const diagnosis of record.diagnoses || []) {
    if (!diagnosis.code) continue;
    const cond = await fhir(token, base, 'POST', 'Condition', buildCondition({
      patientIhs, encounterId: encounter.id, diagnosis, recordedDate: record.visitDate
    }));
    conditions.push(cond.id);
  }
  return { encounterId: encounter.id, conditionIds: conditions, patientIhs };
}
