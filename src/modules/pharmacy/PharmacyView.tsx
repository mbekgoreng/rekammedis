import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Pill,
  Calendar,
  Layers,
  TrendingDown
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Medicine } from '../../types';

export const PharmacyView: React.FC = () => {
  const { medicines, addMedicine, updateMedicineStock } = useStore();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Stock Adjustment Modal
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [stockDelta, setStockDelta] = useState(10);
  const [stockType, setStockType] = useState<'in' | 'out'>('in');
  const [stockReason, setStockReason] = useState('Penerimaan dari Supplier');

  // Add Medicine Modal
  const [isAddMedModalOpen, setIsAddMedModalOpen] = useState(false);
  const [newMedData, setNewMedData] = useState({
    code: '',
    name: '',
    category: 'Analgesik / Antipiretik' as Medicine['category'],
    form: 'Tablet' as Medicine['form'],
    strength: '500 mg',
    stock: 100,
    minimumStock: 50,
    unit: 'Tablet',
    price: 2500,
    batchNumber: 'BATCH-2026',
    expiryDate: '2027-12-31',
    supplier: 'PT Kimia Farma',
    indication: ''
  });

  // Calculate Metrics
  const totalItems = medicines.length;
  const lowStockItems = medicines.filter((m) => m.stock > 0 && m.stock <= m.minimumStock);
  const outOfStockItems = medicines.filter((m) => m.stock === 0);
  
  // Expiry check (< 180 days)
  const today = new Date();
  const nearExpiryItems = medicines.filter((m) => {
    const exp = new Date(m.expiryDate);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 180;
  });

  // Filtered medicines
  const filteredMedicines = medicines.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.supplier.toLowerCase().includes(q);

    const matchesCategory = filterCategory === 'ALL' || m.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStockAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed) return;
    const delta = stockType === 'in' ? Math.abs(stockDelta) : -Math.abs(stockDelta);
    updateMedicineStock(selectedMed.id, delta, stockReason);
    setIsStockModalOpen(false);
  };

  const handleAddMedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMedicine({
      ...newMedData,
      code: newMedData.code || `OBT-${String(medicines.length + 1).padStart(3, '0')}`
    });
    setIsAddMedModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Instalasi Farmasi & Inventori Obat
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen stok fisik obat, nomor batch, masa kadaluarsa, dan penerimaan farmasi.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsAddMedModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4 text-white" />}
        >
          Tambah Master Obat
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Item Obat</span>
          <span className="text-2xl font-black text-slate-900 font-mono">{totalItems}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Master formularium</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <span className="text-xs font-semibold text-amber-800 block mb-1">Stok Menipis</span>
          <span className="text-2xl font-black text-amber-600 font-mono">{lowStockItems.length}</span>
          <span className="text-[11px] text-amber-700 block mt-0.5">Mendekati batas minimum</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-2xs bg-red-50/20">
          <span className="text-xs font-semibold text-red-800 block mb-1">Stok Kosong</span>
          <span className="text-2xl font-black text-red-600 font-mono">{outOfStockItems.length}</span>
          <span className="text-[11px] text-red-700 block mt-0.5">Perlu pengadaan segera</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs bg-blue-50/20">
          <span className="text-xs font-semibold text-blue-800 block mb-1">Hampir Kadaluarsa</span>
          <span className="text-2xl font-black text-blue-700 font-mono">{nearExpiryItems.length}</span>
          <span className="text-[11px] text-blue-600 block mt-0.5">&lt; 180 hari sisa</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card noPadding className="p-3 bg-white border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama obat, kode, kategori, atau supplier..."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinical-500"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
          >
            <option value="ALL">Semua Kategori Farmasi</option>
            <option value="Antibiotik">Antibiotik</option>
            <option value="Analgesik / Antipiretik">Analgesik / Antipiretik</option>
            <option value="Antihipertensi">Antihipertensi</option>
            <option value="Antidiabetes">Antidiabetes</option>
            <option value="Gastrointestinal">Gastrointestinal</option>
            <option value="Antihistamin">Antihistamin</option>
          </select>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Kode & Nama Obat</th>
                <th className="py-3 px-4">Kategori & Sediaan</th>
                <th className="py-3 px-4">Stok Fisik</th>
                <th className="py-3 px-4">Harga Satuan</th>
                <th className="py-3 px-4">No. Batch</th>
                <th className="py-3 px-4">Kadaluarsa (ED)</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Aksi Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.map((med) => {
                const isLow = med.stock <= med.minimumStock && med.stock > 0;
                const isOut = med.stock === 0;

                // Check expiry
                const expDate = new Date(med.expiryDate);
                const isNearExp = (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 180;

                return (
                  <tr key={med.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block text-sm">{med.name}</span>
                      <span className="text-[11px] font-mono text-slate-400">{med.code}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-800 font-medium block">{med.category}</span>
                      <span className="text-[11px] text-slate-500">{med.form} &bull; {med.strength}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isOut
                              ? 'text-red-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {med.stock} {med.unit}
                        </span>
                        {isLow && (
                          <Badge variant="warning" size="sm">
                            Min: {med.minimumStock}
                          </Badge>
                        )}
                        {isOut && (
                          <Badge variant="danger" size="sm">
                            Habis
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      Rp {med.price.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {med.batchNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono">
                        {isNearExp && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        <span className={isNearExp ? 'text-amber-700 font-bold' : 'text-slate-700'}>
                          {med.expiryDate}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {med.supplier}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMed(med);
                          setIsStockModalOpen(true);
                        }}
                      >
                        Atur Stok
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stock Adjustment Modal */}
      {selectedMed && (
        <Modal
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          title={`Penyesuaian Stok: ${selectedMed.name}`}
          subtitle={`Stok saat ini: ${selectedMed.stock} ${selectedMed.unit}`}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsStockModalOpen(false)}>
                Batal
              </Button>
              <Button variant="primary" size="sm" onClick={handleStockAdjustSubmit}>
                Simpan Penyesuaian
              </Button>
            </>
          }
        >
          <form onSubmit={handleStockAdjustSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStockType('in')}
                className={`p-3 rounded-lg border text-center transition-all flex items-center justify-center gap-2 font-bold text-xs ${
                  stockType === 'in'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                Stok Masuk (Stock In)
              </button>

              <button
                type="button"
                onClick={() => setStockType('out')}
                className={`p-3 rounded-lg border text-center transition-all flex items-center justify-center gap-2 font-bold text-xs ${
                  stockType === 'out'
                    ? 'bg-red-50 text-red-800 border-red-300 ring-2 ring-red-500'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-red-600" />
                Stok Keluar (Stock Out)
              </button>
            </div>

            <Input
              label={`Jumlah ${stockType === 'in' ? 'Masuk' : 'Keluar'} (${selectedMed.unit})`}
              type="number"
              min={1}
              value={stockDelta}
              onChange={(e) => setStockDelta(parseInt(e.target.value) || 0)}
              requiredIndicator
            />

            <Input
              label="Alasan Penyesuaian / No. Faktur Pembelian"
              value={stockReason}
              onChange={(e) => setStockReason(e.target.value)}
              placeholder="Contoh: Penerimaan Faktur PO-991, Retur, Koreksi fisik..."
              requiredIndicator
            />
          </form>
        </Modal>
      )}

      {/* Add Master Medicine Modal */}
      <Modal
        isOpen={isAddMedModalOpen}
        onClose={() => setIsAddMedModalOpen(false)}
        title="Tambah Master Obat Farmasi"
        subtitle="Registrasi obat baru ke dalam formularium elektronik klinik"
        maxWidth="2xl"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAddMedModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddMedSubmit}>
              Simpan Obat Baru
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddMedSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Nama Obat Lengkap"
              value={newMedData.name}
              onChange={(e) => setNewMedData({ ...newMedData, name: e.target.value })}
              placeholder="Contoh: Ibuprofen 400 mg"
              requiredIndicator
            />
            <Select
              label="Kategori Obat"
              value={newMedData.category}
              onChange={(e) => setNewMedData({ ...newMedData, category: e.target.value as Medicine['category'] })}
              options={[
                { value: 'Analgesik / Antipiretik', label: 'Analgesik / Antipiretik' },
                { value: 'Antibiotik', label: 'Antibiotik' },
                { value: 'Antihipertensi', label: 'Antihipertensi' },
                { value: 'Antidiabetes', label: 'Antidiabetes' },
                { value: 'Gastrointestinal', label: 'Gastrointestinal' },
                { value: 'Antihistamin', label: 'Antihistamin' },
                { value: 'Kortikosteroid', label: 'Kortikosteroid' }
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Bentuk Sediaan"
              value={newMedData.form}
              onChange={(e) => setNewMedData({ ...newMedData, form: e.target.value as Medicine['form'] })}
              placeholder="Tablet / Kapsul / Sirup"
            />
            <Input
              label="Kekuatan / Dosis"
              value={newMedData.strength}
              onChange={(e) => setNewMedData({ ...newMedData, strength: e.target.value })}
              placeholder="500 mg"
            />
            <Input
              label="Satuan"
              value={newMedData.unit}
              onChange={(e) => setNewMedData({ ...newMedData, unit: e.target.value })}
              placeholder="Tablet / Botol"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Stok Awal"
              type="number"
              value={newMedData.stock}
              onChange={(e) => setNewMedData({ ...newMedData, stock: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Batas Min. Stok"
              type="number"
              value={newMedData.minimumStock}
              onChange={(e) => setNewMedData({ ...newMedData, minimumStock: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Harga Satuan (Rp)"
              type="number"
              value={newMedData.price}
              onChange={(e) => setNewMedData({ ...newMedData, price: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="No. Batch"
              value={newMedData.batchNumber}
              onChange={(e) => setNewMedData({ ...newMedData, batchNumber: e.target.value })}
            />
            <Input
              label="Tanggal Kadaluarsa"
              type="date"
              value={newMedData.expiryDate}
              onChange={(e) => setNewMedData({ ...newMedData, expiryDate: e.target.value })}
            />
            <Input
              label="Pabrik / Supplier"
              value={newMedData.supplier}
              onChange={(e) => setNewMedData({ ...newMedData, supplier: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
