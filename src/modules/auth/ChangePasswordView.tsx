import React, { useState } from 'react';
import { KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const ChangePasswordView: React.FC = () => {
  const { currentUser, changePassword } = useStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }
    if (newPassword === oldPassword) {
      setError('Kata sandi baru harus berbeda dari kata sandi lama.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await changePassword(oldPassword, newPassword);
      if (!result.ok) {
        setError(result.error || 'Gagal mengubah kata sandi.');
      } else {
        setSuccess(true);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-clinical-700" />
          Ganti Kata Sandi
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Akun {currentUser.name} ({currentUser.email}) — peran {currentUser.role.toUpperCase()}.
          Kata sandi yang kuat melindungi data rekam medis pasien.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-red-700" role="alert">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-emerald-700" role="status">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">
                Kata sandi berhasil diubah. Gunakan kata sandi baru pada login berikutnya.
              </span>
            </div>
          )}

          <Input
            label="Kata Sandi Lama"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            requiredIndicator
            autoComplete="current-password"
          />
          <Input
            label="Kata Sandi Baru (minimal 8 karakter)"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            requiredIndicator
            autoComplete="new-password"
          />
          <Input
            label="Konfirmasi Kata Sandi Baru"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            requiredIndicator
            autoComplete="new-password"
          />

          <Button type="submit" variant="primary" className="w-full font-bold" disabled={submitting}>
            {submitting ? 'Menyimpan…' : 'Simpan Kata Sandi Baru'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
