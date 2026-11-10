import React from 'react';

interface Props {
  children: React.ReactNode;
  /** ganti nilai ini (mis. id rute) untuk mereset boundary saat berpindah halaman */
  resetKey?: string;
  onGoDashboard?: () => void;
}

interface State {
  error: Error | null;
}

/** Batas kesalahan per halaman: satu modul yang gagal render tidak lagi
 *  mengosongkan seluruh aplikasi — pengguna melihat penjelasan + jalan keluar. */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[RekamMedis] Kesalahan render halaman:', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-4 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm" role="alert">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto text-2xl font-black">!</div>
        <h2 className="text-lg font-bold text-slate-800">Halaman Ini Gagal Dimuat</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Terjadi kesalahan saat menampilkan halaman. Data Anda tetap tersimpan — coba muat ulang,
          atau kembali ke Dashboard. Bila berulang, sampaikan pesan ini ke admin: {this.state.error.message}
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-clinical-700 text-white text-xs font-bold hover:bg-clinical-800"
          >
            Muat Ulang
          </button>
          {this.props.onGoDashboard && (
            <button
              onClick={() => { this.setState({ error: null }); this.props.onGoDashboard?.(); }}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              Ke Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }
}
