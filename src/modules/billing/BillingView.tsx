import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Plus,
  Printer,
  CheckCircle2,
  Receipt,
  Search,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Invoice } from '../../types';

export const BillingView: React.FC = () => {
  const { invoices, payInvoice, currentUser, medicalRecords, prescriptions, createInvoice, settings, clinicProfile } = useStore();
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(invoices[0] || null);

  // Panel detail mengikuti data store terbaru (status tidak basi setelah dibayar)
  useEffect(() => {
    if (selectedInvoice) {
      const fresh = invoices.find((i) => i.id === selectedInvoice.id);
      if (fresh && fresh !== selectedInvoice) setSelectedInvoice(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices]);

  // Buat invoice dari kunjungan final
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const billableRecords = medicalRecords.filter((r) => r.status === 'Final');
  const selectedRecord = billableRecords.find((r) => r.id === selectedRecordId);
  const alreadyInvoiced = selectedRecord
    ? invoices.some((i) => i.medicalRecordId === selectedRecord.id)
    : false;

  const buildInvoiceItems = () => {
    if (!selectedRecord) return [];
    const items: { id: string; description: string; category: 'Konsultasi' | 'Tindakan' | 'Farmasi' | 'Laboratorium' | 'Radiologi' | 'Administrasi'; quantity: number; unitPrice: number; subtotal: number }[] = [];
    selectedRecord.plan.procedures.forEach((proc, idx) => {
      items.push({
        id: `bi-${idx}`,
        description: proc.name,
        category: proc.name.toLowerCase().includes('konsultasi') ? 'Konsultasi' : 'Tindakan',
        quantity: 1,
        unitPrice: proc.cost,
        subtotal: proc.cost
      });
    });
    const linkedRx = prescriptions.find((p) => p.medicalRecordId === selectedRecord.id);
    if (linkedRx) {
      items.push({
        id: 'bi-rx',
        description: `Obat resep ${selectedRecord.patientName} (${linkedRx.items.length} item)`,
        category: 'Farmasi',
        quantity: 1,
        unitPrice: linkedRx.totalCost,
        subtotal: linkedRx.totalCost
      });
    }
    items.push({
      id: 'bi-adm',
      description: 'Biaya Administrasi & Rekam Medis',
      category: 'Administrasi',
      quantity: 1,
      unitPrice: settings.adminFee,
      subtotal: settings.adminFee
    });
    if (settings.taxPercent > 0) {
      const subtotal = items.reduce((sum, it) => sum + it.subtotal, 0);
      const tax = Math.round((subtotal * settings.taxPercent) / 100);
      items.push({
        id: 'bi-tax',
        description: `PPN (${settings.taxPercent}%)`,
        category: 'Administrasi',
        quantity: 1,
        unitPrice: tax,
        subtotal: tax
      });
    }
    return items;
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || alreadyInvoiced) return;
    const items = buildInvoiceItems();
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const created = createInvoice({
      medicalRecordId: selectedRecord.id,
      patientId: selectedRecord.patientId,
      patientName: selectedRecord.patientName,
      mrNumber: selectedRecord.mrNumber,
      items,
      subtotal,
      discount: 0,
      tax: 0,
      total: subtotal,
      cashierName: currentUser.name
    });
    setIsCreateModalOpen(false);
    setSelectedRecordId('');
    setSelectedInvoice(created);
  };

  // Pay modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<Invoice['paymentMethod']>('Tunai');

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.patientName.toLowerCase().includes(q) ||
      inv.mrNumber.toLowerCase().includes(q)
    );
  });

  const totalPaidRevenue = invoices
    .filter((i) => i.status === 'Paid')
    .reduce((sum, i) => sum + i.total, 0);

  const totalPendingRevenue = invoices
    .filter((i) => i.status === 'Unpaid' || i.status === 'Partial')
    .reduce((sum, i) => sum + (i.total - i.paidAmount), 0);

  const handleOpenPay = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.total - inv.paidAmount);
    setIsPayModalOpen(true);
  };

  // Sisa tagihan faktur terpilih & validitas nominal pembayaran
  const payRemaining = selectedInvoice ? selectedInvoice.total - selectedInvoice.paidAmount : 0;
  const payAmountInvalid = payAmount <= 0 || payAmount > payRemaining;

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || payAmountInvalid) return;
    payInvoice(selectedInvoice.id, payAmount, payMethod);
    setIsPayModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Kasir & Penagihan (Billing Rawat Jalan)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan faktur tagihan pelayanan medis, resep farmasi, dan kuitansi pembayaran.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Penerimaan Lunas</span>
            <span className="text-sm font-extrabold text-emerald-700 font-mono">
              Rp {totalPaidRevenue.toLocaleString('id-ID')}
            </span>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4 text-white" />}
          >
            Buat Invoice
          </Button>
        </div>
      </div>

      {/* Grid: Invoice List & Preview Receipt */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Invoice Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card noPadding className="p-3 bg-white border border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nomor faktur invoice, nama pasien, atau No. RM..."
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinical-500"
              />
            </div>
          </Card>

          <Card noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No. Invoice</th>
                    <th className="py-3 px-4">Nama Pasien</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Total Tagihan</th>
                    <th className="py-3 px-4">Metode Bayar</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => {
                    const isSelected = selectedInvoice?.id === inv.id;
                    const statusVariant = {
                      Paid: 'success',
                      Partial: 'warning',
                      Unpaid: 'danger',
                      Cancelled: 'neutral'
                    }[inv.status] as 'success' | 'warning' | 'danger' | 'neutral';

                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setSelectedInvoice(inv)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-clinical-50/70 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{inv.patientName}</span>
                          <span className="text-[11px] font-mono text-slate-400">{inv.mrNumber}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">{inv.date}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          Rp {inv.total.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {inv.paymentMethod || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={statusVariant} size="sm" dot>
                            {inv.status === 'Paid' ? 'LUNAS' : inv.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {inv.status !== 'Paid' ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPay(inv);
                              }}
                            >
                              Bayar
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInvoice(inv);
                              }}
                            >
                              Kuitansi
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right: Official Clinic Invoice / Receipt (1 Col) */}
        <div>
          {selectedInvoice ? (
            <Card
              title="Faktur Kuitansi Pembayaran"
              subtitle={`Faktur: ${selectedInvoice.invoiceNumber}`}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                >
                  Cetak
                </Button>
              }
            >
              <div className="p-4 bg-white border border-slate-300 rounded-xl space-y-4 font-sans text-xs shadow-inner">
                {/* Header */}
                <div className="text-center border-b border-slate-300 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                    {clinicProfile.clinicName || 'KLINIK TONG FANG ASHIAP'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {clinicProfile.address || 'Jl. Jenderal Sudirman Kav. 45, Kebayoran Baru, Jakarta Selatan'} &bull; Telp: {clinicProfile.phone || '(021) 555-0192'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    KUITANSI BUKTI PEMBAYARAN RAWAT JALAN
                  </p>
                  <span className="font-mono text-xs font-bold text-slate-800 block mt-1">
                    {selectedInvoice.invoiceNumber}
                  </span>
                </div>

                {/* Patient details */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pb-2 border-b border-slate-200">
                  <div>
                    <span className="text-slate-400">Pasien:</span>
                    <strong className="block text-slate-800">{selectedInvoice.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">No. RM:</span>
                    <strong className="block font-mono text-slate-800">{selectedInvoice.mrNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Tanggal:</span>
                    <span className="block text-slate-700 font-mono">{selectedInvoice.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <strong className="block text-emerald-700">{selectedInvoice.status}</strong>
                  </div>
                </div>

                {/* Itemized bill */}
                <div className="space-y-1.5 py-1">
                  {selectedInvoice.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-[11px]">
                      <div>
                        <span className="font-medium text-slate-800">{item.description}</span>
                        <span className="text-slate-400 block text-[10px]">
                          {item.quantity} x Rp {item.unitPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="pt-3 border-t-2 border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-mono">Rp {selectedInvoice.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Diskon:</span>
                    <span className="font-mono">- Rp {selectedInvoice.discount.toLocaleString('id-ID')}</span>
                  </div>
                  {selectedInvoice.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pajak:</span>
                      <span className="font-mono">Rp {selectedInvoice.tax.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                    <span>Total Pembayaran:</span>
                    <span className="font-mono text-clinical-700">
                      Rp {selectedInvoice.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jumlah Dibayar:</span>
                    <span className="font-mono text-emerald-700">
                      Rp {selectedInvoice.paidAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sisa Bayar:</span>
                    <span className="font-mono">
                      Rp {(selectedInvoice.total - selectedInvoice.paidAmount).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Footer Signature */}
                <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
                  <span>Metode: {selectedInvoice.paymentMethod || 'Klaim Faskes'}</span>
                  <div className="text-center">
                    <span className="block mb-6">Kasir Bertugas</span>
                    <strong className="text-slate-900 border-t border-slate-400 pt-0.5 block font-sans">
                      ({selectedInvoice.cashierName || currentUser.name})
                    </strong>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-12 text-slate-400 text-xs">
                Pilih faktur tagihan untuk melihat rincian kuitansi.
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Pay Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`Pelunasan Tagihan: ${selectedInvoice.invoiceNumber}`}
          subtitle={`Pasien: ${selectedInvoice.patientName} (${selectedInvoice.mrNumber})`}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsPayModalOpen(false)}>
                Batal
              </Button>
              <Button variant="primary" size="sm" onClick={handleProcessPayment} disabled={payAmountInvalid}>
                Konfirmasi Pelunasan
              </Button>
            </>
          }
        >
          <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Total Tagihan:</span>
                <strong className="font-mono text-sm text-slate-900">
                  Rp {selectedInvoice.total.toLocaleString('id-ID')}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sisa yang Belum Terbayar:</span>
                <strong className="font-mono text-sm text-red-600">
                  Rp {(selectedInvoice.total - selectedInvoice.paidAmount).toLocaleString('id-ID')}
                </strong>
              </div>
            </div>

            <Input
              label="Nominal Pembayaran Diterima (Rp)"
              type="number"
              min={0}
              max={payRemaining}
              value={payAmount}
              onChange={(e) => setPayAmount(parseInt(e.target.value) || 0)}
              error={payAmountInvalid ? `Nominal harus lebih dari Rp 0 dan tidak melebihi sisa tagihan Rp ${payRemaining.toLocaleString('id-ID')}.` : undefined}
              requiredIndicator
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as Invoice['paymentMethod'])}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
              >
                {[
                  { setting: 'Tunai', value: 'Tunai', label: 'Tunai / Cash' },
                  { setting: 'QRIS', value: 'QRIS', label: 'QRIS Statis/Dinamis' },
                  { setting: 'Transfer', value: 'Transfer Bank', label: 'Transfer Bank' },
                  { setting: 'Debit', value: 'Kartu Debit', label: 'Kartu Debit (EDC)' },
                  { setting: 'Kredit', value: 'Kartu Kredit', label: 'Kartu Kredit (EDC)' },
                  { setting: 'BPJS', value: 'Klaim BPJS', label: 'Klaim BPJS Kesehatan' }
                ]
                  .filter((o) => settings.paymentMethods.includes(o.setting))
                  .map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Buat Invoice dari Kunjungan"
          subtitle="Tagihan disusun otomatis dari tindakan SOAP final dan resep terkait"
        >
          <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pilih Kunjungan (Rekam Medis Final)
              </label>
              <select
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-clinical-500"
                required
              >
                <option value="">— Pilih kunjungan —</option>
                {billableRecords.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.visitDate} • {r.patientName} ({r.mrNumber}) • {r.department}
                    {invoices.some((i) => i.medicalRecordId === r.id) ? ' — sudah ditagih' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedRecord && (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                {buildInvoiceItems().map((item) => (
                  <div key={item.id} className="flex justify-between px-3 py-2">
                    <span className="text-slate-700">
                      {item.description}
                      <span className="block text-[10px] text-slate-400">{item.category}</span>
                    </span>
                    <span className="font-mono font-semibold text-slate-900">
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2 bg-slate-50 font-bold">
                  <span>Total Tagihan</span>
                  <span className="font-mono">
                    Rp {buildInvoiceItems().reduce((s, i) => s + i.subtotal, 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            {alreadyInvoiced && (
              <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                Kunjungan ini sudah memiliki invoice — penagihan ganda dicegah.
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full font-bold"
              disabled={!selectedRecord || alreadyInvoiced}
            >
              Terbitkan Invoice
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
};
