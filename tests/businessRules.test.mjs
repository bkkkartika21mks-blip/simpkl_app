// ==============================================================================
// SIMPKL Business Rules Unit Test Suite
// ==============================================================================

import assert from 'assert';

console.log('--- Memulai Pengujian Aturan Bisnis SIMPKL ---');

// 1. Uji Validasi NISN (harus teks tepat 10 digit angka & unik)
function validateNISN(nisn, existing) {
  if (!nisn) return 'NISN wajib diisi';
  if (!/^[0-9]{10}$/.test(nisn.trim())) return 'NISN harus tepat 10 digit angka';
  if (existing.some(s => s.nisn === nisn.trim())) return 'NISN duplikat';
  return null;
}

const mockStudents = [{ nisn: '0061234567', full_name: 'Fajar' }];
assert.strictEqual(validateNISN('0061234567', mockStudents), 'NISN duplikat');
assert.strictEqual(validateNISN('12345', mockStudents), 'NISN harus tepat 10 digit angka');
assert.strictEqual(validateNISN('006123456A', mockStudents), 'NISN harus tepat 10 digit angka');
assert.strictEqual(validateNISN('0069999999', mockStudents), null);
console.log('✓ Validasi NISN 10-digit dan keunikan: LULUS');

// 2. Uji Benturan Tanggal Penempatan Siswa (Overlap Check)
function validateOverlap(studentId, start, end, placements) {
  const active = placements.filter(p => p.student_id === studentId && p.status !== 'dibatalkan');
  for (const p of active) {
    const pEnd = p.actual_withdrawal_date || p.planned_withdrawal_date;
    if (start <= pEnd && end >= p.start_date) {
      return 'Jadwal bertumpang tindih';
    }
  }
  return null;
}

const mockPlacements = [
  {
    id: 'p1',
    student_id: 's1',
    start_date: '2024-08-01',
    planned_withdrawal_date: '2024-11-30',
    status: 'berlangsung',
  },
  {
    id: 'p2',
    student_id: 's1',
    start_date: '2024-05-01',
    planned_withdrawal_date: '2024-07-31',
    status: 'dibatalkan', // Pembatalan tidak dihitung bentrok
  },
];

// Bertumpang tindih dengan p1
assert.strictEqual(validateOverlap('s1', '2024-09-01', '2024-10-31', mockPlacements), 'Jadwal bertumpang tindih');
assert.strictEqual(validateOverlap('s1', '2024-07-15', '2024-08-15', mockPlacements), 'Jadwal bertumpang tindih');
// Bersinggungan dengan yang dibatalkan p2 -> Boleh
assert.strictEqual(validateOverlap('s1', '2024-06-01', '2024-06-30', mockPlacements), null);
// Di luar rentang tanggal p1 -> Boleh
assert.strictEqual(validateOverlap('s1', '2024-12-01', '2025-02-28', mockPlacements), null);
console.log('✓ Validasi pencegahan jadwal penempatan bertumpang tindih: LULUS');

// 3. Uji Kuota Mitra per Periode
function validateQuota(partnerId, periodId, quota, placements) {
  const count = placements.filter(
    p => p.partner_id === partnerId && p.period_id === periodId && p.status !== 'dibatalkan'
  ).length;
  if (count >= quota) return 'Kuota mitra telah penuh';
  return null;
}

const partnerPlacements = [
  { partner_id: 'part1', period_id: 'per1', status: 'berlangsung' },
  { partner_id: 'part1', period_id: 'per1', status: 'terjadwal' },
  { partner_id: 'part1', period_id: 'per1', status: 'dibatalkan' }, // Dibatalkan tidak mengurangi kuota
];

assert.strictEqual(validateQuota('part1', 'per1', 2, partnerPlacements), 'Kuota mitra telah penuh');
assert.strictEqual(validateQuota('part1', 'per1', 3, partnerPlacements), null);
console.log('✓ Validasi kuota mitra industri per periode: LULUS');

// 4. Uji Aturan Realisasi Penarikan
function validateWithdrawal(status, start, planned, actual) {
  if (planned < start) return 'Rencana penarikan tidak boleh sebelum tanggal mulai';
  if (actual && actual < start) return 'Realisasi penarikan tidak boleh sebelum tanggal mulai';
  if (status === 'selesai' && !actual) return 'Status selesai membutuhkan realisasi tanggal penarikan';
  return null;
}

assert.strictEqual(validateWithdrawal('berlangsung', '2024-08-01', '2024-07-01', null), 'Rencana penarikan tidak boleh sebelum tanggal mulai');
assert.strictEqual(validateWithdrawal('selesai', '2024-08-01', '2024-11-30', null), 'Status selesai membutuhkan realisasi tanggal penarikan');
assert.strictEqual(validateWithdrawal('selesai', '2024-08-01', '2024-11-30', '2024-07-15'), 'Realisasi penarikan tidak boleh sebelum tanggal mulai');
assert.strictEqual(validateWithdrawal('selesai', '2024-08-01', '2024-11-30', '2024-11-28'), null);
console.log('✓ Validasi tanggal rencana dan realisasi penarikan: LULUS');

// 5. Uji Larangan Penghapusan Fisik jika Ada Riwayat (Prevent Hard-Delete)
function canDeleteStudent(studentId, placements) {
  const hasHistory = placements.some(p => p.student_id === studentId);
  if (hasHistory) return 'Siswa memiliki riwayat penempatan, harus diarsipkan bukan dihapus';
  return null;
}

assert.strictEqual(canDeleteStudent('s1', mockPlacements), 'Siswa memiliki riwayat penempatan, harus diarsipkan bukan dihapus');
assert.strictEqual(canDeleteStudent('s999', mockPlacements), null);
console.log('✓ Validasi larangan penghapusan fisik jika ada riwayat penempatan: LULUS');

console.log('--- SEMUA 5 PENGUJIAN ATURAN BISNIS LULUS 100% ---');
