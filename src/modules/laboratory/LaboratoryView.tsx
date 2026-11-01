import React, { useState } from 'react';
import {
  FlaskConical,
  Plus,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search,
  Check
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { LabOrder } from '../../types';

export const LaboratoryView: React.FC = () => {
  const {
    labOrders,
    patients,
    currentUser,
    createLabOrder,
    updateLabResult,
    validateLabOrder
  } = useStore();

  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(labOrders[0] || null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [testCategory, setTestCategory] = useState('Kimia Klinik');

  // Input result state for selected test
  const [editingResultValues, setEditingResultValues] = useState<Record<number, string>>({});

  const handleSaveResultValues = (orderId: string) => {
    Object.entries(editingResultValues).forEach(([idxStr, val]) => {
      const idx = parseInt(idxStr);
      // simple threshold check if contains number
      const numVal = parseFloat(val);
      const isAbnormal = !isNaN(numVal) && (numVal > 140 || numVal < 60);
      updateLabResult(orderId, idx, val, isAbnormal);
    });
    setEditingResultValues({});
  };

  const handleValidate = (orderId: string) => {
    validateLabOrder(orderId, currentUser.name);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === selectedPatientId);
    if (!patient) return;

    let items = [
      { testName: 'Hemoglobin (Hb)', category: 'Hematologi', referenceRange: '13.0 - 17.5', unit: 'g/dL' },
      { testName: 'Leukosit', category: 'Hematologi', referenceRange: '4.000 - 10.000', unit: '/µL' },
      { testName: 'Trombosit', category: 'Hematologi', referenceRange: '150.000 - 450.000', unit: '/µL' },
      { testName: 'Hematokrit', category: 'Hematologi', referenceRange: '40 - 52', unit: '%' }
    ];

    if (testCategory === 'Kimia Klinik') {
      items = [
        { testName: 'Glukosa Darah Puasa (GDP)', category: 'Kimia Klinik', referenceRange: '70 - 100', unit: 'mg/dL' },
        { testName: 'Ureum Darah', category: 'Fungsi Ginjal', referenceRange: '15 - 45', unit: 'mg/dL' },
        { testName: 'Kreatinin Serum', category: 'Fungsi Ginjal', referenceRange: '0.7 - 1.3', unit: 'mg/dL' },
        { testName: 'SGOT (AST)', category: 'Fungsi Hati', referenceRange: '< 35', unit: 'U/L' },
        { testName: 'SGPT (ALT)', category: 'Fungsi Hati', referenceRange: '< 45', unit: 'U/L' }
      ];
    } else if (testCategory === 'Profil Lipid') {
      items = [
        { testName: 'Kolesterol Total', category: 'Profil Lipid', referenceRange: '< 200', unit: 'mg/dL' },
        { testName: 'Kolesterol HDL', category: 'Profil Lipid', referenceRange: '> 40', unit: 'mg/dL' },
        { testName: 'Kolesterol LDL', category: 'Profil Lipid', referenceRange: '< 100', unit: 'mg/dL' },
        { testName: 'Trigliserida', category: 'Profil Lipid', referenceRange: '< 150', unit: 'mg/dL' }
      ];
    }

    const created = createLabOrder({
      patientId: patient.id,
      patientName: patient.name,
      mrNumber: patient.mrNumber,
      doctorName: currentUser.name,
      items,
      notes: `Order ${testCategory} rujukan klinis`
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
            Laboratorium Patologi Klinik
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan permintaan uji spesimen, input nilai hasil analitik, dan validasi medis.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsNewOrderModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4 text-white" />}
        >
          Permintaan Uji Lab Baru
        </Button>
      </div>

      {/* Grid: Order List & Detail / Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Orders Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No. Order</th>
                    <th className="py-3 px-4">Pasien</th>
                    <th className="py-3 px-4">Dokter Perujuk</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Jumlah Uji</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {labOrders.map((order) => {
                    const isSelected = selectedOrder?.id === order.id;
                    const statusVariant = {
                      Requested: 'warning',
                      'Sample Collected': 'info',
                      Processing: 'primary',
                      Completed: 'neutral',
                      Validated: 'success'
                    }[order.status] as 'warning' | 'info' | 'primary' | 'neutral' | 'success';

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
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
                        <td className="py-3 px-4 text-slate-600">{order.doctorName}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono">{order.orderDate}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {order.items.length} Parameter
                        </td>
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

        {/* Right: Results Sheet / Input Form */}
        <div>
          {selectedOrder ? (
            <Card
              title="Lembar Hasil Laboratorium"
              subtitle={`No: ${selectedOrder.orderNumber}`}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                >
                  Cetak Hasil
                </Button>
              }
            >
              <div className="space-y-4 text-xs font-sans">
                {/* Patient Header */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Pasien:</span>
                    <strong className="text-slate-900">{selectedOrder.patientName}</strong>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">No. Rekam Medis:</span>
                    <strong className="font-mono text-slate-800">{selectedOrder.mrNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Validasi:</span>
                    <span className="font-bold text-emerald-700">{selectedOrder.status}</span>
                  </div>
                </div>

                {/* Table of tests */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2 px-2.5">Pemeriksaan</th>
                        <th className="py-2 px-2.5">Hasil</th>
                        <th className="py-2 px-2.5">Rujukan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-2.5 font-semibold text-slate-800">
                            {item.testName}
                          </td>
                          <td className="py-2 px-2.5">
                            {item.resultValue ? (
                              <span
                                className={`font-mono font-bold ${
                                  item.isAbnormal ? 'text-red-600 bg-red-50 px-1 rounded' : 'text-slate-900'
                                }`}
                              >
                                {item.resultValue} {item.unit}
                              </span>
                            ) : (
                              <input
                                type="text"
                                placeholder={`Nilai (${item.unit})`}
                                value={editingResultValues[idx] || ''}
                                onChange={(e) =>
                                  setEditingResultValues({
                                    ...editingResultValues,
                                    [idx]: e.target.value
                                  })
                                }
                                className="w-24 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono"
                              />
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-slate-500 font-mono">
                            {item.referenceRange}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action buttons: Save input or Validate */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {Object.keys(editingResultValues).length > 0 && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => handleSaveResultValues(selectedOrder.id)}
                    >
                      Simpan Nilai Hasil Uji
                    </Button>
                  )}

                  {selectedOrder.status !== 'Validated' && (
                    <Button
                      variant="success"
                      size="sm"
                      className="w-full"
                      onClick={() => handleValidate(selectedOrder.id)}
                      leftIcon={<FileCheck className="w-4 h-4 text-white" />}
                    >
                      Validasi Hasil Resmi (Analis Medis)
                    </Button>
                  )}

                  {selectedOrder.validatedBy && (
                    <p className="text-[10px] text-slate-500 text-center italic mt-2">
                      Divalidasi oleh: {selectedOrder.validatedBy} ({selectedOrder.validatedAt})
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-12 text-slate-400 text-xs">
                Pilih salah satu order laboratorium untuk melihat detail.
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Lab Order Modal */}
      <Modal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        title="Permintaan Pemeriksaan Laboratorium Baru"
        subtitle="Pilih pasien dan paket panel pemeriksaan laboratorium klinik"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsNewOrderModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateOrder}>
              Kirim Permintaan ke Lab
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Pasien
            </label>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Paket Panel Pemeriksaan
            </label>
            <select
              value={testCategory}
              onChange={(e) => setTestCategory(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
            >
              <option value="Kimia Klinik">Panel Kimia Darah Lengkap (GDP, Ureum, Kreatinin, SGOT, SGPT)</option>
              <option value="Hematologi">Panel Darah Rutin (Hb, Leukosit, Trombosit, Hematokrit)</option>
              <option value="Profil Lipid">Panel Profil Lipid (Kolesterol Total, HDL, LDL, Trigliserida)</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
