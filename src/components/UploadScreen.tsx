import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  Trash2,
  Download,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { MenuItem, TransactionRow } from '../types';
import { parseCsvFile } from '../utils/csvParser';
import {
  validateCrossConsistency,
  validateMenuData,
  validateTransaksiData,
} from '../utils/csvValidator';
import {
  generateSampleCsvStrings,
} from '../utils/sampleDataGenerator';

interface UploadScreenProps {
  onDataProcessed: (
    transactions: TransactionRow[],
    menus: MenuItem[],
    businessName: string
  ) => void;
  onUseSampleData: () => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({
  onDataProcessed,
  onUseSampleData,
}) => {
  // Transaksi state
  const [txFile, setTxFile] = useState<File | null>(null);
  const [txRows, setTxRows] = useState<TransactionRow[] | null>(null);
  const [txErrors, setTxErrors] = useState<string[]>([]);
  const [txDragActive, setTxDragActive] = useState(false);

  // Menu state
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [menuRows, setMenuRows] = useState<MenuItem[] | null>(null);
  const [menuErrors, setMenuErrors] = useState<string[]>([]);
  const [menuDragActive, setMenuDragActive] = useState(false);

  // Cross validation errors
  const [crossErrors, setCrossErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const txInputRef = useRef<HTMLInputElement>(null);
  const menuInputRef = useRef<HTMLInputElement>(null);

  // Handle Transaksi file
  const handleTransaksiFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setTxErrors(['File harus berformat .csv']);
      setTxFile(null);
      setTxRows(null);
      return;
    }

    setTxFile(file);
    setTxErrors([]);
    setCrossErrors([]);

    const parsed = await parseCsvFile<Record<string, string>>(file);
    if (parsed.errors.length > 0) {
      setTxErrors(parsed.errors.slice(0, 5));
      setTxRows(null);
      return;
    }

    const validation = validateTransaksiData(parsed.data, parsed.fields);
    if (!validation.isValid) {
      setTxErrors(validation.errors);
      setTxRows(null);
    } else {
      setTxRows(validation.data);
      if (menuRows) {
        const cross = validateCrossConsistency(validation.data, menuRows);
        setCrossErrors(cross.errors);
      }
    }
  };

  // Handle Menu file
  const handleMenuFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setMenuErrors(['File harus berformat .csv']);
      setMenuFile(null);
      setMenuRows(null);
      return;
    }

    setMenuFile(file);
    setMenuErrors([]);
    setCrossErrors([]);

    const parsed = await parseCsvFile<Record<string, string>>(file);
    if (parsed.errors.length > 0) {
      setMenuErrors(parsed.errors.slice(0, 5));
      setMenuRows(null);
      return;
    }

    const validation = validateMenuData(parsed.data, parsed.fields);
    if (!validation.isValid) {
      setMenuErrors(validation.errors);
      setMenuRows(null);
    } else {
      setMenuRows(validation.data);
      if (txRows) {
        const cross = validateCrossConsistency(txRows, validation.data);
        setCrossErrors(cross.errors);
      }
    }
  };

  const handleDownloadSampleCsv = () => {
    const { transaksiCsv, menuCsv } = generateSampleCsvStrings();

    // Download transaksi.csv
    const blobTx = new Blob([transaksiCsv], { type: 'text/csv;charset=utf-8;' });
    const urlTx = URL.createObjectURL(blobTx);
    const linkTx = document.createElement('a');
    linkTx.href = urlTx;
    linkTx.setAttribute('download', 'contoh_transaksi.csv');
    document.body.appendChild(linkTx);
    linkTx.click();
    document.body.removeChild(linkTx);
    URL.revokeObjectURL(urlTx);

    // Download menu.csv
    setTimeout(() => {
      const blobMenu = new Blob([menuCsv], { type: 'text/csv;charset=utf-8;' });
      const urlMenu = URL.createObjectURL(blobMenu);
      const linkMenu = document.createElement('a');
      linkMenu.href = urlMenu;
      linkMenu.setAttribute('download', 'contoh_menu.csv');
      document.body.appendChild(linkMenu);
      linkMenu.click();
      document.body.removeChild(linkMenu);
      URL.revokeObjectURL(urlMenu);
    }, 200);
  };

  const isFormValid =
    txRows !== null &&
    txRows.length > 0 &&
    menuRows !== null &&
    menuRows.length > 0 &&
    txErrors.length === 0 &&
    menuErrors.length === 0 &&
    crossErrors.length === 0;

  const handleAnalyzeClick = () => {
    if (!isFormValid || !txRows || !menuRows) return;
    setIsProcessing(true);
    const bName = txFile ? txFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : 'Kedai Kopi';
    onDataProcessed(txRows, menuRows, bName);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B9E4E8]/40 text-[#071B2B] text-xs font-semibold mb-3">
          <span>Langkah Tepat, Stok Lebih Akurat</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#071B2B]">
          Kenali Pola Penjualan Kedaimu
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#5A6B7C] leading-relaxed">
          Upload data penjualan dan biarkan STEPS membantu menemukan pola bisnis kedaimu secara akurat.
        </p>
      </div>

      {/* Quick Action Bar: Sample Data & Download Sample */}
      <div className="bg-white border border-[#D1DCE5] rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B9E4E8]/30 text-[#167D8D] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#071B2B]">
              Ingin langsung melihat cara kerjanya?
            </h2>
            <p className="text-xs text-[#5A6B7C]">
              Gunakan dataset simulasi 60 hari Kopi Senja (Tangerang Selatan, 12 menu).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#071B2B] bg-[#B9E4E8]/30 hover:bg-[#B9E4E8]/60 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#167D8D]" />
            <span>Unduh Contoh CSV</span>
          </button>
          <button
            type="button"
            onClick={onUseSampleData}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#167D8D] hover:bg-[#11626F] rounded-xl transition-all shadow-xs whitespace-nowrap cursor-pointer active:scale-98"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B9E4E8]" />
            <span>Pakai Data Contoh</span>
          </button>
        </div>
      </div>

      {/* Upload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Card A: Transaksi CSV */}
        <div className="bg-white border border-[#D1DCE5] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#167D8D]" />
                <h3 className="text-base font-semibold text-[#071B2B]">
                  1. File Transaksi (transaksi.csv)
                </h3>
              </div>
              {txRows && txErrors.length === 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Valid ({txRows.length} baris)
                </span>
              ) : txErrors.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Belum Valid
                </span>
              ) : (
                <span className="text-xs text-[#5A6B7C]">Wajib diisi</span>
              )}
            </div>

            <p className="text-xs text-[#5A6B7C] mb-4">
              Kolom wajib: <code className="font-mono text-[#071B2B] bg-[#EEEEEE] px-1 py-0.5 rounded">tanggal</code>,{' '}
              <code className="font-mono text-[#071B2B] bg-[#EEEEEE] px-1 py-0.5 rounded">jam</code>,{' '}
              <code className="font-mono text-[#071B2B] bg-[#EEEEEE] px-1 py-0.5 rounded">nama_menu</code>,{' '}
              <code className="font-mono text-[#071B2B] bg-[#EEEEEE] px-1 py-0.5 rounded">qty</code>
            </p>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setTxDragActive(true);
              }}
              onDragLeave={() => setTxDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setTxDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleTransaksiFile(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
                txDragActive
                  ? 'border-[#167D8D] bg-[#B9E4E8]/20'
                  : txRows
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : 'border-[#CBD5E1] hover:border-[#167D8D] bg-[#F8FAFC]'
              }`}
            >
              <input
                ref={txInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleTransaksiFile(e.target.files[0]);
                  }
                }}
              />

              {txFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white text-[#167D8D] flex items-center justify-center border border-[#D1DCE5]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-[#071B2B] truncate max-w-[240px]">
                      {txFile.name}
                    </p>
                    <p className="text-[#5A6B7C]">
                      {(txFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => txInputRef.current?.click()}
                      className="px-2.5 py-1 text-[11px] font-medium text-[#167D8D] bg-white border border-[#D1DCE5] rounded-lg hover:bg-[#EEEEEE]"
                    >
                      Ganti File
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTxFile(null);
                        setTxRows(null);
                        setTxErrors([]);
                        if (txInputRef.current) txInputRef.current.value = '';
                      }}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Hapus file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="cursor-pointer" onClick={() => txInputRef.current?.click()}>
                  <UploadCloud className="w-8 h-8 text-[#167D8D] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-[#071B2B]">
                    Klik untuk upload atau drag & drop file
                  </p>
                  <p className="text-[11px] text-[#5A6B7C] mt-0.5">
                    Hanya mendukung format .CSV
                  </p>
                </div>
              )}
            </div>

            {/* Error alerts */}
            {txErrors.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Ditemukan kesalahan pada file transaksi:
                </p>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  {txErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center gap-1 text-[11px] text-[#5A6B7C]">
            <Info className="w-3 h-3 text-[#167D8D] shrink-0" />
            <span>Format jam yang didukung: HH:mm atau HH:mm:ss (contoh: 07:30)</span>
          </div>
        </div>

        {/* Card B: Menu CSV */}
        <div className="bg-white border border-[#D1DCE5] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#167D8D]" />
                <h3 className="text-base font-semibold text-[#071B2B]">
                  2. File Master Menu (menu.csv)
                </h3>
              </div>
              {menuRows && menuErrors.length === 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Valid ({menuRows.length} menu)
                </span>
              ) : menuErrors.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Belum Valid
                </span>
              ) : (
                <span className="text-xs text-[#5A6B7C]">Wajib diisi</span>
              )}
            </div>

            <p className="text-xs text-[#5A6B7C] mb-4">
              Kolom wajib: <code className="font-mono text-[#071B2B] bg-[#EEEEEE] px-1 py-0.5 rounded">nama_menu</code>,{' '}
              <code className="font-mono text-[#071B2B] bg-[#EEEEEE] px-1 py-0.5 rounded">kategori</code>,{' '}
              <code className="font-mono text-[#071B2B] bg-[#EEEEEE] px-1 py-0.5 rounded">harga_jual</code>,{' '}
              <code className="font-mono text-[#071B2B] bg-[#EEEEEE] px-1 py-0.5 rounded">hpp</code>
            </p>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setMenuDragActive(true);
              }}
              onDragLeave={() => setMenuDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setMenuDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleMenuFile(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
                menuDragActive
                  ? 'border-[#167D8D] bg-[#B9E4E8]/20'
                  : menuRows
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : 'border-[#CBD5E1] hover:border-[#167D8D] bg-[#F8FAFC]'
              }`}
            >
              <input
                ref={menuInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleMenuFile(e.target.files[0]);
                  }
                }}
              />

              {menuFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white text-[#167D8D] flex items-center justify-center border border-[#D1DCE5]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-[#071B2B] truncate max-w-[240px]">
                      {menuFile.name}
                    </p>
                    <p className="text-[#5A6B7C]">
                      {(menuFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => menuInputRef.current?.click()}
                      className="px-2.5 py-1 text-[11px] font-medium text-[#167D8D] bg-white border border-[#D1DCE5] rounded-lg hover:bg-[#EEEEEE]"
                    >
                      Ganti File
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuFile(null);
                        setMenuRows(null);
                        setMenuErrors([]);
                        if (menuInputRef.current) menuInputRef.current.value = '';
                      }}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Hapus file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="cursor-pointer" onClick={() => menuInputRef.current?.click()}>
                  <UploadCloud className="w-8 h-8 text-[#167D8D] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-[#071B2B]">
                    Klik untuk upload atau drag & drop file
                  </p>
                  <p className="text-[11px] text-[#5A6B7C] mt-0.5">
                    Hanya mendukung format .CSV
                  </p>
                </div>
              )}
            </div>

            {/* Error alerts */}
            {menuErrors.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Ditemukan kesalahan pada file menu:
                </p>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  {menuErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center gap-1 text-[11px] text-[#5A6B7C]">
            <Info className="w-3 h-3 text-[#167D8D] shrink-0" />
            <span>HPP (Harga Pokok Penjualan) tidak boleh melebihi harga jual</span>
          </div>
        </div>
      </div>

      {/* Cross-Validation Errors */}
      {crossErrors.length > 0 && (
        <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 shadow-xs">
          <p className="font-semibold flex items-center gap-2 mb-2 text-sm text-amber-950">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            Ketidaksesuaian Antara Transaksi & Master Menu:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            {crossErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          disabled={!isFormValid || isProcessing}
          onClick={handleAnalyzeClick}
          className={`w-full sm:w-auto min-w-[280px] px-8 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm ${
            isFormValid && !isProcessing
              ? 'bg-[#167D8D] hover:bg-[#11626F] text-white active:scale-98 cursor-pointer ring-1 ring-[#167D8D]'
              : 'bg-[#CBD5E1] text-[#64748B] cursor-not-allowed'
          }`}
        >
          <span>{isProcessing ? 'Memproses Data...' : 'Analisis Penjualan'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-xs text-[#5A6B7C] mt-2.5">
          {isFormValid
            ? 'Kedua file sudah valid dan siap dianalisis.'
            : 'Upload kedua file CSV dengan format yang valid untuk mengaktifkan tombol analisis.'}
        </p>
      </div>
    </div>
  );
};
