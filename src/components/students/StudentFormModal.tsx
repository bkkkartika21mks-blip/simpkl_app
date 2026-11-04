import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Student, ClassRoom, Department } from '../../types/database';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { validateNISN } from '../../utils/validators';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentToEdit?: Student | null;
  classes: ClassRoom[];
  departments: Department[];
  allStudents: Student[];
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  studentToEdit,
  classes,
  departments,
  allStudents,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [fullName, setFullName] = useState('');
  const [nisn, setNisn] = useState('');
  const [nis, setNis] = useState('');
  const [classId, setClassId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [address, setAddress] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nisnError, setNisnError] = useState<string | null>(null);

  useEffect(() => {
    if (studentToEdit) {
      setFullName(studentToEdit.full_name);
      setNisn(studentToEdit.nisn);
      setNis(studentToEdit.nis);
      setClassId(studentToEdit.class_id);
      setDepartmentId(studentToEdit.department_id);
      setGender(studentToEdit.gender || 'L');
      setAddress(studentToEdit.address || '');
      setStudentPhone(studentToEdit.student_phone || '');
      setParentName(studentToEdit.parent_name || '');
      setParentPhone(studentToEdit.parent_phone || '');
      setIsActive(studentToEdit.is_active);
    } else {
      setFullName('');
      setNisn('');
      setNis('');
      setClassId(classes[0]?.id || '');
      setDepartmentId(classes[0]?.department_id || departments[0]?.id || '');
      setGender('L');
      setAddress('');
      setStudentPhone('');
      setParentName('');
      setParentPhone('');
      setIsActive(true);
    }
    setNisnError(null);
  }, [studentToEdit, isOpen, classes, departments]);

  // Auto-sync department when class changes
  const handleClassChange = (selectedClassId: string) => {
    setClassId(selectedClassId);
    const cls = classes.find(c => c.id === selectedClassId);
    if (cls && cls.department_id) {
      setDepartmentId(cls.department_id);
    }
  };

  const handleNisnChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setNisn(clean);
    if (clean.length > 0 && clean.length < 10) {
      setNisnError('NISN harus tepat 10 digit angka.');
    } else {
      const err = validateNISN(clean, allStudents, studentToEdit?.id);
      setNisnError(err ? err.message : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const err = validateNISN(nisn, allStudents, studentToEdit?.id);
    if (err) {
      setNisnError(err.message);
      error('Validasi Gagal', err.message);
      return;
    }

    if (!fullName.trim()) {
      error('Validasi Gagal', 'Nama lengkap siswa wajib diisi.');
      return;
    }

    if (!classId) {
      error('Validasi Gagal', 'Kelas wajib dipilih.');
      return;
    }

    if (!parentPhone.trim()) {
      error('Validasi Gagal', 'Nomor kontak orang tua wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      await dataService.saveStudent(
        {
          id: studentToEdit?.id,
          full_name: fullName.trim(),
          nisn: nisn.trim(),
          nis: nis.trim() || nisn.slice(-6),
          class_id: classId,
          department_id: departmentId || classes.find(c => c.id === classId)?.department_id || 'dept-1',
          gender,
          address: address.trim() || '-',
          student_phone: studentPhone.trim(),
          parent_name: parentName.trim(),
          parent_phone: parentPhone.trim(),
          is_active: isActive,
        },
        { name: user?.name || 'Petugas', email: user?.email || 'petugas@simpkl.sch.id' }
      );

      success(
        studentToEdit ? 'Data Siswa Diperbarui' : 'Siswa Berhasil Ditambahkan',
        `${fullName} telah tersimpan di sistem.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Gagal Menyimpan Data', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={studentToEdit ? 'Ubah Data Siswa' : 'Tambah Siswa Baru'}
      subtitle="Pastikan NISN dan nomor kontak orang tua valid sesuai data Dapodik"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Nama Lengkap Siswa <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Contoh: Muhammad Rizky Pratama"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            required
          />
        </div>

        {/* NISN & NIS (Two column) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              NISN (Tepat 10 Digit) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              maxLength={10}
              value={nisn}
              onChange={e => handleNisnChange(e.target.value)}
              placeholder="0061234567"
              className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                nisnError
                  ? 'border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-200'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
              } focus:ring-2 focus:ring-teal-500 focus:outline-none`}
              required
            />
            {nisnError && <p className="text-xs text-rose-500 mt-1">{nisnError}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              NIS (Nomor Induk Sekolah)
            </label>
            <input
              type="text"
              value={nis}
              onChange={e => setNis(e.target.value)}
              placeholder="Contoh: 22231045"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Class & Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Kelas & Rombel <span className="text-rose-500">*</span>
            </label>
            <select
              value={classId}
              onChange={e => handleClassChange(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.department?.name || 'Jurusan'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Jenis Kelamin
            </label>
            <div className="flex items-center gap-4 pt-1.5">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="L"
                  checked={gender === 'L'}
                  onChange={() => setGender('L')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span>Laki-laki (L)</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="P"
                  checked={gender === 'P'}
                  onChange={() => setGender('P')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span>Perempuan (P)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Alamat Domisili Siswa
          </label>
          <textarea
            rows={2}
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota..."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* Student WhatsApp & Parent Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              No. WhatsApp Siswa
            </label>
            <input
              type="tel"
              value={studentPhone}
              onChange={e => setStudentPhone(e.target.value)}
              placeholder="081234567890"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              No. WhatsApp Orang Tua <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={parentPhone}
              onChange={e => setParentPhone(e.target.value)}
              placeholder="081288990011"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Parent Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Nama Orang Tua / Wali
          </label>
          <input
            type="text"
            value={parentName}
            onChange={e => setParentName(e.target.value)}
            placeholder="Contoh: H. Agus Bambang"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* Active Toggle */}
        <div className="pt-2">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Status Siswa Aktif (Dapat Ditempatkan PKL)
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || Boolean(nisnError)}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-sm shadow-teal-600/30"
          >
            {isSubmitting ? 'Menyimpan...' : studentToEdit ? 'Perbarui Siswa' : 'Simpan Siswa'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
