export function formatRupiah(value: number): string {
  if (isNaN(value)) return 'Rp 0';
  const rounded = Math.round(value);
  return 'Rp ' + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatPercent(value: number): string {
  if (isNaN(value)) return '0%';
  const rounded = Math.round(value * 10) / 10;
  return rounded.toFixed(1).replace('.', ',') + '%';
}

export function formatNumber(value: number): string {
  if (isNaN(value)) return '0';
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatDecimal(value: number): string {
  if (isNaN(value)) return '0';
  return (Math.round(value * 10) / 10).toFixed(1).replace('.', ',');
}

export function formatHour(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}.${parts[1]}`;
  }
  return timeStr.replace(':', '.');
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(monthIndex) && !isNaN(day) && monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${MONTH_NAMES_ID[monthIndex]} ${year}`;
    }
  }
  return dateStr;
}
