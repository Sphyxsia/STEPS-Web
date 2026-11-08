import { MenuItem, TransactionRow } from '../types';

// Linear Congruential Generator for deterministic seeded randomness
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  // Returns floating point number in [0, 1)
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  // Returns integer in [min, max] inclusive
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Weighted selection from items
  pickWeighted<T>(items: { item: T; weight: number }[]): T {
    const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
    let randomVal = this.next() * totalWeight;
    for (const entry of items) {
      if (randomVal < entry.weight) {
        return entry.item;
      }
      randomVal -= entry.weight;
    }
    return items[items.length - 1].item;
  }
}

export const SAMPLE_MENUS: MenuItem[] = [
  { nama_menu: 'Kopi Susu Senja', kategori: 'Signature Coffee', harga_jual: 18000, hpp: 9900 },
  { nama_menu: 'Americano', kategori: 'Coffee', harga_jual: 15000, hpp: 5000 },
  { nama_menu: 'Cafe Latte', kategori: 'Coffee', harga_jual: 20000, hpp: 7000 },
  { nama_menu: 'Cappuccino', kategori: 'Coffee', harga_jual: 20000, hpp: 7500 },
  { nama_menu: 'Caramel Latte', kategori: 'Coffee', harga_jual: 23000, hpp: 8000 },
  { nama_menu: 'Matcha Latte', kategori: 'Non-Coffee', harga_jual: 22000, hpp: 8000 },
  { nama_menu: 'Chocolate Cream', kategori: 'Non-Coffee', harga_jual: 20000, hpp: 7000 },
  { nama_menu: 'Hazelnut Coffee', kategori: 'Coffee', harga_jual: 23000, hpp: 8000 },
  { nama_menu: 'Vanilla Latte', kategori: 'Coffee', harga_jual: 21000, hpp: 7500 },
  { nama_menu: 'Lemon Tea', kategori: 'Tea', harga_jual: 14000, hpp: 4500 },
  { nama_menu: 'Croffle', kategori: 'Food', harga_jual: 18000, hpp: 6000 },
  { nama_menu: 'Butter Toast', kategori: 'Food', harga_jual: 16000, hpp: 5500 },
];

export const HOURLY_WEIGHTS: { hour: number; weight: number }[] = [
  { hour: 7, weight: 1.60 },
  { hour: 8, weight: 2.00 },
  { hour: 9, weight: 1.70 },
  { hour: 10, weight: 0.90 },
  { hour: 11, weight: 0.45 },
  { hour: 12, weight: 0.35 },
  { hour: 13, weight: 0.35 },
  { hour: 14, weight: 0.50 },
  { hour: 15, weight: 0.85 },
  { hour: 16, weight: 1.50 },
  { hour: 17, weight: 1.90 },
  { hour: 18, weight: 2.00 },
  { hour: 19, weight: 1.70 },
  { hour: 20, weight: 0.90 },
  { hour: 21, weight: 0.45 },
];

// Day multipliers (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)
export const DAY_MULTIPLIERS: { [day: number]: number } = {
  1: 0.55, // Senin
  2: 0.85, // Selasa
  3: 0.90, // Rabu
  4: 0.95, // Kamis
  5: 1.15, // Jumat
  6: 1.55, // Sabtu
  0: 1.40, // Minggu
};

export const MENU_POPULARITY_WEIGHTS: { menu: string; weight: number }[] = [
  { menu: 'Kopi Susu Senja', weight: 2.00 },
  { menu: 'Americano', weight: 1.20 },
  { menu: 'Cafe Latte', weight: 0.95 },
  { menu: 'Cappuccino', weight: 0.85 },
  { menu: 'Caramel Latte', weight: 0.80 },
  { menu: 'Matcha Latte', weight: 0.75 },
  { menu: 'Chocolate Cream', weight: 0.65 },
  { menu: 'Hazelnut Coffee', weight: 0.55 },
  { menu: 'Vanilla Latte', weight: 0.70 },
  { menu: 'Lemon Tea', weight: 0.80 },
  { menu: 'Croffle', weight: 0.60 },
  { menu: 'Butter Toast', weight: 0.55 },
];

export function generateKopiSenjaDataset(seed = 20261108): {
  transactions: TransactionRow[];
  menus: MenuItem[];
} {
  const rng = new SeededRandom(seed);
  const transactions: TransactionRow[] = [];

  // 60 days: 2026-09-01 to 2026-10-30
  const startDate = new Date(Date.UTC(2026, 8, 1)); // September is month index 8
  const totalDays = 60;

  const menuWeightedList = MENU_POPULARITY_WEIGHTS.map(m => ({
    item: m.menu,
    weight: m.weight,
  }));

  const hourWeightedList = HOURLY_WEIGHTS.map(h => ({
    item: h.hour,
    weight: h.weight,
  }));

  // Qty weighted distribution: 1 (60%), 2 (28%), 3 (12%)
  const qtyWeighted = [
    { item: 1, weight: 60 },
    { item: 2, weight: 28 },
    { item: 3, weight: 12 },
  ];

  for (let d = 0; d < totalDays; d++) {
    const currentDate = new Date(startDate.getTime() + d * 24 * 60 * 60 * 1000);
    const dayOfWeek = currentDate.getUTCDay(); // 0 is Sunday, 1 is Monday...
    const dayMultiplier = DAY_MULTIPLIERS[dayOfWeek] || 1.0;

    // Base transactions per day: around 28-30. Adjusted by day multiplier:
    // e.g. Monday (0.55): ~16, Saturday (1.55): ~45
    const baseTxCount = 28 + rng.nextInt(-3, 3);
    const txCountForDay = Math.round(baseTxCount * dayMultiplier);

    const yearStr = currentDate.getUTCFullYear();
    const monthStr = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
    const dayStr = String(currentDate.getUTCDate()).padStart(2, '0');
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

    // Generate transactions for this day
    const dayTransactions: { timeValue: number; row: TransactionRow }[] = [];

    for (let t = 0; t < txCountForDay; t++) {
      const hour = rng.pickWeighted(hourWeightedList);
      const minute = rng.nextInt(2, 58);
      const second = rng.nextInt(0, 59);

      const hourStr = String(hour).padStart(2, '0');
      const minStr = String(minute).padStart(2, '0');
      const timeStr = `${hourStr}:${minStr}`;

      const menuName = rng.pickWeighted(menuWeightedList);
      const qty = rng.pickWeighted(qtyWeighted);

      dayTransactions.push({
        timeValue: hour * 3600 + minute * 60 + second,
        row: {
          tanggal: dateStr,
          jam: timeStr,
          nama_menu: menuName,
          qty,
        },
      });
    }

    // Sort transactions within the day chronologically
    dayTransactions.sort((a, b) => a.timeValue - b.timeValue);
    for (const item of dayTransactions) {
      transactions.push(item.row);
    }
  }

  return {
    transactions,
    menus: [...SAMPLE_MENUS],
  };
}

export function generateSampleCsvStrings(): {
  transaksiCsv: string;
  menuCsv: string;
} {
  const dataset = generateKopiSenjaDataset();

  // Transaksi CSV
  const txHeader = 'tanggal,jam,nama_menu,qty\n';
  const txRows = dataset.transactions
    .map(t => `${t.tanggal},${t.jam},${t.nama_menu},${t.qty}`)
    .join('\n');
  const transaksiCsv = txHeader + txRows;

  // Menu CSV
  const menuHeader = 'nama_menu,kategori,harga_jual,hpp\n';
  const menuRows = dataset.menus
    .map(m => `${m.nama_menu},${m.kategori},${m.harga_jual},${m.hpp}`)
    .join('\n');
  const menuCsv = menuHeader + menuRows;

  return { transaksiCsv, menuCsv };
}
