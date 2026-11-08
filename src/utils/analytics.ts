import {
  AnalyticsResult,
  BusinessSummary,
  BusyHourTopMenu,
  DayOfWeekStat,
  GeminiInputPayload,
  HourlyStat,
  LowMarginMenuItem,
  MenuItem,
  StockRecommendationItem,
  TransactionRow,
} from '../types';
import { formatDecimal, formatHour, formatNumber, formatPercent, formatRupiah } from './formatters';

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Format hour helper, e.g. 7 -> "07:00"
function padHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

// Group consecutive hours, e.g. [7, 8, 9, 16, 17, 18, 19] -> ["07.00-09.00", "16.00-19.00"]
export function groupConsecutiveHours(hours: number[]): string[] {
  if (hours.length === 0) return [];
  const sorted = [...hours].sort((a, b) => a - b);
  const groups: { start: number; end: number }[] = [];

  let currentStart = sorted[0];
  let currentEnd = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === currentEnd + 1) {
      currentEnd = sorted[i];
    } else {
      groups.push({ start: currentStart, end: currentEnd });
      currentStart = sorted[i];
      currentEnd = sorted[i];
    }
  }
  groups.push({ start: currentStart, end: currentEnd });

  return groups.map(g => {
    const s = String(g.start).padStart(2, '0') + '.00';
    const e = String(g.end).padStart(2, '0') + '.00';
    if (g.start === g.end) {
      return s;
    }
    return `${s}-${e}`;
  });
}

export function computeAnalytics(
  transactions: TransactionRow[],
  menus: MenuItem[],
  businessName = 'Kopi Senja'
): AnalyticsResult {
  // Menu lookup map
  const menuMap = new Map<string, MenuItem>();
  for (const m of menus) {
    menuMap.set(m.nama_menu.toLowerCase(), m);
  }

  // 1. Identify distinct operational dates
  const distinctDates = new Set<string>();
  for (const t of transactions) {
    distinctDates.add(t.tanggal);
  }
  const totalDays = Math.max(distinctDates.size, 1);
  const sortedDates = Array.from(distinctDates).sort();
  const periodStart = sortedDates[0] || '';
  const periodEnd = sortedDates[sortedDates.length - 1] || '';

  // 2. Operational Hours (07:00 to 21:00 default)
  const operationalHours: number[] = [];
  for (let h = 7; h <= 21; h++) {
    operationalHours.push(h);
  }

  // 3. Hourly aggregates
  const hourlyDataMap = new Map<number, { qty: number; revenue: number; txCount: number }>();
  for (const h of operationalHours) {
    hourlyDataMap.set(h, { qty: 0, revenue: 0, txCount: 0 });
  }

  let totalRevenue = 0;
  let totalQty = 0;
  const totalTransactions = transactions.length;

  // Day of week stats
  const dayStatsMap = new Map<number, { qty: number; revenue: number; txCount: number }>();
  for (let d = 0; d < 7; d++) {
    dayStatsMap.set(d, { qty: 0, revenue: 0, txCount: 0 });
  }

  // Menu sales overall
  const menuSalesMap = new Map<
    string,
    { qty: number; revenue: number; grossProfit: number; item: MenuItem }
  >();
  for (const m of menus) {
    menuSalesMap.set(m.nama_menu.toLowerCase(), {
      qty: 0,
      revenue: 0,
      grossProfit: 0,
      item: m,
    });
  }

  // Hourly menu breakdown: hour -> (menuName -> qty)
  const hourlyMenuQtyMap = new Map<number, Map<string, number>>();
  for (const h of operationalHours) {
    hourlyMenuQtyMap.set(h, new Map<string, number>());
  }

  for (const tx of transactions) {
    const menuItem = menuMap.get(tx.nama_menu.toLowerCase());
    const unitPrice = menuItem ? menuItem.harga_jual : 0;
    const unitHpp = menuItem ? menuItem.hpp : 0;
    const txRevenue = tx.qty * unitPrice;
    const txProfit = tx.qty * (unitPrice - unitHpp);

    totalRevenue += txRevenue;
    totalQty += tx.qty;

    // Hour
    const hourNum = parseInt(tx.jam.split(':')[0], 10);
    if (hourlyDataMap.has(hourNum)) {
      const hStat = hourlyDataMap.get(hourNum)!;
      hStat.qty += tx.qty;
      hStat.revenue += txRevenue;
      hStat.txCount += 1;

      // Hourly menu mapping
      const mQtyMap = hourlyMenuQtyMap.get(hourNum)!;
      const curMenuQty = mQtyMap.get(tx.nama_menu) || 0;
      mQtyMap.set(tx.nama_menu, curMenuQty + tx.qty);
    }

    // Day of week
    const txDate = new Date(tx.tanggal + 'T00:00:00Z');
    const dayOfWeek = txDate.getUTCDay();
    if (dayStatsMap.has(dayOfWeek)) {
      const dStat = dayStatsMap.get(dayOfWeek)!;
      dStat.qty += tx.qty;
      dStat.revenue += txRevenue;
      dStat.txCount += 1;
    }

    // Menu Sales
    if (menuItem) {
      const ms = menuSalesMap.get(menuItem.nama_menu.toLowerCase());
      if (ms) {
        ms.qty += tx.qty;
        ms.revenue += txRevenue;
        ms.grossProfit += txProfit;
      }
    }
  }

  // 4. Calculate average qty and classify hours
  // overall_avg = sum of average_qty across all 15 operational hours / 15
  const hourlyStats: HourlyStat[] = [];
  let sumAvgQty = 0;

  for (const h of operationalHours) {
    const data = hourlyDataMap.get(h)!;
    const avgQty = data.qty / totalDays;
    sumAvgQty += avgQty;
  }

  const overallAvgQtyPerHour = operationalHours.length > 0 ? sumAvgQty / operationalHours.length : 0;

  const busyHourNumbers: number[] = [];
  const normalHourNumbers: number[] = [];
  const slowHourNumbers: number[] = [];

  let peakHourNumber = 7;
  let maxHourlyAvgQty = -1;

  for (const h of operationalHours) {
    const data = hourlyDataMap.get(h)!;
    const avgQty = data.qty / totalDays;

    if (avgQty > maxHourlyAvgQty) {
      maxHourlyAvgQty = avgQty;
      peakHourNumber = h;
    }

    let classification: 'busy' | 'normal' | 'slow' = 'normal';
    // Rule:
    // Jam ramai jika rata-rata qty per jam >= 1,3 kali rata-rata keseluruhan jam.
    // Jam sepi jika rata-rata qty per jam <= 0,7 kali rata-rata keseluruhan jam.
    if (avgQty >= 1.3 * overallAvgQtyPerHour) {
      classification = 'busy';
      busyHourNumbers.push(h);
    } else if (avgQty <= 0.7 * overallAvgQtyPerHour) {
      classification = 'slow';
      slowHourNumbers.push(h);
    } else {
      classification = 'normal';
      normalHourNumbers.push(h);
    }

    hourlyStats.push({
      hour: padHour(h),
      displayHour: formatHour(padHour(h)),
      totalQty: data.qty,
      totalRevenue: data.revenue,
      transactionCount: data.txCount,
      averageQty: Math.round(avgQty * 10) / 10,
      classification,
    });
  }

  // 5. Day analysis: busiest & slowest
  let busiestDayIndex = 6; // Saturday default
  let slowestDayIndex = 1; // Monday default
  let maxDayQty = -1;
  let minDayQty = Infinity;

  dayStatsMap.forEach((stat, dayIdx) => {
    if (stat.qty > maxDayQty) {
      maxDayQty = stat.qty;
      busiestDayIndex = dayIdx;
    }
    if (stat.qty < minDayQty && stat.qty > 0) {
      minDayQty = stat.qty;
      slowestDayIndex = dayIdx;
    }
  });

  const busiestDay = INDONESIAN_DAYS[busiestDayIndex];
  const slowestDay = INDONESIAN_DAYS[slowestDayIndex];

  // 6. Menu andalan per jam ramai & Stock recommendations
  const busyHourTopMenus: BusyHourTopMenu[] = [];
  const stockRecommendations: StockRecommendationItem[] = [];

  for (const busyHour of busyHourNumbers) {
    const hourStr = padHour(busyHour);
    const mQtyMap = hourlyMenuQtyMap.get(busyHour)!;

    // Convert to list and sort by qty desc
    const menuList = Array.from(mQtyMap.entries()).map(([menuName, qty]) => {
      const menuItem = menuMap.get(menuName.toLowerCase())!;
      const revenue = qty * menuItem.harga_jual;
      const profit = qty * (menuItem.harga_jual - menuItem.hpp);
      const margin = ((menuItem.harga_jual - menuItem.hpp) / menuItem.harga_jual) * 100;
      const avgDailyQty = qty / totalDays;
      // Formula: Math.ceil(rata_rata_qty * 1.15)
      const recommendedPortions = Math.max(1, Math.ceil(avgDailyQty * 1.15));

      return {
        hour: hourStr,
        menuName,
        category: menuItem.kategori,
        qty,
        revenue,
        grossProfit: profit,
        marginPercent: Math.round(margin * 10) / 10,
        averageDailyQty: Math.round(avgDailyQty * 10) / 10,
        recommendedPortions,
      };
    });

    menuList.sort((a, b) => b.qty - a.qty);

    // Top 3 menus for this busy hour
    const top3 = menuList.slice(0, 3);
    for (const item of top3) {
      busyHourTopMenus.push(item);

      stockRecommendations.push({
        hour: item.hour,
        menu: item.menuName,
        average_qty: item.averageDailyQty,
        recommended_portions: item.recommendedPortions,
        buffer_percent: 15,
      });
    }
  }

  // 7. Overall Top Menus
  const topMenusOverall: { name: string; qty: number; revenue: number; marginPercent: number }[] = [];
  menuSalesMap.forEach((stat) => {
    const margin = ((stat.item.harga_jual - stat.item.hpp) / stat.item.harga_jual) * 100;
    topMenusOverall.push({
      name: stat.item.nama_menu,
      qty: stat.qty,
      revenue: stat.revenue,
      marginPercent: Math.round(margin * 10) / 10,
    });
  });
  topMenusOverall.sort((a, b) => b.qty - a.qty);

  // 8. Low margin menus identification
  // Criteria:
  // Low margin (< 35%) OR items with margin < 50% that have high volume (top 5 by qty)
  const lowMarginMenus: LowMarginMenuItem[] = [];
  for (const m of topMenusOverall) {
    const menuItem = menuMap.get(m.name.toLowerCase())!;
    const profit = m.qty * (menuItem.harga_jual - menuItem.hpp);
    // If margin is under 35%, OR if it's the signature high-volume item with low margin (like Kopi Susu Senja at ~45% while others are 65%+)
    if (m.marginPercent < 35 || (m.marginPercent <= 45.5 && m.qty > totalQty * 0.1)) {
      lowMarginMenus.push({
        name: m.name,
        qty: m.qty,
        revenue: m.revenue,
        margin_percent: m.marginPercent,
        gross_profit: profit,
      });
    }
  }

  // If none fell under strict threshold, pick the menu with the lowest margin that has significant sales
  if (lowMarginMenus.length === 0 && topMenusOverall.length > 0) {
    const sortedByMargin = [...topMenusOverall].sort((a, b) => a.marginPercent - b.marginPercent);
    const lowest = sortedByMargin[0];
    const menuItem = menuMap.get(lowest.name.toLowerCase())!;
    lowMarginMenus.push({
      name: lowest.name,
      qty: lowest.qty,
      revenue: lowest.revenue,
      margin_percent: lowest.marginPercent,
      gross_profit: lowest.qty * (menuItem.harga_jual - menuItem.hpp),
    });
  }

  // 9. Slow Hours List
  const slowHours = slowHourNumbers.map(h => padHour(h));

  // 10. Consecutive hour strings
  const busyHoursList = groupConsecutiveHours(busyHourNumbers);
  const normalHoursList = groupConsecutiveHours(normalHourNumbers);
  const slowHoursList = groupConsecutiveHours(slowHourNumbers);

  // 11. Insights
  const peakHourStr = padHour(peakHourNumber);
  const insights: string[] = [
    `Penjualan tertinggi terjadi pada pukul ${formatHour(peakHourStr)} dengan rata-rata ${formatDecimal(maxHourlyAvgQty)} cup/porsi per hari.`,
    `Hari ${busiestDay} merupakan hari dengan penjualan tertinggi (${formatRupiah(dayStatsMap.get(busiestDayIndex)?.revenue || 0)} total omzet), sedangkan hari ${slowestDay} paling sepi.`,
  ];

  if (slowHoursList.length > 0) {
    insights.push(`Penjualan cenderung melambat pada jam ${slowHoursList.join(', ')}.`);
  }

  const signatureMenu = topMenusOverall[0];
  if (signatureMenu) {
    insights.push(
      `Menu '${signatureMenu.name}' adalah menu terlaris dengan total ${formatNumber(signatureMenu.qty)} terjual (${formatPercent((signatureMenu.qty / totalQty) * 100)} dari total produk).`
    );
  }

  const summary: BusinessSummary = {
    businessName,
    periodStart,
    periodEnd,
    totalDays,
    totalRevenue,
    totalQty,
    totalTransactions,
    peakHour: peakHourStr,
    peakHourQty: Math.round(maxHourlyAvgQty * 10) / 10,
    busiestDay,
    slowestDay,
    overallAvgQtyPerHour: Math.round(overallAvgQtyPerHour * 10) / 10,
  };

  return {
    summary,
    hourlyStats,
    busyHoursList,
    normalHoursList,
    slowHoursList,
    busyHourTopMenus,
    topMenusOverall,
    stockRecommendations,
    lowMarginMenus,
    slowHours,
    insights,
  };
}

export function buildGeminiPayload(analytics: AnalyticsResult): GeminiInputPayload {
  return {
    business_name: analytics.summary.businessName,
    period: {
      start: analytics.summary.periodStart,
      end: analytics.summary.periodEnd,
      total_days: analytics.summary.totalDays,
    },
    summary: {
      total_revenue: analytics.summary.totalRevenue,
      total_qty: analytics.summary.totalQty,
      peak_hour: analytics.summary.peakHour,
      busiest_day: analytics.summary.busiestDay,
      slowest_day: analytics.summary.slowestDay,
    },
    hourly_analysis: analytics.hourlyStats.map(h => ({
      hour: h.hour,
      average_qty: h.averageQty,
      classification: h.classification,
    })),
    top_menus: analytics.topMenusOverall.slice(0, 5).map(m => ({
      name: m.name,
      qty: m.qty,
      revenue: m.revenue,
      margin_percent: m.marginPercent,
    })),
    stock_recommendations: analytics.stockRecommendations.map(s => ({
      hour: s.hour,
      menu: s.menu,
      average_qty: s.average_qty,
      recommended_portions: s.recommended_portions,
      buffer_percent: s.buffer_percent,
    })),
    low_margin_menus: analytics.lowMarginMenus.map(m => ({
      name: m.name,
      qty: m.qty,
      margin_percent: m.margin_percent,
    })),
    slow_hours: analytics.slowHours,
  };
}
