// ==============================================================================
// SIMPKL - CSV Student Import Service with Line-by-Line Validation
// ==============================================================================

import Papa from 'papaparse';
import { Student, ClassRoom, Department } from '../types/database';

export interface ImportError {
  rowNumber: number;
  nisn?: string;
  name?: string;
  field: string;
  message: string;
}

export interface ImportPreviewItem {
  rowNumber: number;
  fullName: string;
  nisn: string;
  nis: string;
  className: string;
  gender: 'L' | 'P';
  address: string;
  studentPhone: string;
  parentName: string;
  parentPhone: string;
  classId?: string;
  departmentId?: string;
  isValid: boolean;
  errors: string[];
}

export interface ImportValidationResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  items: ImportPreviewItem[];
  errors: ImportError[];
}

/**
 * Generates and downloads a clean CSV template for student import
 */
export function downloadStudentCsvTemplate() {
  const headers = [
    'nama_lengkap',
    'nisn',
    'nis',
    'kelas',
    'jenis_kelamin',
    'alamat',
    'whatsapp_siswa',
    'nama_orang_tua',
    'whatsapp_orang_tua',
  ];

  const sampleRows = [
    [
      'Ahmad Rifai [CONTOH]',
      '0068899112',
      '22231010',
      'XII RPL 1',
      'L',
      'Jl. Gubeng Kertajaya No. 15, Surabaya',
      '085711223399',
      'H. Rifai',
      '081299887766',
    ],
    [
      'Siti Nurhaliza [CONTOH]',
      '0068899113',
      '22231011',
      'XII RPL 2',
      'P',
      'Jl. Mulyorejo Baru No. 24, Surabaya',
      '085711223398',
      'Ahmad Syafii',
      '081299887765',
    ],
  ];

  const csvContent =
    headers.join(',') + '\n' + sampleRows.map(row => row.map(v => `"${v}"`).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'template_import_siswa_simpkl.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parses and validates CSV content line by line against business rules
 */
export function parseAndValidateStudentCsv(
  file: File,
  existingStudents: Student[],
  classes: ClassRoom[],
  departments: Department[]
): Promise<ImportValidationResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim().toLowerCase(),
      complete: results => {
        const rows = results.data as Record<string, string>[];
        const previewItems: ImportPreviewItem[] = [];
        const errors: ImportError[] = [];
        const seenNisnsInFile = new Set<string>();

        rows.forEach((row, index) => {
          const rowNum = index + 2; // +1 for 1-based, +1 for CSV header row
          const itemErrors: string[] = [];

          const fullName = (row.nama_lengkap || row['nama'] || '').trim();
          const nisn = (row.nisn || '').trim();
          const nis = (row.nis || '').trim();
          const className = (row.kelas || '').trim();
          const rawGender = (row.jenis_kelamin || row.jk || 'L').trim().toUpperCase();
          const gender: 'L' | 'P' = rawGender === 'P' || rawGender === 'PEREMPUAN' ? 'P' : 'L';
          const address = (row.alamat || '-').trim();
          const studentPhone = (row.whatsapp_siswa || row.no_wa_siswa || '').trim();
          const parentName = (row.nama_orang_tua || '').trim();
          const parentPhone = (row.whatsapp_orang_tua || row.no_wa_ortu || '').trim();

          // 1. Full name validation
          if (!fullName) {
            itemErrors.push('Nama lengkap wajib diisi');
            errors.push({ rowNumber: rowNum, nisn, name: fullName, field: 'nama_lengkap', message: 'Nama lengkap kosong' });
          }

          // 2. NISN Validation: Exactly 10 digits
          if (!nisn) {
            itemErrors.push('NISN wajib diisi');
            errors.push({ rowNumber: rowNum, nisn, name: fullName, field: 'nisn', message: 'NISN tidak diisi' });
          } else if (!/^[0-9]{10}$/.test(nisn)) {
            itemErrors.push('NISN harus 10 digit angka');
            errors.push({
              rowNumber: rowNum,
              nisn,
              name: fullName,
              field: 'nisn',
              message: `NISN "${nisn}" tidak valid (harus tepat 10 digit)`,
            });
          } else if (seenNisnsInFile.has(nisn)) {
            itemErrors.push(`NISN terduplikasi di dalam file (baris sebelumnya sudah menggunakan ${nisn})`);
            errors.push({
              rowNumber: rowNum,
              nisn,
              name: fullName,
              field: 'nisn',
              message: 'Duplikasi NISN di dalam CSV',
            });
          } else {
            // Check against database students
            const existing = existingStudents.find(s => s.nisn === nisn);
            if (existing) {
              itemErrors.push(`NISN telah digunakan oleh siswa: ${existing.full_name}`);
              errors.push({
                rowNumber: rowNum,
                nisn,
                name: fullName,
                field: 'nisn',
                message: `NISN sudah ada di database (${existing.full_name})`,
              });
            }
          }
          if (nisn) seenNisnsInFile.add(nisn);

          // 3. Class validation
          let matchedClass = classes.find(
            c => c.name.toLowerCase() === className.toLowerCase()
          );
          if (!className) {
            itemErrors.push('Kelas wajib diisi');
            errors.push({ rowNumber: rowNum, nisn, name: fullName, field: 'kelas', message: 'Kelas kosong' });
          } else if (!matchedClass) {
            itemErrors.push(`Kelas "${className}" tidak terdaftar di sistem`);
            errors.push({
              rowNumber: rowNum,
              nisn,
              name: fullName,
              field: 'kelas',
              message: `Kelas "${className}" tidak ditemukan`,
            });
          }

          // 4. Parent phone validation
          if (!parentPhone) {
            itemErrors.push('WhatsApp orang tua wajib diisi');
            errors.push({ rowNumber: rowNum, nisn, name: fullName, field: 'whatsapp_orang_tua', message: 'Kontak orang tua wajib' });
          }

          const isValid = itemErrors.length === 0;

          previewItems.push({
            rowNumber: rowNum,
            fullName,
            nisn,
            nis: nis || 'AUTO-' + rowNum,
            className,
            gender,
            address,
            studentPhone,
            parentName,
            parentPhone,
            classId: matchedClass?.id,
            departmentId: matchedClass?.department_id,
            isValid,
            errors: itemErrors,
          });
        });

        const validCount = previewItems.filter(i => i.isValid).length;

        resolve({
          totalRows: previewItems.length,
          validRows: validCount,
          invalidRows: previewItems.length - validCount,
          items: previewItems,
          errors,
        });
      },
      error: err => {
        reject(new Error('Gagal membaca file CSV: ' + err.message));
      },
    });
  });
}
