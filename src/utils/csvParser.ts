import Papa from 'papaparse';

export interface ParseResult<T> {
  data: T[];
  errors: string[];
  fields: string[];
}

export function parseCsvString<T = Record<string, string>>(csvContent: string): Promise<ParseResult<T>> {
  return new Promise((resolve) => {
    Papa.parse<T>(csvContent.trim(), {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header: string) => header.trim().toLowerCase(),
      complete: (results) => {
        const errors = results.errors.map(e => `Baris ${e.row ?? '?'}: ${e.message}`);
        resolve({
          data: results.data,
          errors,
          fields: results.meta.fields || [],
        });
      },
      error: (error: Error) => {
        resolve({
          data: [],
          errors: [`Gagal membaca CSV: ${error.message}`],
          fields: [],
        });
      },
    });
  });
}

export function parseCsvFile<T = Record<string, string>>(file: File): Promise<ParseResult<T>> {
  return new Promise((resolve) => {
    Papa.parse<T>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header: string) => header.trim().toLowerCase(),
      complete: (results) => {
        const errors = results.errors.map(e => `Baris ${e.row ?? '?'}: ${e.message}`);
        resolve({
          data: results.data,
          errors,
          fields: results.meta.fields || [],
        });
      },
      error: (error: Error) => {
        resolve({
          data: [],
          errors: [`Gagal membaca file CSV: ${error.message}`],
          fields: [],
        });
      },
    });
  });
}
