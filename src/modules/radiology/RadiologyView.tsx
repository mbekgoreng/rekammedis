import React, { useState } from 'react';
import {
  Scan,
  Plus,
  Printer,
  FileCheck,
  Search,
  Image as ImageIcon
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { RadiologyOrder } from '../../types';

export const RadiologyView: React.FC = () => {
  const {
    radiologyOrders,
    patients,
    currentUser,
    createRadiologyOrder,
    updateRadiologyFinding
  } = useStore();

  const [selectedOrder, setSelectedOrder] = useState<RadiologyOrder | null>(radiologyOrders[0] || null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [examType, setExamType] = useState('Foto Rontgen Thorax PA');
  const [indication, setIndication] = useState('Evaluasi batuk kronis & curiga kardiomegali');

  // Expertise input state
  const [findingsInput, setFindingsInput] = useState('');
  const [impressionInput, setImpressionInput] = useState('');

  const handleSaveExpertise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const finalFindings = (findingsInput || selectedOrder.findings || '').trim();
    const finalImpression = (impressionInput || selectedOrder.impression || '').trim();
    if (!finalFindings || !finalImpression) return; // ekspertise kosong tidak boleh disahkan
    updateRadiologyFinding(
      selectedOrder.id,
      finalFindings,
      finalImpression,
      currentUser.name
    );
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === selectedPatientId);
    if (!patient) return;

    const created = createRadiologyOrder({
      patientId: patient.id,
      patientName: patient.name,
      mrNumber: patient.mrNumber,
      doctorName: currentUser.name,
      examinationType: examType,
      clinicalIndication: indication
    });

    setSelectedOrder(created);
    setIsNewOrderModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Instalasi Radiologi & Pencitraan Diagnostik
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Layanan Rontgen X-Ray, Ultrasonografi (USG), dan pelaporan ekspertise radiologis.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsNewOrderModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4 text-white" />}
        >
          Permintaan Radiologi Baru
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Orders Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No. Order</th>
                    <th className="py-3 px-4">Nama Pasien</th>
                    <th className="py-3 px-4">Pemeriksaan</th>
                    <th className="py-3 px-4">Indikasi Klinis</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {radiologyOrders.map((order) => {
                    const isSelected = selectedOrder?.id === order.id;
                    const statusVariant = {
                      Permintaan: 'warning',
                      Dijadwalkan: 'info',
                      'Selesai Scan': 'primary',
                      'Hasil Terbaca': 'success'
                    }[order.status] as 'warning' | 'info' | 'primary' | 'success';

                    return (
                      <tr
                        key={order.id}
                        onClick={() => {
                          setSelectedOrder(order);
                          setFindingsInput(order.findings || '');
                          setImpressionInput(order.impression || '');
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-clinical-50/70 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{order.patientName}</span>
                          <span className="text-[11px] font-mono text-slate-400">{order.mrNumber}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-clinical-800">
                          {order.examinationType}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {order.clinicalIndication}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">{order.orderDate}</td>
                        <td className="py-3 px-4">
                          <Badge variant={statusVariant} size="sm" dot>
                            {order.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right: Reading & Expertise Panel */}
        <div>
          {selectedOrder ? (
            <Card
              title="Laporan Ekspertise Radiologi"
              subtitle={`No: ${selectedOrder.orderNumber}`}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                >
                  Cetak Laporan
                </Button>
              }
            >
              <div className="space-y-4 text-xs font-sans">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Pasien:</span>
                    <strong className="text-slate-900">{selectedOrder.patientName} ({selectedOrder.mrNumber})</strong>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Jenis Pemeriksaan:</span>
                    <strong className="text-slate-900">{selectedOrder.examinationType}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dokter Pengirim:</span>
                    <span className="text-slate-800">{selectedOrder.doctorName}</span>
                  </div>
                </div>

                {/* Film Viewer Placeholder */}
                <div className="h-40 bg-slate-900 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs border border-slate-800">
                  <ImageIcon className="w-8 h-8 text-slate-600 mb-1" />
                  <span className="font-mono text-[11px] text-slate-300">DICOM Image Viewer</span>
                  <span className="text-[10px] text-slate-500">Resolusi Matriks 2048 x 2048 &bull; Window: Lung/Mediastinum</span>
                </div>

                {/* Form or Display */}
                {selectedOrder.status === 'Hasil Terbaca' ? (
                  <div className="space-y-3 p-3 bg-white rounded-lg border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Temuan Radiologis (Findings):</span>
                      <p className="p-2 bg-slate-50 rounded text-slate-800 leading-relaxed">
                        {selectedOrder.findings}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Kesan (Impression):</span>
                      <p className="p-2 bg-clinical-50 border border-clinical-200 rounded text-clinical-900 font-semibold">
                        {selectedOrder.impression}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                      Dokter Spesialis Radiologi: <strong>{selectedOrder.radiologistName}</strong>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveExpertise} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Input Temuan (Findings)
                      </label>
                      <textarea
                        rows={3}
                        value={findingsInput}
                        onChange={(e) => setFindingsInput(e.target.value)}
                        placeholder="Deskripsikan kondisi cor, pulmo, sinus, diafragma, tulang..."
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kesan / Kesimpulan (Impression)
                      </label>
                      <input
                        type="text"
                        value={impressionInput}
                        onChange={(e) => setImpressionInput(e.target.value)}
                        placeholder="Contoh: Kardiomegali ringan, infiltrat paru minimal..."
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      className="w-full"
                      disabled={!((findingsInput || selectedOrder.findings || '').trim() && (impressionInput || selectedOrder.impression || '').trim())}
                    >
                      Simpan Ekspertise Radiolog
                    </Button>
                    {!((findingsInput || selectedOrder.findings || '').trim() && (impressionInput || selectedOrder.impression || '').trim()) && (
                      <p className="text-[10px] text-amber-600 text-center">
                        Temuan dan kesan wajib diisi radiolog — sistem tidak mengisi kesimpulan otomatis.
                      </p>
                    )}
                  </form>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-12 text-slate-400 text-xs">
                Pilih permintaan radiologi untuk melihat citra dan ekspertise.
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Order Modal */}
      <Modal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        title="Permintaan Pemeriksaan Radiologi Baru"
        subtitle="Rujuk pasien untuk foto rontgen X-ray atau pemeriksaan USG"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsNewOrderModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateOrder}>
              Kirim Permintaan
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Pasien</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.mrNumber} - {p.name} ({p.gender}, {p.age} thn)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Pemeriksaan</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
            >
              <option value="Foto Rontgen Thorax PA">Foto Rontgen Thorax PA</option>
              <option value="USG Abdomen 2 Posisi">USG Abdomen 2 Posisi</option>
              <option value="Foto Rontgen Ekstremitas">Foto Rontgen Ekstremitas</option>
              <option value="Panoramic Gigi">Panoramic Foto Gigi & Rahang</option>
            </select>
          </div>

          <Input
            label="Indikasi Klinis / Diagnosis Kerja"
            value={indication}
            onChange={(e) => setIndication(e.target.value)}
            placeholder="Alasan rujukan foto radiologi..."
          />
        </form>
      </Modal>
    </div>
  );
};
