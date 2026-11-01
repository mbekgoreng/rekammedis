import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Pill, Stethoscope, Receipt, ArrowRight, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patientId: string) => void;
  onNavigate: (module: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectPatient,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { patients, medicines, schedules, invoices } = useStore();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredPatients = q
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.mrNumber.toLowerCase().includes(q) ||
          p.nik.includes(q) ||
          p.phone.includes(q)
      )
    : [];

  const filteredMedicines = q
    ? medicines.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      )
    : [];

  const filteredDoctors = q
    ? schedules.filter(
        (s) =>
          s.doctorName.toLowerCase().includes(q) ||
          s.specialty.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q)
      )
    : [];

  const filteredInvoices = q
    ? invoices.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.patientName.toLowerCase().includes(q)
      )
    : [];

  const totalResults =
    filteredPatients.length +
    filteredMedicines.length +
    filteredDoctors.length +
    filteredInvoices.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search input bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/70">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pasien (Nama, No RM, NIK), obat, dokter, atau invoice..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-200 rounded border border-slate-300">
            ESC
          </kbd>
        </div>

        {/* Search Results */}
        <div className="overflow-y-auto p-4 flex-1 space-y-4">
          {!q && (
            <div className="text-center py-10 text-slate-400 text-sm">
              Ketikkan kata kunci untuk mencari data di seluruh sistem rekam medis.
            </div>
          )}

          {q && totalResults === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">
              Tidak ditemukan data yang cocok dengan kata kunci &quot;<span className="font-semibold">{query}</span>&quot;.
            </div>
          )}

          {/* Patients */}
          {filteredPatients.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Pasien Terdaftar ({filteredPatients.length})
              </div>
              <div className="space-y-1">
                {filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectPatient(p.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-clinical-50 text-left transition-colors group border border-transparent hover:border-clinical-200"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 group-hover:text-clinical-700">
                          {p.name}
                        </span>
                        <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {p.mrNumber}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({p.age} thn, {p.gender})
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        NIK: {p.nik} &bull; Telp: {p.phone}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-clinical-600 transition-transform group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Medicines */}
          {filteredMedicines.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5" /> Obat & Farmasi ({filteredMedicines.length})
              </div>
              <div className="space-y-1">
                {filteredMedicines.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onNavigate('pharmacy');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          {m.name}
                        </span>
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {m.code}
                        </span>
                        <span className="text-xs text-slate-500">({m.category})</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Stok: {m.stock} {m.unit} &bull; Rp {m.price.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Doctors */}
          {filteredDoctors.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5" /> Jadwal Dokter ({filteredDoctors.length})
              </div>
              <div className="space-y-1">
                {filteredDoctors.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      onNavigate('schedule');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900">
                        {d.doctorName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {d.specialty} &bull; {d.department} ({d.dayOfWeek} {d.startTime} - {d.endTime})
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {filteredInvoices.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> Invoice & Billing ({filteredInvoices.length})
              </div>
              <div className="space-y-1">
                {filteredInvoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => {
                      onNavigate('billing');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-xs text-slate-600">
                          - {inv.patientName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Total: Rp {inv.total.toLocaleString('id-ID')} &bull; Status: {inv.status}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
