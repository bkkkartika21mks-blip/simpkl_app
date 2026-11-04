// ==============================================================================
// SIMPKL Business Rules & Validators
// ==============================================================================

import { Placement, Student, Partner } from '../types/database';

export interface ValidationError {
  field?: string;
  message: string;
}

/**
 * Validates NISN: Must be text, exactly 10 numeric digits, and unique.
 */
export function validateNISN(nisn: string, existingStudents: Student[], currentStudentId?: string): ValidationError | null {
  if (!nisn || typeof nisn !== 'string') {
    return { field: 'nisn', message: 'NISN wajib diisi.' };
  }
  const clean = nisn.trim();
  if (!/^[0-9]{10}$/.test(clean)) {
    return { field: 'nisn', message: 'NISN harus berupa angka tepat 10 digit (contoh: 0061234567).' };
  }

  // Uniqueness check
  const duplicate = existingStudents.find(
    s => s.nisn === clean && s.id !== currentStudentId
  );
  if (duplicate) {
    return { field: 'nisn', message: `NISN ${clean} sudah terdaftar atas nama siswa: ${duplicate.full_name}.` };
  }

  return null;
}

/**
 * Validates date order: planned withdrawal cannot be before start date.
 */
export function validateDates(startDate: string, plannedWithdrawalDate: string, actualWithdrawalDate?: string): ValidationError | null {
  if (!startDate) {
    return { field: 'start_date', message: 'Tanggal penempatan wajib diisi.' };
  }
  if (!plannedWithdrawalDate) {
    return { field: 'planned_withdrawal_date', message: 'Rencana penarikan wajib diisi.' };
  }

  if (plannedWithdrawalDate < startDate) {
    return {
      field: 'planned_withdrawal_date',
      message: 'Rencana penarikan tidak boleh lebih awal dari tanggal penempatan.',
    };
  }

  if (actualWithdrawalDate && actualWithdrawalDate < startDate) {
    return {
      field: 'actual_withdrawal_date',
      message: 'Realisasi penarikan tidak boleh lebih awal dari tanggal penempatan.',
    };
  }

  return null;
}

/**
 * Validates placement overlap for a student:
 * One student cannot have overlapping placement date ranges unless cancelled.
 */
export function validatePlacementOverlap(
  studentId: string,
  newStartDate: string,
  newEndDate: string, // planned or actual
  existingPlacements: Placement[],
  currentPlacementId?: string
): ValidationError | null {
  const activePlacements = existingPlacements.filter(
    p => p.student_id === studentId &&
         p.status !== 'dibatalkan' &&
         p.id !== currentPlacementId
  );

  for (const p of activePlacements) {
    const pStart = p.start_date;
    const pEnd = p.actual_withdrawal_date || p.planned_withdrawal_date;

    // Overlap condition: (StartA <= EndB) and (EndA >= StartB)
    if (newStartDate <= pEnd && newEndDate >= pStart) {
      return {
        field: 'dates',
        message: `Siswa telah memiliki penempatan aktif pada rentang tanggal ${pStart} s.d. ${pEnd} di mitra: ${p.partner?.company_name || 'Mitra lain'}.`,
      };
    }
  }

  return null;
}

/**
 * Validates partner quota:
 * Placement count for partner in this period cannot exceed partner's quota.
 */
export function validatePartnerQuota(
  partnerId: string,
  periodId: string,
  partner: Partner,
  periodQuota: number | undefined,
  existingPlacements: Placement[],
  currentPlacementId?: string
): ValidationError | null {
  const maxQuota = periodQuota !== undefined ? periodQuota : partner.default_quota;

  const currentPlacedCount = existingPlacements.filter(
    p => p.partner_id === partnerId &&
         p.period_id === periodId &&
         p.status !== 'dibatalkan' &&
         p.id !== currentPlacementId
  ).length;

  if (currentPlacedCount >= maxQuota) {
    return {
      field: 'partner_id',
      message: `Kuota mitra "${partner.company_name}" untuk periode ini telah penuh (Maksimal: ${maxQuota} siswa, Terisi: ${currentPlacedCount}).`,
    };
  }

  return null;
}

/**
 * Validates completion status:
 * Selesai status requires actual withdrawal date.
 */
export function validateCompletion(status: string, actualWithdrawalDate?: string): ValidationError | null {
  if (status === 'selesai' && !actualWithdrawalDate) {
    return {
      field: 'actual_withdrawal_date',
      message: 'Status selesai membutuhkan pengisian realisasi tanggal penarikan.',
    };
  }
  return null;
}
