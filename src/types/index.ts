export interface TransactionRow {
  tanggal: string; // YYYY-MM-DD
  jam: string;     // HH:mm or HH:mm:ss
  nama_menu: string;
  qty: number;
}

export interface MenuItem {
  nama_menu: string;
  kategori: string;
  harga_jual: number;
  hpp: number;
}

export interface HourlyStat {
  hour: string; // e.g. "08:00"
  displayHour: string; // e.g. "08.00"
  totalQty: number;
  totalRevenue: number;
  transactionCount: number;
  averageQty: number; // totalQty / totalDays
  classification: 'busy' | 'normal' | 'slow';
}

export interface DayOfWeekStat {
  dayName: string; // "Senin", "Selasa", ...
  totalQty: number;
  totalRevenue: number;
  transactionCount: number;
}

export interface BusyHourTopMenu {
  hour: string;
  menuName: string;
  category: string;
  qty: number;
  revenue: number;
  grossProfit: number;
  marginPercent: number;
  averageDailyQty: number;
  recommendedPortions: number;
}

export interface StockRecommendationItem {
  hour: string;
  menu: string;
  average_qty: number;
  recommended_portions: number;
  buffer_percent: number;
}

export interface LowMarginMenuItem {
  name: string;
  qty: number;
  revenue: number;
  margin_percent: number;
  gross_profit: number;
}

export interface BusinessSummary {
  businessName: string;
  periodStart: string;
  periodEnd: string;
  totalDays: number;
  totalRevenue: number;
  totalQty: number;
  totalTransactions: number;
  peakHour: string;
  peakHourQty: number;
  busiestDay: string;
  slowestDay: string;
  overallAvgQtyPerHour: number;
}

export interface AnalyticsResult {
  summary: BusinessSummary;
  hourlyStats: HourlyStat[];
  busyHoursList: string[]; // e.g. ["07.00-09.00", "16.00-19.00"]
  normalHoursList: string[];
  slowHoursList: string[];
  busyHourTopMenus: BusyHourTopMenu[];
  topMenusOverall: { name: string; qty: number; revenue: number; marginPercent: number }[];
  stockRecommendations: StockRecommendationItem[];
  lowMarginMenus: LowMarginMenuItem[];
  slowHours: string[]; // raw array of hours ["12:00", "13:00"]
  insights: string[];
}

export interface GeminiInputPayload {
  business_name: string;
  period: {
    start: string;
    end: string;
    total_days: number;
  };
  summary: {
    total_revenue: number;
    total_qty: number;
    peak_hour: string;
    busiest_day: string;
    slowest_day: string;
  };
  hourly_analysis: {
    hour: string;
    average_qty: number;
    classification: 'busy' | 'normal' | 'slow';
  }[];
  top_menus: {
    name: string;
    qty: number;
    revenue: number;
    margin_percent: number;
  }[];
  stock_recommendations: {
    hour: string;
    menu: string;
    average_qty: number;
    recommended_portions: number;
    buffer_percent: number;
  }[];
  low_margin_menus: {
    name: string;
    qty: number;
    margin_percent: number;
  }[];
  slow_hours: string[];
}

export interface AIStockExplanation {
  hour: string;
  menu: string;
  recommended_portions: number;
  explanation: string;
}

export interface AISlowHourPromotion {
  hour: string;
  promotion_name: string;
  description: string;
  target_menu: string;
  reason: string;
}

export interface AILowMarginWarning {
  menu: string;
  warning: string;
  suggestion: string;
}

export interface AIRecommendations {
  stock_explanations: AIStockExplanation[];
  slow_hour_promotions: AISlowHourPromotion[];
  low_margin_warnings: AILowMarginWarning[];
  general_insight: string;
}
