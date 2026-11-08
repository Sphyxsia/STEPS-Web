import { AIRecommendations, GeminiInputPayload } from '../types';
import { formatHour, formatPercent } from './formatters';

export function generateDeterministicRecommendations(
  input: GeminiInputPayload
): AIRecommendations {
  // 1. Stock explanations based on code stock_recommendations
  const stock_explanations = input.stock_recommendations.map(s => {
    let explanation = `Siapkan estimasi ${s.recommended_portions} porsi sebelum memasuki jam ${formatHour(s.hour)} agar barista tidak kewalahan saat pesanan memuncak.`;
    if (s.average_qty > 10) {
      explanation = `Menu ini memiliki volume tertinggi pada pukul ${formatHour(s.hour)}. Siapkan pre-batch atau cup siap racik sebanyak ${s.recommended_portions} porsi untuk memangkas waktu antrean.`;
    } else if (s.recommended_portions <= 3) {
      explanation = `Permintaan moderat sekitar ${s.recommended_portions} porsi. Pastikan bahan dasar dingin dan alat saji sudah standby di dekat station.`;
    }
    return {
      hour: s.hour,
      menu: s.menu,
      recommended_portions: s.recommended_portions,
      explanation,
    };
  });

  // 2. Slow hour promotions
  const slow_hour_promotions = input.slow_hours.map(hour => {
    const formattedH = formatHour(hour);
    let promoName = `Paket Santai Siang (${formattedH})`;
    let description = 'Tawarkan paket pairing hemat minuman signature dengan camilan pendamping.';
    let targetMenu = input.top_menus[0]?.name || 'Kopi Susu Senja';
    let reason = `Meningkatkan foot traffic dan transaksi pada jam sepi pukul ${formattedH}.`;

    if (hour === '11:00' || hour === '12:00' || hour === '13:00') {
      promoName = `Coffee Break Siang (${formattedH})`;
      description = 'Bundle minuman kopi/non-kopi dengan pastry atau roti bakar untuk pelanggan istirahat siang kantor.';
      targetMenu = input.top_menus.length > 1 ? input.top_menus[1].name : targetMenu;
      reason = 'Mendorong pekerja sekitar kedai memilih takeaway saat jam makan siang.';
    } else if (hour === '20:00' || hour === '21:00') {
      promoName = `Night Owl Hours (${formattedH})`;
      description = 'Diskon spesial 15% untuk pembelian kedua menu non-kopi atau teh herbal menjelang tutup kedai.';
      targetMenu = 'Lemon Tea';
      reason = 'Menghabiskan sisa persediaan teh dan meningkatkan pesanan santai malam.';
    }

    return {
      hour,
      promotion_name: promoName,
      description,
      target_menu: targetMenu,
      reason,
    };
  });

  // 3. Low margin warnings
  const low_margin_warnings = input.low_margin_menus.map(m => {
    return {
      menu: m.name,
      warning: `Menu '${m.name}' menyumbang penjualan tinggi (${m.qty} terjual) namun margin kotornya relatif tipis di angka ${formatPercent(m.margin_percent)}.`,
      suggestion: 'Evaluasi diskon berkala, negosiasikan harga beli bahan baku dalam kemasan bulk, atau tawarkan opsi upsize dengan margin lebih sehat.',
    };
  });

  // 4. General insight
  const peakH = formatHour(input.summary.peak_hour);
  const general_insight = `Prioritaskan kesiapan stok dan pembagian tugas barista sebelum jam puncak pukul ${peakH}. Manfaatkan promosi terarah pada jam sepi serta jaga profitabilitas menu andalan bermargin tipis.`;

  return {
    stock_explanations,
    slow_hour_promotions,
    low_margin_warnings,
    general_insight,
  };
}
