// ==============================================================================
// SIMPKL - Export Service (CSV, Excel-compatible TSV, and Printable Letterhead)
// ==============================================================================

import Papa from 'papaparse';
import { Placement, Student, Partner, SchoolSettings } from '../types/database';
import { formatDateIndo } from '../utils/formatters';

/**
 * Downloads a string as a file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export placements recap to CSV
 */
export function exportPlacementsCsv(placements: Placement[], periodName: string = 'PKL') {
  const data = placements.map((p, index) => ({
    'No': index + 1,
    'Nama Siswa': p.student?.full_name || '-',
    'NISN': p.student?.nisn || '-',
    'Kelas': p.student?.class?.name || '-',
    'Jurusan': p.student?.department?.name || '-',
    'Mitra PKL': p.partner?.company_name || '-',
    'Bidang Usaha': p.partner?.industry_sector || '-',
    'Alamat Mitra': p.partner?.address || '-',
    'Pembimbing Sekolah': p.school_supervisor?.name || '-',
    'Pembimbing Industri': p.industry_supervisor?.name || '-',
    'Tanggal Mulai': formatDateIndo(p.start_date),
    'Rencana Penarikan': formatDateIndo(p.planned_withdrawal_date),
    'Realisasi Penarikan': p.actual_withdrawal_date ? formatDateIndo(p.actual_withdrawal_date) : '-',
    'Status': p.status.toUpperCase(),
    'Nilai Akhir': p.final_score !== undefined && p.final_score !== null ? p.final_score : '-',
    'Catatan': p.notes || '-',
  }));

  const csv = Papa.unparse(data);
  const cleanPeriod = periodName.replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadFile(
    '\uFEFF' + csv, // UTF-8 BOM for Excel compatibility
    `rekap_penempatan_${cleanPeriod}_${Date.now()}.csv`,
    'text/csv;charset=utf-8;'
  );
}

/**
 * Export students list to CSV
 */
export function exportStudentsCsv(students: Student[]) {
  const data = students.map((s, index) => ({
    'No': index + 1,
    'Nama Lengkap': s.full_name,
    'NISN': s.nisn,
    'NIS': s.nis,
    'Kelas': s.class?.name || '-',
    'Jurusan': s.department?.name || '-',
    'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
    'Alamat': s.address,
    'WhatsApp Siswa': s.student_phone || '-',
    'Nama Orang Tua': s.parent_name || '-',
    'WhatsApp Orang Tua': s.parent_phone,
    'Status Penempatan': s.current_placement ? s.current_placement.status.toUpperCase() : 'BELUM PENEMPATAN',
    'Mitra Saat Ini': s.current_placement?.partner?.company_name || '-',
  }));

  const csv = Papa.unparse(data);
  downloadFile(
    '\uFEFF' + csv,
    `data_siswa_simpkl_${Date.now()}.csv`,
    'text/csv;charset=utf-8;'
  );
}

/**
 * Export partners list to CSV
 */
export function exportPartnersCsv(partners: Partner[]) {
  const data = partners.map((p, index) => ({
    'No': index + 1,
    'Nama Mitra/Perusahaan': p.company_name,
    'Bidang Usaha': p.industry_sector,
    'Alamat': p.address,
    'Penanggung Jawab': p.person_in_charge,
    'Kontak': p.contact_number,
    'Email': p.email || '-',
    'Kuota Siswa': p.default_quota,
    'Siswa Aktif Ditempatkan': p.assigned_count || 0,
    'Link Google Maps': p.google_maps_url || '-',
  }));

  const csv = Papa.unparse(data);
  downloadFile(
    '\uFEFF' + csv,
    `data_mitra_simpkl_${Date.now()}.csv`,
    'text/csv;charset=utf-8;'
  );
}
