import React, { useState } from 'react';
import {
  Pill,
  Plus,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  User
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Prescription, PrescriptionItem } from '../../types';

interface PrescriptionViewProps {
  onNavigate: (module: string) => void;
  onSelectPatient: (patientId: string) => void;
}

export const PrescriptionView: React.FC<PrescriptionViewProps> = ({
  onNavigate,
  onSelectPatient
}) => {
  const {
    prescriptions,
    patients,
    medicines,
    currentUser,
    createPrescription,
    updatePrescriptionStatus,
    clinicProfile
  } = useStore();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  // Panel detail selalu diturunkan segar dari store berdasarkan ID terpilih,
  // agar perubahan status langsung tercermin (bukan snapshot basi).
  const [selectedId, setSelectedId] = useState<string | null>(prescriptions[0]?.id || null);
  const selectedRx: Prescription | null = prescriptions.find((rx) => rx.id === selectedId) || null;

  // Filter
  const filtered = prescriptions.filter((rx) => {
    const q = search.toLowerCase();
    const matchesSearch =
      rx.patientName.toLowerCase().includes(q) ||
      rx.mrNumber.toLowerCase().includes(q) ||
      rx.doctorName.toLowerCase().includes(q) ||
      rx.id.toLowerCase().includes(q);

    const matchesStatus = filterStatus === 'ALL' || rx.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Peresepan Elektronik (E-Prescribing)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar resep digital dokter yang diteruskan secara otomatis ke Instalasi Farmasi.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => onNavigate('examination')}
          leftIcon={<Plus className="w-4 h-4 text-white" />}
        >
          Buat Resep Lewat Pemeriksaan
        </Button>
      </div>

      {/* Main Grid: List Prescriptions (Left) & Preview Resep (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Table List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card noPadding className="p-3 bg-white border border-slate-200">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama pasien, No RM, atau dokter..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinical-500"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
              >
                <option value="ALL">Semua Status</option>
                <option value="Menunggu Farmasi">Menunggu Farmasi</option>
                <option value="Diproses">Diproses</option>
                <option value="Siap Diambil">Siap Diambil</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>
          </Card>

          <Card noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No. Resep</th>
                    <th className="py-3 px-4">Nama Pasien</th>
                    <th className="py-3 px-4">Dokter Penulis</th>
                    <th className="py-3 px-4">Jml Obat</th>
                    <th className="py-3 px-4">Total Biaya</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        Tidak ada resep yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((rx) => {
                      const isSelected = selectedRx?.id === rx.id;
                      const statusVariant = {
                        Draft: 'neutral',
                        'Menunggu Farmasi': 'warning',
                        Diproses: 'info',
                        'Siap Diambil': 'primary',
                        Selesai: 'success',
                        Dibatalkan: 'danger'
                      }[rx.status] as 'neutral' | 'warning' | 'info' | 'primary' | 'success' | 'danger';

                      return (
                        <tr
                          key={rx.id}
                          onClick={() => setSelectedId(rx.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-clinical-50/70 font-medium' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {rx.id}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">
                              {rx.patientName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {rx.mrNumber}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{rx.doctorName}</td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {rx.items.length} Macam
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            Rp {rx.totalCost.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={statusVariant} size="sm" dot>
                              {rx.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(rx.id);
                              }}
                            >
                              Lihat
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right: Printable Prescription Sheet Preview (1 Col) */}
        <div>
          {selectedRx ? (
            <Card
              title="Salinan Resep Dokter"
              subtitle={`ID: ${selectedRx.id} &bull; ${selectedRx.date}`}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                >
                  Cetak Resep
                </Button>
              }
            >
              {/* Prescription Clinical Sheet */}
              <div className="p-4 bg-white border border-slate-300 rounded-xl space-y-4 font-sans text-xs shadow-inner">
                {/* Kop Resep */}
                <div className="text-center border-b-2 border-slate-800 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                    {clinicProfile.clinicName || 'KLINIK TONG FANG ASHIAP'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {clinicProfile.address || 'Jl. Jenderal Sudirman Kav. 45, Jakarta Selatan'} &bull; Telp: {clinicProfile.phone || '(021) 555-0192'}
                  </p>
                  <p className="text-[10px] font-semibold text-clinical-800 mt-1">
                    {selectedRx.doctorName}
                  </p>
                </div>

                {/* Patient Info */}
                <div className="flex justify-between text-[11px] text-slate-600 border-b border-slate-200 pb-2">
                  <div>
                    <span>Pasien: </span>
                    <strong className="text-slate-900">{selectedRx.patientName}</strong>
                  </div>
                  <div>
                    <span>No. RM: </span>
                    <strong className="font-mono">{selectedRx.mrNumber}</strong>
                  </div>
                </div>

                {/* Recipe Symbol & Drugs */}
                <div className="space-y-3 py-2">
                  {selectedRx.items.map((item, idx) => (
                    <div key={idx} className="pl-4 relative border-l-2 border-slate-400 space-y-0.5">
                      <span className="absolute -left-3 top-0 font-serif font-black italic text-clinical-700 text-sm">
                        R/
                      </span>
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{item.medicineName}</span>
                        <span className="font-mono text-slate-700">No. {item.quantity} {item.unit}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono">
                        S. {item.frequency} ({item.timing}) &bull; {item.instructions}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes & Signature */}
                {selectedRx.notes && (
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600">
                    <strong>Catatan:</strong> {selectedRx.notes}
                  </div>
                )}

                <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
                  <span>Dicetak dari Sistem E-Prescribing</span>
                  <div className="text-center">
                    <span className="block mb-6">Tanda Tangan Dokter</span>
                    <strong className="text-slate-900 border-t border-slate-400 pt-0.5 block font-sans">
                      ({selectedRx.doctorName})
                    </strong>
                  </div>
                </div>
              </div>

              {/* Status Update Action for Pharmacist */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Status Resep:</span>
                <div className="flex gap-2">
                  {selectedRx.status === 'Menunggu Farmasi' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => updatePrescriptionStatus(selectedRx.id, 'Diproses')}
                    >
                      Proses di Farmasi
                    </Button>
                  )}
                  {selectedRx.status === 'Diproses' && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => updatePrescriptionStatus(selectedRx.id, 'Siap Diambil')}
                    >
                      Siap Diambil Pasien
                    </Button>
                  )}
                  {(selectedRx.status === 'Menunggu Farmasi' || selectedRx.status === 'Diproses') && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => updatePrescriptionStatus(selectedRx.id, 'Dibatalkan')}
                    >
                      Batalkan Resep
                    </Button>
                  )}
                </div>
              </div>
              {(selectedRx.status === 'Menunggu Farmasi' || selectedRx.status === 'Diproses') && (
                <p className="mt-2 text-[10px] text-slate-400 text-right">
                  Pembatalan tidak mengubah stok obat — stok hanya berkurang saat resep Selesai diserahkan.
                </p>
              )}
            </Card>
          ) : (
            <Card>
              <div className="text-center py-12 text-slate-400 text-xs">
                Pilih salah satu resep dari tabel untuk melihat salinan digital.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
