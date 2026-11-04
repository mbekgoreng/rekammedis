import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Patient } from '../../types';
import { Plus, X } from 'lucide-react';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patientData: Omit<Patient, 'id' | 'mrNumber' | 'registeredAt'>) => void;
  initialData?: Patient;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [formData, setFormData] = useState({
    name: '',
    nik: '',
    gender: 'Laki-laki' as Patient['gender'],
    birthDate: '1990-01-01',
    age: 36,
    bloodType: 'O+' as Patient['bloodType'],
    phone: '',
    email: '',
    address: '',
    occupation: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    insuranceType: 'BPJS Kesehatan' as Patient['insuranceType'],
    insuranceNumber: '',
    bpjsVerified: false,
    status: 'Aktif' as Patient['status']
  });

  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');

  const [chronicDiseases, setChronicDiseases] = useState<string[]>([]);
  const [chronicInput, setChronicInput] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        nik: initialData.nik,
        gender: initialData.gender,
        birthDate: initialData.birthDate,
        age: initialData.age,
        bloodType: initialData.bloodType,
        phone: initialData.phone,
        email: initialData.email,
        address: initialData.address,
        occupation: initialData.occupation,
        emergencyName: initialData.emergencyContact.name,
        emergencyRelation: initialData.emergencyContact.relation,
        emergencyPhone: initialData.emergencyContact.phone,
        insuranceType: initialData.insuranceType,
        insuranceNumber: initialData.insuranceNumber || '',
        bpjsVerified: initialData.bpjsVerified || false,
        status: initialData.status
      });
      setAllergies(initialData.allergies);
      setChronicDiseases(initialData.chronicDiseases);
    } else {
      setFormData({
        name: '',
        nik: '',
        gender: 'Laki-laki',
        birthDate: '1990-01-01',
        age: 36,
        bloodType: 'O+',
        phone: '',
        email: '',
        address: '',
        occupation: '',
        emergencyName: '',
        emergencyRelation: '',
        emergencyPhone: '',
        insuranceType: 'BPJS Kesehatan',
        insuranceNumber: '',
        bpjsVerified: false,
        status: 'Aktif'
      });
      setAllergies([]);
      setChronicDiseases([]);
    }
    setErrors({});
  }, [initialData, isOpen]);

  // Auto calculate age from birthDate
  const handleBirthDateChange = (val: string) => {
    // Tanggal lahir di masa depan ditandai sebagai error secara langsung
    // (bukan di-clamp diam-diam) dan juga ditolak saat submit.
    const todayStr = new Date().toISOString().split('T')[0];
    setErrors((prev) => {
      const next = { ...prev };
      if (val && val > todayStr) {
        next.birthDate = 'Tanggal lahir tidak boleh berada di masa depan';
      } else {
        delete next.birthDate;
      }
      return next;
    });
    const birth = new Date(val);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    setFormData((prev) => ({
      ...prev,
      birthDate: val,
      age: Math.max(0, age)
    }));
  };

  const handleAddAllergy = () => {
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      setAllergies((prev) => [...prev, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (tag: string) => {
    setAllergies((prev) => prev.filter((a) => a !== tag));
  };

  const handleAddChronic = () => {
    if (chronicInput.trim() && !chronicDiseases.includes(chronicInput.trim())) {
      setChronicDiseases((prev) => [...prev, chronicInput.trim()]);
      setChronicInput('');
    }
  };

  const handleRemoveChronic = (tag: string) => {
    setChronicDiseases((prev) => prev.filter((c) => c !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Nama lengkap pasien wajib diisi';
    if (!formData.nik.trim()) {
      newErrors.nik = 'NIK KTP wajib diisi';
    } else if (formData.nik.trim().length !== 16) {
      newErrors.nik = 'NIK harus tepat 16 digit angka';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Nomor telepon aktif wajib diisi';
    if (!formData.address.trim()) newErrors.address = 'Alamat domisili wajib diisi';
    if (!formData.birthDate) {
      newErrors.birthDate = 'Tanggal lahir wajib diisi';
    } else if (formData.birthDate > new Date().toISOString().split('T')[0]) {
      newErrors.birthDate = 'Tanggal lahir tidak boleh berada di masa depan';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: formData.name.trim(),
      nik: formData.nik.trim(),
      gender: formData.gender,
      birthDate: formData.birthDate,
      age: formData.age,
      bloodType: formData.bloodType,
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      occupation: formData.occupation.trim(),
      emergencyContact: {
        // Dikosongkan apa adanya bila tidak diisi — sistem tidak mengarang kontak darurat
        name: formData.emergencyName.trim(),
        relation: formData.emergencyRelation.trim(),
        phone: formData.emergencyPhone.trim()
      },
      allergies,
      chronicDiseases,
      insuranceType: formData.insuranceType,
      insuranceNumber: formData.insuranceNumber.trim() || undefined,
      bpjsVerified: formData.insuranceType === 'BPJS Kesehatan' ? formData.bpjsVerified : undefined,
      status: formData.status
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Perbarui Data Pasien' : 'Pendaftaran Pasien Baru'}
      subtitle="Pastikan data identitas kependudukan (KTP/NIK) diinput secara akurat"
      maxWidth="3xl"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit}>
            {initialData ? 'Simpan Perubahan' : 'Daftarkan Pasien'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section: Data Identitas Diri */}
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
          Identitas Pasien
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Input
            label="Nama Lengkap Pasien"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Budi Santoso"
            error={errors.name}
            requiredIndicator
          />
          <Input
            label="NIK (Nomor Induk Kependudukan - 16 Digit)"
            value={formData.nik}
            maxLength={16}
            onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
            placeholder="3171051203850001"
            error={errors.nik}
            requiredIndicator
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <Select
            label="Jenis Kelamin"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as Patient['gender'] })}
            options={[
              { value: 'Laki-laki', label: 'Laki-laki' },
              { value: 'Perempuan', label: 'Perempuan' }
            ]}
          />
          <Input
            label="Tanggal Lahir"
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleBirthDateChange(e.target.value)}
            error={errors.birthDate}
            requiredIndicator
          />
          <Input
            label="Usia Pasien"
            value={`${formData.age} Tahun`}
            readOnly
            className="bg-slate-100 font-mono font-semibold"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <Select
            label="Golongan Darah"
            value={formData.bloodType}
            onChange={(e) => setFormData({ ...formData, bloodType: e.target.value as Patient['bloodType'] })}
            options={[
              { value: 'O+', label: 'O+' },
              { value: 'A+', label: 'A+' },
              { value: 'B+', label: 'B+' },
              { value: 'AB+', label: 'AB+' },
              { value: 'O-', label: 'O-' },
              { value: 'A-', label: 'A-' },
              { value: 'B-', label: 'B-' },
              { value: 'AB-', label: 'AB-' },
              { value: 'Tidak Tahu', label: 'Tidak Tahu' }
            ]}
          />
          <Input
            label="Nomor Telepon / WhatsApp"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="0812-xxxx-xxxx"
            error={errors.phone}
            requiredIndicator
          />
          <Input
            label="Alamat Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="pasien@email.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Input
            label="Alamat Lengkap Domisili"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota"
            error={errors.address}
            requiredIndicator
          />
          <Input
            label="Pekerjaan"
            value={formData.occupation}
            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            placeholder="PNS / Swasta / Wiraswasta / Pelajar"
          />
        </div>

        {/* Section: Penjamin & Asuransi */}
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 pt-2">
          Penjamin Pelayanan
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Select
            label="Jenis Penjamin"
            value={formData.insuranceType}
            onChange={(e) => setFormData({ ...formData, insuranceType: e.target.value as Patient['insuranceType'] })}
            options={[
              { value: 'BPJS Kesehatan', label: 'BPJS Kesehatan' },
              { value: 'Asuransi Swasta', label: 'Asuransi Swasta' },
              { value: 'Umum / Mandiri', label: 'Umum / Pembayaran Mandiri' }
            ]}
          />
          <Input
            label="Nomor Kartu / Polis (BPJS / Asuransi)"
            value={formData.insuranceNumber}
            onChange={(e) => setFormData({ ...formData, insuranceNumber: e.target.value })}
            placeholder="Nomor kartu penjamin jika ada"
          />
          {formData.insuranceType === 'BPJS Kesehatan' && (
            <label className="md:col-span-2 flex items-start gap-2 text-[11px] text-slate-600 bg-clinical-50 border border-clinical-100 rounded-lg px-3 py-2">
              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 accent-clinical-600"
                checked={formData.bpjsVerified}
                onChange={(e) => setFormData({ ...formData, bpjsVerified: e.target.checked })}
              />
              <span>
                <strong>Kepesertaan sudah diverifikasi manual oleh petugas</strong> (cek kartu/NIK di kanal resmi BPJS).
                Verifikasi otomatis lewat bridging P-Care belum terhubung — jangan centang bila belum benar-benar dicek.
              </span>
            </label>
          )}
        </div>

        {/* Section: Kontak Darurat */}
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 pt-2">
          Kontak Darurat
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <Input
            label="Nama Kontak Darurat"
            value={formData.emergencyName}
            onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
            placeholder="Nama keluarga terdekat"
          />
          <Input
            label="Hubungan"
            value={formData.emergencyRelation}
            onChange={(e) => setFormData({ ...formData, emergencyRelation: e.target.value })}
            placeholder="Suami / Istri / Orang Tua / Anak"
          />
          <Input
            label="Nomor Telepon Darurat"
            value={formData.emergencyPhone}
            onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
            placeholder="0812-xxxx-xxxx"
          />
        </div>

        {/* Section: Informasi Klinis Khusus (Alergi & Riwayat Kronis) */}
        <div className="text-xs font-bold uppercase tracking-wider text-red-600 border-b border-red-100 pb-1 pt-2 flex items-center justify-between">
          <span>Riwayat Alergi (Sangat Penting)</span>
        </div>
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAllergy();
                }
              }}
              placeholder="Contoh: Penicillin, Aspirin, Seafood, Kacang..."
              className="flex-1 text-xs bg-white rounded-lg border border-slate-300 py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAllergy}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Tambah
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {allergies.length === 0 ? (
              <span className="text-[11px] text-slate-400 italic">Tidak ada catatan alergi</span>
            ) : (
              allergies.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200"
                >
                  {a}
                  <button type="button" onClick={() => handleRemoveAllergy(a)} className="hover:text-red-950">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        <div className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-1 pt-2">
          Riwayat Penyakit Kronis
        </div>
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={chronicInput}
              onChange={(e) => setChronicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddChronic();
                }
              }}
              placeholder="Contoh: Hipertensi, Diabetes Melitus, Asma..."
              className="flex-1 text-xs bg-white rounded-lg border border-slate-300 py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-clinical-500"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddChronic}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Tambah
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {chronicDiseases.length === 0 ? (
              <span className="text-[11px] text-slate-400 italic">Tidak ada catatan penyakit kronis</span>
            ) : (
              chronicDiseases.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200"
                >
                  {c}
                  <button type="button" onClick={() => handleRemoveChronic(c)} className="hover:text-amber-950">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
