import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Clock,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Info,
  PackageCheck,
  Tag,
} from 'lucide-react';
import {
  AIRecommendations,
  AnalyticsResult,
  GeminiInputPayload,
} from '../types';
import { fetchAIRecommendations } from '../services/geminiService';
import { buildGeminiPayload } from '../utils/analytics';
import {
  formatDecimal,
  formatHour,
  formatNumber,
  formatPercent,
  formatRupiah,
} from '../utils/formatters';

interface RecommendationScreenProps {
  analytics: AnalyticsResult;
  onBackToDashboard: () => void;
  onBackToUpload: () => void;
}

export const RecommendationScreen: React.FC<RecommendationScreenProps> = ({
  analytics,
  onBackToDashboard,
  onBackToUpload,
}) => {
  const [recommendations, setRecommendations] = useState<AIRecommendations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const payload: GeminiInputPayload = buildGeminiPayload(analytics);

  const loadRecommendations = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchAIRecommendations(payload);
      setRecommendations(res.recommendations);
      setIsAiGenerated(res.isAiGenerated);
      if (res.errorMessage) {
        setErrorMessage(res.errorMessage);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D1DCE5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#167D8D] uppercase tracking-wider">
              {analytics.summary.businessName}
            </span>
            <span className="text-xs text-[#5A6B7C]">·</span>
            <span className="text-xs text-[#5A6B7C]">Rekomendasi Bisnis & Persiapan Stok</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#071B2B] mt-1">
            Rekomendasi untuk Kedaimu
          </h1>
          <p className="text-sm text-[#5A6B7C] mt-1">
            AI membantu menerjemahkan data penjualan menjadi langkah yang bisa langsung kamu lakukan.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#5A6B7C] hover:text-[#071B2B] bg-white border border-[#D1DCE5] hover:bg-[#EEEEEE] rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#167D8D]" />
            <span>Kembali ke Dashboard</span>
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={loadRecommendations}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
              isLoading
                ? 'bg-[#EEEEEE] text-[#5A6B7C] border-[#D1DCE5] cursor-not-allowed'
                : 'bg-white text-[#167D8D] border-[#167D8D]/40 hover:bg-[#B9E4E8]/20 cursor-pointer'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#167D8D]' : ''}`} />
            <span>{isLoading ? 'Menganalisis...' : 'Coba Analisis AI Lagi'}</span>
          </button>
        </div>
      </div>

      {/* Loading State Banner */}
      {isLoading && (
        <div className="bg-white border border-[#D1DCE5] rounded-2xl p-8 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#B9E4E8]/40 text-[#167D8D] flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h2 className="text-base font-bold text-[#071B2B]">
            Sedang menganalisis peluang kedaimu...
          </h2>
          <p className="text-xs text-[#5A6B7C] max-w-md mx-auto">
            AI sedang menelaah korelasi jam ramai, rasio stok aman (+15% buffer), dan celah profitabilitas dari data transaksimu.
          </p>
        </div>
      )}

      {/* Fallback Notice if AI is not directly active or errored */}
      {!isLoading && errorMessage && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-xs text-amber-900 shadow-xs">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">
              Menampilkan Rekomendasi Mesin Stok Deterministik STEPS
            </p>
            <p className="text-amber-800 leading-relaxed">
              {errorMessage}. Rekomendasi porsi stok dan audit margin di bawah ini tetap dihitung 100% secara akurat oleh rumus deterministik aplikasi kami.
            </p>
          </div>
        </div>
      )}

      {/* Active AI Status Pill */}
      {!isLoading && isAiGenerated && (
        <div className="bg-white border border-[#167D8D]/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-[#167D8D]">
            <Sparkles className="w-4 h-4 shrink-0 text-[#167D8D]" />
            <span className="font-semibold text-[#071B2B]">
              Rekomendasi disusun cerdas oleh Gemini AI Business Advisor
            </span>
          </div>
          <span className="text-[#5A6B7C] text-[11px] hidden sm:inline">
            Seluruh angka porsi dihitung deterministik oleh sistem STEPS.
          </span>
        </div>
      )}

      {/* General Insight Banner */}
      {recommendations && recommendations.general_insight && (
        <div className="bg-[#071B2B] text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#167D8D]/40">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#167D8D] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-[#B9E4E8]" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#B9E4E8]">
                Ringkasan Strategi Bisnis
              </span>
              <p className="text-sm sm:text-base font-semibold mt-1 leading-relaxed text-white">
                "{recommendations.general_insight}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KARTU A: PERSIAPAN STOK (Siapkan Sebelum Ramai) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg font-bold text-[#071B2B] flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-[#167D8D]" />
              <span>Siapkan Sebelum Ramai</span>
            </h2>
            <p className="text-xs text-[#5A6B7C]">
              Rekomendasi porsi siap saji / pre-batch sebelum jam ramai (+15% safety buffer).
            </p>
          </div>
          <span className="text-[11px] text-[#5A6B7C]">
            *Estimasi porsi menu siap saji, bukan gramatur bahan baku mentah.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.stockRecommendations.map((stockItem, idx) => {
            const aiExp = recommendations?.stock_explanations.find(
              (e) => e.hour === stockItem.hour && e.menu === stockItem.menu
            );

            return (
              <div
                key={`stock-${stockItem.hour}-${stockItem.menu}-${idx}`}
                className="bg-white border border-[#D1DCE5] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-[#167D8D] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#E2E8F0]">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#B9E4E8]/30 text-[#071B2B]">
                      <Clock className="w-3.5 h-3.5 text-[#167D8D]" />
                      Pukul {formatHour(stockItem.hour)}
                    </span>
                    <span className="text-[11px] text-[#5A6B7C]">
                      Buffer 15%
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#071B2B]">
                    {stockItem.menu}
                  </h3>

                  <div className="my-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#D1DCE5] flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-[#5A6B7C] block">
                        Rata-rata Penjualan
                      </span>
                      <span className="text-xs font-semibold text-[#071B2B] tabular-nums">
                        {formatDecimal(stockItem.average_qty)} cup/hari
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-[#167D8D] font-bold block">
                        Rekomendasi Siap Stok
                      </span>
                      <span className="text-xl font-bold text-[#167D8D] tabular-nums">
                        {stockItem.recommended_portions}{' '}
                        <span className="text-xs font-normal text-[#5A6B7C]">porsi</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#4A5568] leading-relaxed italic">
                    "{aiExp?.explanation ||
                      `Siapkan sekitar ${stockItem.recommended_portions} porsi sebelum memasuki jam ${formatHour(stockItem.hour)} agar proses pembuatan lancar.`}"
                  </p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#5A6B7C]">
                  <span>Formula: Math.ceil(avg * 1.15)</span>
                  <span className="font-semibold text-[#167D8D]">Terverifikasi Kode</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KARTU B: STRATEGI PROMO JAM SEPI (Manfaatkan Jam Sepi) */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-lg font-bold text-[#071B2B] flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#167D8D]" />
            <span>Manfaatkan Jam Sepi</span>
          </h2>
          <p className="text-xs text-[#5A6B7C]">
            Ide promo taktis untuk meningkatkan transaksi saat aktivitas kedai melambat.
          </p>
        </div>

        {recommendations && recommendations.slow_hour_promotions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slow_hour_promotions.map((promo, idx) => (
              <div
                key={`promo-${promo.hour}-${idx}`}
                className="bg-white border border-[#D1DCE5] rounded-2xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#E2E8F0]">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EEEEEE] text-[#071B2B]">
                      <Clock className="w-3.5 h-3.5 text-[#167D8D]" />
                      Pukul {formatHour(promo.hour)}
                    </span>
                    <span className="text-[11px] text-[#5A6B7C]">Target: {promo.target_menu}</span>
                  </div>

                  <h3 className="text-base font-bold text-[#071B2B]">
                    {promo.promotion_name}
                  </h3>

                  <p className="text-xs text-[#4A5568] mt-2 leading-relaxed">
                    {promo.description}
                  </p>

                  <div className="mt-3 p-3 rounded-xl bg-[#B9E4E8]/20 border border-[#B9E4E8]/60 text-xs text-[#071B2B] leading-relaxed">
                    <strong className="text-[#167D8D] block mb-0.5 text-[11px] uppercase tracking-wider font-bold">
                      Alasan Rekomendasi:
                    </strong>
                    {promo.reason}
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#5A6B7C]">
                  <span>Fokus Menu: {promo.target_menu}</span>
                  <span className="text-[#167D8D] font-semibold">Jam Sepi Terdeteksi</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#D1DCE5] rounded-2xl p-6 text-center text-xs text-[#5A6B7C]">
            Tidak ada jam sepi ekstrem yang membutuhkan promo darurat.
          </div>
        )}
      </div>

      {/* KARTU C: PERINGATAN MARGIN (Perhatikan Margin Menu) */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-lg font-bold text-[#071B2B] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Perhatikan Margin Menu</span>
          </h2>
          <p className="text-xs text-[#5A6B7C]">
            Menu dengan volume penjualan tinggi namun margin kotor relatif tipis yang butuh dievaluasi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.lowMarginMenus.map((lm, idx) => {
            const aiWarning = recommendations?.low_margin_warnings.find(
              (w) => w.menu.toLowerCase() === lm.name.toLowerCase()
            );

            return (
              <div
                key={`margin-${lm.name}-${idx}`}
                className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#E2E8F0]">
                    <span className="text-base font-bold text-[#071B2B]">
                      {lm.name}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                      Margin {formatPercent(lm.margin_percent)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[11px] text-[#5A6B7C] block">Total Terjual</span>
                      <strong className="text-sm text-[#071B2B] tabular-nums">
                        {formatNumber(lm.qty)} cup
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[11px] text-[#5A6B7C] block">Total Omzet</span>
                      <strong className="text-sm text-[#071B2B] tabular-nums">
                        {formatRupiah(lm.revenue)}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    <div className="p-3 rounded-xl bg-amber-50/60 text-xs text-amber-950 leading-relaxed border border-amber-100">
                      <strong className="block text-amber-800 text-[11px] uppercase tracking-wider mb-0.5">
                        Peringatan:
                      </strong>
                      {aiWarning?.warning ||
                        `Menu ini berkontribusi besar pada omzet, namun margin kotor ${formatPercent(
                          lm.margin_percent
                        )} lebih tipis dibanding menu lainnya.`}
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8FAFC] text-xs text-[#071B2B] leading-relaxed border border-[#D1DCE5]">
                      <strong className="block text-[#167D8D] text-[11px] uppercase tracking-wider mb-0.5">
                        Saran Perbaikan:
                      </strong>
                      {aiWarning?.suggestion ||
                        'Pertimbangkan negosiasi harga bahan baku susu/sirup dalam volume bulk, kurangi promo potongan langsung, atau dorong bundling dengan pastry.'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#5A6B7C]">
                  <span>Data deterministik dari master menu & transaksi</span>
                  <span className="text-amber-800 font-semibold">Perlu Evaluasi Harga</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#D1DCE5]">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#5A6B7C] hover:text-[#071B2B] bg-white border border-[#D1DCE5] hover:bg-[#EEEEEE] rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#167D8D]" />
          <span>Kembali ke Dashboard Jam Ramai</span>
        </button>

        <button
          type="button"
          onClick={onBackToUpload}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#071B2B] bg-[#B9E4E8]/50 hover:bg-[#B9E4E8] rounded-xl transition-colors cursor-pointer"
        >
          <span>Upload Dataset Lain</span>
        </button>
      </div>
    </div>
  );
};
