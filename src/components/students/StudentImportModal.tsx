import React, { useState } from 'react';
import { Download, Upload, AlertCircle, CheckCircle2, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import {
  downloadStudentCsvTemplate,
  parseAndValidateStudentCsv,
  ImportValidationResult,
  ImportPreviewItem,
} from '../../services/importService';
import { Student, ClassRoom, Department } from '../../types/database';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingStudents: Student[];
  classes: ClassRoom[];
  departments: Department[];
}

export const StudentImportModal: React.FC<StudentImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingStudents,
  classes,
  departments,
}) => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<ImportValidationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      error('Format File Tidak Didukung', 'Harap unggah file dengan format .csv');
      return;
    }

    setFile(selectedFile);
    try {
      setIsParsing(true);
      const res = await parseAndValidateStudentCsv(selectedFile, existingStudents, classes, departments);
      setResult(res);

      if (res.invalidRows > 0) {
        warning(
          'Ditemukan Kesalahan Validasi',
          `Ada ${res.invalidRows} baris yang tidak memenuhi aturan bisnis dan tidak akan disimpan.`
        );
      } else {
        success('Validasi Berhasil', `${res.validRows} data siswa siap diimpor ke sistem.`);
      }
    } catch (err: any) {
      error('Gagal Membaca CSV', err.message);
      setResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveValidRows = async () => {
    if (!result || result.validRows === 0) return;

    try {
      setIsSaving(true);
      const validItems = result.items.filter(i => i.isValid);

      for (const item of validItems) {
        await dataService.saveStudent(
          {
            full_name: item.fullName,
            nisn: item.nisn,
            nis: item.nis,
            class_id: item.classId!,
            department_id: item.departmentId || 'dept-1',
            gender: item.gender,
            address: item.address,
            student_phone: item.studentPhone,
            parent_name: item.parentName,
            parent_phone: item.parentPhone,
            is_active: true,
          },
          { name: user?.name || 'Petugas Impor', email: user?.email || 'admin@simpkl.sch.id' }
        );
      }

      await dataService.logAudit(
        'IMPORT',
        'students',
        'bulk-import',
        user?.name || 'Petugas',
        user?.email || 'admin@simpkl.sch.id',
        null,
        { importedCount: validItems.length, fileName: file?.name }
      );

      success('Impor Berhasil', `Sebanyak ${validItems.length} siswa berhasil disimpan ke database.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Gagal Mengimpor Siswa', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Impor Data Siswa via CSV"
      subtitle="Unduh template, lengkapi data, lalu pratinjau sebelum menyimpan"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Step 1: Download Template */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Langkah 1: Unduh Format Template CSV
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Template memiliki kolom standar: NISN (10 digit), nama, kelas terdaftar, dan no. kontak.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadStudentCsvTemplate}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <Download className="w-4 h-4 text-teal-600" />
            Unduh Template CSV
          </button>
        </div>

        {/* Step 2: Upload CSV */}
        <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center bg-white dark:bg-slate-900">
          <input
            type="file"
            id="csv-upload"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {file ? file.name : 'Klik untuk memilih file CSV atau seret ke sini'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Hanya file berekstensi .csv dengan batas ukuran 5MB</p>
          </label>
        </div>

        {/* Loading Parsing */}
        {isParsing && <LoadingSpinner label="Memeriksa duplikasi dan memvalidasi aturan NISN per baris..." size="md" />}

        {/* Step 3: Validation Summary & Preview Table */}
        {result && (
          <div className="space-y-4">
            {/* Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500">Total Baris Terbaca</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{result.totalRows}</p>
              </div>
              <div className="p-3.5 rounded-xl border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                <span className="text-xs font-semibold">Baris Valid (Siap Disimpan)</span>
                <p className="text-xl font-extrabold">{result.validRows}</p>
              </div>
              <div className="p-3.5 rounded-xl border bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
                <span className="text-xs font-semibold">Baris Tidak Valid (Ditolak)</span>
                <p className="text-xl font-extrabold">{result.invalidRows}</p>
              </div>
            </div>

            {/* Error Reporting List (No silent drops) */}
            {result.errors.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-2">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" />
                  Laporan Kesalahan per Baris (Wajib Diperbaiki):
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 text-xs text-rose-700 dark:text-rose-300">
                  {result.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="font-mono font-bold bg-rose-200 dark:bg-rose-900/60 px-1.5 py-0.5 rounded text-[10px]">
                        Baris {err.rowNumber}
                      </span>
                      <span>
                        {err.name ? `[${err.name}] ` : ''}
                        <b>{err.field}:</b> {err.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                Pratinjau Data Impor Siswa
              </div>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 sticky top-0">
                    <tr>
                      <th className="p-2.5">Baris</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Nama Lengkap</th>
                      <th className="p-2.5">NISN</th>
                      <th className="p-2.5">Kelas</th>
                      <th className="p-2.5">Kontak Ortu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {result.items.map(item => (
                      <tr
                        key={item.rowNumber}
                        className={item.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-rose-50/40 dark:bg-rose-950/20'}
                      >
                        <td className="p-2.5 font-mono text-slate-500">#{item.rowNumber}</td>
                        <td className="p-2.5">
                          {item.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" /> Ada Eror
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100">{item.fullName}</td>
                        <td className="p-2.5 font-mono">{item.nisn}</td>
                        <td className="p-2.5">{item.className}</td>
                        <td className="p-2.5">{item.parentPhone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleSaveValidRows}
            disabled={!result || result.validRows === 0 || isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-teal-600/30"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan {result ? `${result.validRows} Baris Siswa Valid` : 'Data'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
