import React, { useMemo } from 'react';
import {
  ShieldCheck, ShieldAlert, Users, Activity, FileOutput,
  HeartPulse, CheckCircle2, AlertTriangle, PlugZap
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { computeBpjsStats, isBpjs } from '../../lib/bpjs';

// BPJS & Kapitasi — panel pemantauan internal klinik:
// indikator KBK (angka kontak, rasio rujukan, prolanis) dihitung dari data
// nyata klinik, daftar kerja peserta kronis, dan verifikasi kepesertaan
// manual oleh petugas. Bridging P-Care/SEP resmi BELUM terhubung — panel
// ini persiapan & pemantauan, bukan laporan ke BPJS.

const TARGET_KONTAK = 150; // per mil
const TARGET_RUJUKAN = 2; // persen maksimum

export const BpjsView: React.FC = () => {
  const { patients, medicalRecords, certificates, updatePatient, clinicProfile, settings, currentUser } = useStore();
  const stats = useMemo(
    () => computeBpjsStats(patients, medicalRecords, certificates),
    [patients, medicalRecords, certificates]
  );
  const peserta = patients.filter(isBpjs);
  const canVerify = currentUser.role === 'admin' || currentUser.role === 'nurse' || currentUser.role === 'cashier';

  const kontakOk = stats.angkaKontak >= TARGET_KONTAK;
  const rujukanOk = stats.rasioRujukan <= TARGET_RUJUKAN;
  const prolanisPct = stats.prolanis.length > 0 ? Math.round((stats.prolanisControlled / stats.prolanis.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-clinical-600" /> BPJS & Kapitasi
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Pemantauan indikator kinerja kapitasi (KBK) dan kepesertaan BPJS Kesehatan — periode {stats.periodLabel}.
        </p>
      </div>

      <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
        <PlugZap className="w-5 h-5 shrink-0 text-amber-600" />
        <p className="text-xs leading-relaxed">
          <strong>Status bridging: BELUM TERHUBUNG.</strong> Angka di halaman ini dihitung dari data lokal klinik
          untuk pemantauan internal dan persiapan — <strong>bukan</strong> laporan resmi ke BPJS. Pengiriman kunjungan
          ke P-Care, penerbitan SEP, dan antrean Mobile JKN memerlukan backend dengan kredensial resmi faskes
          (Cons ID & secret key tidak boleh disimpan di browser). Kode faskes saat ini:{' '}
          <strong>{clinicProfile.faskesCode || 'belum diisi'}</strong> — Cons ID P-Care:{' '}
          <strong>{settings.bpjsConsId ? 'tersimpan di Pengaturan' : 'belum diisi'}</strong>.
        </p>
      </div>

      {/* Indikator KBK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Peserta Terdaftar</span>
            <Users className="w-4 h-4 text-clinical-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.pesertaTotal}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.pesertaVerified} terverifikasi manual • {stats.kunjungan} kunjungan periode ini
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Angka Kontak</span>
            <Activity className="w-4 h-4 text-clinical-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.angkaKontak}‰</p>
          <div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${kontakOk ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, (stats.angkaKontak / TARGET_KONTAK) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
            {kontakOk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
            Target ≥ {TARGET_KONTAK}‰ — {stats.pesertaAktif} peserta berkunjung bulan ini
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Rasio Rujukan</span>
            <FileOutput className="w-4 h-4 text-clinical-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.rasioRujukan.toFixed(1)}%</p>
          <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
            {rujukanOk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
            Target ≤ {TARGET_RUJUKAN}% — {stats.rujukan} surat rujukan dari {stats.kunjungan} kunjungan
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Prolanis Terkendali</span>
            <HeartPulse className="w-4 h-4 text-clinical-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.prolanisControlled}<span className="text-base text-slate-400">/{stats.prolanis.length}</span></p>
          <p className="text-[11px] text-slate-500 mt-1">
            {prolanisPct}% peserta DM/hipertensi sudah kontrol pada {stats.periodLabel}
          </p>
        </Card>
      </div>

      {/* Daftar kerja Prolanis */}
      <Card title="Daftar Kerja Prolanis" subtitle="Peserta BPJS dengan DM / hipertensi — yang belum kontrol bulan ini perlu dihubungi lebih dulu" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Peserta</th>
                <th className="py-3 px-4">Program</th>
                <th className="py-3 px-4">Kunjungan Terakhir</th>
                <th className="py-3 px-4">Status Bulan Ini</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.prolanis.length === 0 && (
                <tr><td colSpan={4} className="py-6 px-4 text-center text-slate-400">Belum ada peserta prolanis terdata (pasien BPJS dengan riwayat DM/hipertensi).</td></tr>
              )}
              {stats.prolanis.map((e) => (
                <tr key={e.patient.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-800">{e.patient.name}</p>
                    <p className="text-[11px] text-slate-400">{e.patient.mrNumber} • Kartu {e.patient.insuranceNumber || '-'}</p>
                  </td>
                  <td className="py-3 px-4"><Badge variant="primary" size="sm">{e.kind}</Badge></td>
                  <td className="py-3 px-4 text-slate-600">{e.lastVisit || 'Belum pernah berkunjung'}</td>
                  <td className="py-3 px-4">
                    {e.controlledThisMonth
                      ? <Badge variant="success" size="sm">Sudah Kontrol</Badge>
                      : <Badge variant="warning" size="sm">Belum Kontrol — Hubungi</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Peserta & verifikasi manual */}
      <Card title="Peserta BPJS Terdaftar" subtitle="Verifikasi manual: petugas mengecek kepesertaan di kanal resmi BPJS, lalu menandainya di sini" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Peserta</th>
                <th className="py-3 px-4">Nomor Kartu</th>
                <th className="py-3 px-4">Status Verifikasi</th>
                {canVerify && <th className="py-3 px-4">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {peserta.length === 0 && (
                <tr><td colSpan={4} className="py-6 px-4 text-center text-slate-400">Belum ada pasien dengan penjamin BPJS Kesehatan.</td></tr>
              )}
              {peserta.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <p className="text-[11px] text-slate-400">{p.mrNumber} • NIK {p.nik}</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{p.insuranceNumber || '-'}</td>
                  <td className="py-3 px-4">
                    {p.bpjsVerified
                      ? <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold"><ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi Manual</span>
                      : <span className="inline-flex items-center gap-1 text-amber-700 font-semibold"><ShieldAlert className="w-3.5 h-3.5" /> Belum Diverifikasi</span>}
                  </td>
                  {canVerify && (
                    <td className="py-3 px-4">
                      <button
                        onClick={() => updatePatient(p.id, { bpjsVerified: !p.bpjsVerified })}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-600 hover:bg-slate-50"
                      >
                        {p.bpjsVerified ? 'Batalkan' : 'Tandai Terverifikasi'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Kesiapan bridging */}
      <Card title="Kesiapan Bridging P-Care (setelah backend tersedia)" subtitle="Daftar periksa aktivasi — urutan resmi agar klinik terhubung ke sistem BPJS">
        <ol className="space-y-2 text-xs text-slate-600 leading-relaxed">
          {[
            'Perjanjian kerja sama & kredensial bridging (Cons ID, Secret Key, User Key) diterbitkan BPJS untuk kode faskes klinik — disimpan di Pengaturan → Integrasi.',
            'Backend RekamMedis aktif: kredensial hanya disimpan & dipakai di server, tidak pernah di browser.',
            'Uji di environment Sandbox: cek kepesertaan, kirim kunjungan sehat/sakit, terbitkan rujukan.',
            'Pindah ke Production: kunjungan peserta terkirim otomatis dari SOAP yang difinalkan; antrean Mobile JKN tersinkron ke modul Antrian.',
            'Indikator KBK di halaman ini kemudian dihitung dari data yang sama dengan yang terlaporkan.'
          ].map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-clinical-100 text-clinical-800 font-extrabold flex items-center justify-center shrink-0 text-[11px]">{i + 1}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
};
