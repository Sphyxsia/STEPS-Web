import { MenuItem, TransactionRow } from '../types';

export interface ValidationOutput<T> {
  isValid: boolean;
  data: T[];
  errors: string[];
}

export function validateTransaksiData(
  rawRows: Record<string, string | number | undefined>[],
  headerFields: string[]
): ValidationOutput<TransactionRow> {
  const errors: string[] = [];
  const cleanRows: TransactionRow[] = [];

  const requiredFields = ['tanggal', 'jam', 'nama_menu', 'qty'];
  for (const field of requiredFields) {
    if (!headerFields.includes(field)) {
      errors.push(
        `Kolom '${field}' belum ditemukan. Pastikan file transaksi memiliki kolom tanggal, jam, nama_menu, dan qty.`
      );
    }
  }

  if (errors.length > 0) {
    return { isValid: false, data: [], errors };
  }

  if (rawRows.length === 0) {
    return { isValid: false, data: [], errors: ['File transaksi tidak memiliki data baris transaksi.'] };
  }

  // Regex patterns
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // header is row 1
    const tanggal = String(row.tanggal || '').trim();
    const jam = String(row.jam || '').trim();
    const namaMenu = String(row.nama_menu || '').trim();
    const rawQty = row.qty;

    if (!tanggal || !dateRegex.test(tanggal)) {
      errors.push(`Baris ke-${rowNum}: Tanggal '${tanggal}' tidak valid. Gunakan format YYYY-MM-DD.`);
      return;
    }

    // Verify it's a real date
    const parsedDate = new Date(tanggal);
    if (isNaN(parsedDate.getTime())) {
      errors.push(`Baris ke-${rowNum}: Tanggal '${tanggal}' tidak valid dalam kalender.`);
      return;
    }

    if (!jam || !timeRegex.test(jam)) {
      errors.push(`Baris ke-${rowNum}: Jam '${jam}' tidak valid. Gunakan format HH:mm atau HH:mm:ss.`);
      return;
    }

    if (!namaMenu) {
      errors.push(`Baris ke-${rowNum}: Nama menu tidak boleh kosong.`);
      return;
    }

    const qty = typeof rawQty === 'number' ? rawQty : parseInt(String(rawQty || '').trim(), 10);
    if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      errors.push(`Baris ke-${rowNum} memiliki jumlah transaksi ('qty') yang tidak valid. Harus berupa angka bulat positif.`);
      return;
    }

    // Normalize jam to HH:mm
    const jamParts = jam.split(':');
    const normalizedJam = `${jamParts[0].padStart(2, '0')}:${jamParts[1].padStart(2, '0')}`;

    cleanRows.push({
      tanggal,
      jam: normalizedJam,
      nama_menu: namaMenu,
      qty,
    });
  });

  return {
    isValid: errors.length === 0,
    data: cleanRows,
    errors: errors.slice(0, 15), // prevent overflowing UI if hundreds of row errors
  };
}

export function validateMenuData(
  rawRows: Record<string, string | number | undefined>[],
  headerFields: string[]
): ValidationOutput<MenuItem> {
  const errors: string[] = [];
  const cleanRows: MenuItem[] = [];

  const requiredFields = ['nama_menu', 'kategori', 'harga_jual', 'hpp'];
  for (const field of requiredFields) {
    if (!headerFields.includes(field)) {
      errors.push(
        `Kolom '${field}' belum ditemukan. Pastikan file menu memiliki kolom nama_menu, kategori, harga_jual, dan hpp.`
      );
    }
  }

  if (errors.length > 0) {
    return { isValid: false, data: [], errors };
  }

  if (rawRows.length === 0) {
    return { isValid: false, data: [], errors: ['File menu tidak memiliki baris data menu.'] };
  }

  const seenMenuNames = new Set<string>();

  rawRows.forEach((row, index) => {
    const rowNum = index + 2;
    const namaMenu = String(row.nama_menu || '').trim();
    const kategori = String(row.kategori || '').trim();
    const rawHargaJual = row.harga_jual;
    const rawHpp = row.hpp;

    if (!namaMenu) {
      errors.push(`Baris ke-${rowNum}: Nama menu tidak boleh kosong.`);
      return;
    }

    const lowerName = namaMenu.toLowerCase();
    if (seenMenuNames.has(lowerName)) {
      errors.push(`Baris ke-${rowNum}: Menu '${namaMenu}' terdaftar lebih dari satu kali.`);
      return;
    }
    seenMenuNames.add(lowerName);

    if (!kategori) {
      errors.push(`Baris ke-${rowNum}: Kategori menu '${namaMenu}' tidak boleh kosong.`);
      return;
    }

    const hargaJual = typeof rawHargaJual === 'number'
      ? rawHargaJual
      : parseFloat(String(rawHargaJual || '').replace(/[^\d.]/g, ''));

    const hpp = typeof rawHpp === 'number'
      ? rawHpp
      : parseFloat(String(rawHpp || '').replace(/[^\d.]/g, ''));

    if (isNaN(hargaJual) || hargaJual <= 0) {
      errors.push(`Baris ke-${rowNum}: Harga jual untuk menu '${namaMenu}' harus berupa angka positif.`);
      return;
    }

    if (isNaN(hpp) || hpp <= 0) {
      errors.push(`Baris ke-${rowNum}: HPP untuk menu '${namaMenu}' harus berupa angka positif.`);
      return;
    }

    if (hpp > hargaJual) {
      errors.push(
        `Baris ke-${rowNum}: HPP (${hpp}) untuk menu '${namaMenu}' tidak boleh melebihi harga jual (${hargaJual}).`
      );
      return;
    }

    cleanRows.push({
      nama_menu: namaMenu,
      kategori,
      harga_jual: hargaJual,
      hpp,
    });
  });

  return {
    isValid: errors.length === 0,
    data: cleanRows,
    errors: errors.slice(0, 15),
  };
}

export function validateCrossConsistency(
  transactions: TransactionRow[],
  menus: MenuItem[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const menuMap = new Map<string, MenuItem>();

  menus.forEach(m => {
    menuMap.set(m.nama_menu.toLowerCase(), m);
  });

  const missingMenus = new Set<string>();

  for (const tx of transactions) {
    if (!menuMap.has(tx.nama_menu.toLowerCase())) {
      missingMenus.add(tx.nama_menu);
    }
  }

  if (missingMenus.size > 0) {
    const list = Array.from(missingMenus);
    for (const m of list) {
      errors.push(`Menu '${m}' ditemukan dalam transaksi tetapi belum terdaftar pada menu.csv.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
