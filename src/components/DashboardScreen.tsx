import React, { useState } from 'react';
import {
  TrendingUp,
  Package,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Info,
  Layers,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { AnalyticsResult } from '../types';
import {
  formatDecimal,
  formatHour,
  formatNumber,
  formatPercent,
  formatRupiah,
} from '../utils/formatters';

interface DashboardScreenProps {
  analytics: AnalyticsResult;
  onNavigateToRecommendations: () => void;
  onBackToUpload: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  analytics,
  onNavigateToRecommendations,
  onBackToUpload,
}) => {
  const {
    summary,
    hourlyStats,
    busyHoursList,
    normalHoursList,
    slowHoursList,
    busyHourTopMenus,
    insights,
  } = analytics;

  const [selectedHourFilter, setSelectedHourFilter] = useState<string>('all');

  // Chart data
  const chartData = hourlyStats.map((h) => ({
    hour: h.displayHour,
    rawHour: h.hour,
    averageQty: h.averageQty,
    totalQty: h.totalQty,
    txCount: h.transactionCount,
    classification: h.classification,
  }));

  const uniqueBusyHours = Array.from(new Set(busyHourTopMenus.map((m) => m.hour)));

  const filteredMenus =
    selectedHourFilter === 'all'
      ? busyHourTopMenus
      : busyHourTopMenus.filter((m) => m.hour === selectedHourFilter);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const statusLabel =
        data.classification === 'busy'
          ? 'Jam Ramai'
          : data.classification === 'slow'
          ? 'Jam Sepi'
          : 'Jam Normal';
      const statusColor =
        data.classification === 'busy'
          ? 'text-[#071B2B] bg-[#B9E4E8]'
          : data.classification === 'slow'
          ? 'text-[#5A6B7C] bg-[#EEEEEE]'
          : 'text-[#167D8D] bg-[#B9E4E8]/25';

      return (
        <div className="bg-white border border-[#D1DCE5] rounded-xl p-3 shadow-md text-xs">
          <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-[#E2E8F0]">
            <span className="font-bold text-[#071B2B]">Pukul {data.hour}</span>
            <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <div className="space-y-1 text-[#4A5568]">
            <p className="flex justify-between gap-4">
              <span>Rata-rata Terjual:</span>
              <strong className="text-[#071B2B] tabular-nums font-semibold">
                {formatDecimal(data.averageQty)} cup/hari
              </strong>
            </p>
            <p className="flex justify-between gap-4">
              <span>Total Periode:</span>
              <span className="text-[#071B2B] tabular-nums">
                {formatNumber(data.totalQty)} cup ({data.txCount} transaksi)
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Top Header with Context & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D1DCE5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#167D8D] uppercase tracking-wider">
              {summary.businessName}
            </span>
            <span className="text-xs text-[#5A6B7C]">·</span>
            <span className="text-xs text-[#5A6B7C]">
              Periode {summary.totalDays} hari ({summary.periodStart} s/d {summary.periodEnd})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#071B2B] mt-1">
            Ringkasan Penjualan {summary.businessName}
          </h1>
          <p className="text-sm text-[#5A6B7C] mt-1">
            Berikut pola penjualan kedaimu berdasarkan data transaksi deterministik.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBackToUpload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#5A6B7C] hover:text-[#071B2B] bg-white border border-[#D1DCE5] hover:bg-[#EEEEEE] rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#167D8D]" />
            <span>Ganti Data</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToRecommendations}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#167D8D] hover:bg-[#11626F] rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-[#B9E4E8]" />
            <span>Lihat Rekomendasi AI</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>

      {/* 1. KARTU RINGKASAN (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Omzet */}
        <div className="bg-white border border-[#D1DCE5] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5A6B7C] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#071B2B]">Total Omzet</span>
            <div className="w-8 h-8 rounded-lg bg-[#B9E4E8]/30 text-[#167D8D] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#071B2B] tabular-nums tracking-tight">
              {formatRupiah(summary.totalRevenue)}
            </div>
            <p className="text-xs text-[#5A6B7C] mt-1">
              Dari {formatNumber(summary.totalTransactions)} transaksi dicatat
            </p>
          </div>
        </div>

        {/* Card 2: Total Produk Terjual */}
        <div className="bg-white border border-[#D1DCE5] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5A6B7C] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#071B2B]">Produk Terjual</span>
            <div className="w-8 h-8 rounded-lg bg-[#B9E4E8]/30 text-[#167D8D] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#071B2B] tabular-nums tracking-tight">
              {formatNumber(summary.totalQty)} <span className="text-base font-medium text-[#5A6B7C]">cup/item</span>
            </div>
            <p className="text-xs text-[#5A6B7C] mt-1">
              Rata-rata {formatDecimal(summary.totalQty / summary.totalDays)} porsi per hari
            </p>
          </div>
        </div>

        {/* Card 3: Jam Paling Ramai */}
        <div className="bg-white border border-[#D1DCE5] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5A6B7C] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#071B2B]">Jam Paling Ramai</span>
            <div className="w-8 h-8 rounded-lg bg-[#B9E4E8]/30 text-[#167D8D] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#071B2B] tabular-nums tracking-tight">
              Pukul {formatHour(summary.peakHour)}
            </div>
            <p className="text-xs text-[#5A6B7C] mt-1">
              Puncak rata-rata {formatDecimal(summary.peakHourQty)} produk/hari
            </p>
          </div>
        </div>

        {/* Card 4: Hari Terlaris */}
        <div className="bg-white border border-[#D1DCE5] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5A6B7C] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#071B2B]">Hari Terlaris</span>
            <div className="w-8 h-8 rounded-lg bg-[#B9E4E8]/30 text-[#167D8D] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#071B2B] tracking-tight">
              {summary.busiestDay}
            </div>
            <p className="text-xs text-[#5A6B7C] mt-1">
              Hari tersepi:{' '}
              <span className="font-semibold text-[#071B2B]">{summary.slowestDay}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. GRAFIK RATA-RATA TRANSAKSI PER JAM & 3. KARTU INFORMASI JAM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white border border-[#D1DCE5] rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-[#071B2B]">
                Rata-rata Produk Terjual per Jam Operasional
              </h2>
              <p className="text-xs text-[#5A6B7C]">
                Berdasarkan {summary.totalDays} hari operasional (07.00 - 21.00)
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#167D8D]" />
                <span className="text-[#071B2B] font-semibold">Jam Ramai</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#71B8C2]" />
                <span className="text-[#5A6B7C]">Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#CBD5E1]" />
                <span className="text-[#5A6B7C]">Sepi</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="hour"
                  stroke="#5A6B7C"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#D1DCE5' }}
                />
                <YAxis
                  stroke="#5A6B7C"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#D1DCE5' }}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={analytics.summary.overallAvgQtyPerHour}
                  stroke="#167D8D"
                  strokeDasharray="3 3"
                  label={{
                    value: `Rata-rata (${formatDecimal(analytics.summary.overallAvgQtyPerHour)})`,
                    position: 'insideTopRight',
                    fill: '#167D8D',
                    fontSize: 10,
                  }}
                />
                <Bar dataKey="averageQty" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => {
                    let fill = '#71B8C2'; // normal
                    if (entry.classification === 'busy') fill = '#167D8D'; // busy
                    if (entry.classification === 'slow') fill = '#CBD5E1'; // slow
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5A6B7C]">
            <span>Garis putus-putus menandakan rata-rata penjualan keseluruhan jam operasional.</span>
            <span className="font-semibold text-[#167D8D]">
              Ambang Ramai: ≥ {formatDecimal(analytics.summary.overallAvgQtyPerHour * 1.3)} cup/jam
            </span>
          </div>
        </div>

        {/* 3. KARTU INFORMASI JAM & STATUS (1 col on lg) */}
        <div className="bg-white border border-[#D1DCE5] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#071B2B] mb-1">
              Klasifikasi Jam Operasional
            </h2>
            <p className="text-xs text-[#5A6B7C] mb-5">
              Dikelompokkan secara otomatis berdasarkan perbandingan dengan rata-rata penjualan.
            </p>

            <div className="space-y-4">
              {/* Jam Ramai */}
              <div className="p-3.5 rounded-xl bg-[#F0F9FA] border border-[#167D8D]/30">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-[#167D8D]" />
                  <span className="text-xs font-bold text-[#167D8D] uppercase tracking-wider">
                    Jam Ramai (Peak Hours)
                  </span>
                </div>
                <p className="text-base font-bold text-[#071B2B] mt-1">
                  {busyHoursList.length > 0 ? busyHoursList.join(' | ') : 'Tidak terdeteksi'}
                </p>
                <p className="text-[11px] text-[#5A6B7C] mt-0.5">
                  Rata-rata penjualan ≥ 1,3x dari rata-rata normal.
                </p>
              </div>

              {/* Jam Normal */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#D1DCE5]">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-[#71B8C2]" />
                  <span className="text-xs font-bold text-[#5A6B7C] uppercase tracking-wider">
                    Jam Normal
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#071B2B] mt-1">
                  {normalHoursList.length > 0 ? normalHoursList.join(' | ') : 'Tidak terdeteksi'}
                </p>
                <p className="text-[11px] text-[#5A6B7C] mt-0.5">
                  Aliran pesanan stabil mendekati rata-rata harian.
                </p>
              </div>

              {/* Jam Sepi */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#D1DCE5]">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-[#94A3B8]" />
                  <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                    Jam Sepi (Slow Hours)
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#071B2B] mt-1">
                  {slowHoursList.length > 0 ? slowHoursList.join(' | ') : 'Tidak terdeteksi'}
                </p>
                <p className="text-[11px] text-[#5A6B7C] mt-0.5">
                  Rata-rata penjualan ≤ 0,7x dari rata-rata normal.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E2E8F0] text-xs text-[#5A6B7C] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#167D8D] shrink-0" />
            <span>AI akan fokus mengoptimalkan persiapan stok pada Jam Ramai.</span>
          </div>
        </div>
      </div>

      {/* 4. TABEL MENU ANDALAN PER JAM RAMAI */}
      <div className="bg-white border border-[#D1DCE5] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#071B2B] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#167D8D]" />
              <span>Menu Andalan di Jam Ramai</span>
            </h2>
            <p className="text-xs text-[#5A6B7C] mt-0.5">
              Maksimal 3 menu dengan kuantitas penjualan tertinggi pada setiap jam ramai.
            </p>
          </div>

          {/* Filter tabs if multiple busy hours */}
          {uniqueBusyHours.length > 1 && (
            <div className="flex items-center gap-1 bg-[#EEEEEE] p-1 rounded-xl text-xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedHourFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedHourFilter === 'all'
                    ? 'bg-white text-[#167D8D] font-bold shadow-xs'
                    : 'text-[#5A6B7C] hover:text-[#071B2B]'
                }`}
              >
                Semua Jam Ramai
              </button>
              {uniqueBusyHours.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setSelectedHourFilter(h)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedHourFilter === h
                      ? 'bg-white text-[#167D8D] font-bold shadow-xs'
                      : 'text-[#5A6B7C] hover:text-[#071B2B]'
                  }`}
                >
                  Pukul {formatHour(h)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        {filteredMenus.length > 0 ? (
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#D1DCE5] bg-[#F8FAFC] text-[#5A6B7C] text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4 rounded-l-lg">Jam</th>
                  <th className="py-3 px-4">Nama Menu</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Qty Terjual</th>
                  <th className="py-3 px-4 text-right">Total Omzet</th>
                  <th className="py-3 px-4 text-right rounded-r-lg">Margin Kotor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredMenus.map((row, idx) => (
                  <tr
                    key={`${row.hour}-${row.menuName}-${idx}`}
                    className="hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-[#167D8D] tabular-nums whitespace-nowrap">
                      Pukul {formatHour(row.hour)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#071B2B] whitespace-nowrap">
                      {row.menuName}
                    </td>
                    <td className="py-3.5 px-4 text-[#5A6B7C] whitespace-nowrap">
                      {row.category}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#071B2B] tabular-nums whitespace-nowrap">
                      {formatNumber(row.qty)} <span className="font-normal text-xs text-[#5A6B7C]">cup</span>
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums text-[#071B2B] whitespace-nowrap">
                      {formatRupiah(row.revenue)}
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          row.marginPercent < 45
                            ? 'text-amber-800'
                            : 'text-emerald-700'
                        }`}
                      >
                        {formatPercent(row.marginPercent)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-[#5A6B7C] text-xs">
            <p>Tidak ada transaksi pada jam yang dipilih.</p>
          </div>
        )}
      </div>

      {/* 5. INSIGHT SINGKAT: "Apa yang Terjadi di Kedaimu?" */}
      <div className="bg-[#B9E4E8]/20 border border-[#B9E4E8] rounded-2xl p-5 sm:p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#071B2B] mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-[#167D8D]" />
          <span>Apa yang Terjadi di Kedaimu?</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-[#D1DCE5] text-xs text-[#071B2B] leading-relaxed shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-[#167D8D] shrink-0 mt-0.5" />
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA to Recommendation Screen */}
      <div className="bg-[#071B2B] rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md border border-[#167D8D]/40">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-lg sm:text-xl font-bold">
            Siap optimalkan persiapan stok dan strategi kedaimu?
          </h2>
          <p className="text-xs sm:text-sm text-[#B9E4E8]">
            Dapatkan rekomendasi porsi persiapan sebelum jam ramai dan ide promo jam sepi dari AI.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToRecommendations}
          className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-[#071B2B] bg-[#B9E4E8] hover:bg-white rounded-xl transition-all shadow-md shrink-0 active:scale-98 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#167D8D]" />
          <span>Buka Rekomendasi AI</span>
          <ArrowRight className="w-4 h-4 text-[#167D8D]" />
        </button>
      </div>
    </div>
  );
};
