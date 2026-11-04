import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { SchoolSupervisor, IndustrySupervisor, Partner, Department } from '../../types/database';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface SupervisorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: 'school' | 'industry';
  schoolSupervisorToEdit?: SchoolSupervisor | null;
  industrySupervisorToEdit?: IndustrySupervisor | null;
  partners: Partner[];
  departments: Department[];
}

export const SupervisorFormModal: React.FC<SupervisorFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  type,
  schoolSupervisorToEdit,
  industrySupervisorToEdit,
  partners,
  departments,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [position, setPosition] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (type === 'school') {
      if (schoolSupervisorToEdit) {
        setName(schoolSupervisorToEdit.name);
        setNip(schoolSupervisorToEdit.nip || '');
        setPhone(schoolSupervisorToEdit.phone);
        setEmail(schoolSupervisorToEdit.email || '');
        setDepartmentId(schoolSupervisorToEdit.department_id || '');
      } else {
        setName('');
        setNip('');
        setPhone('');
        setEmail('');
        setDepartmentId(departments[0]?.id || '');
      }
    } else {
      if (industrySupervisorToEdit) {
        setName(industrySupervisorToEdit.name);
        setPartnerId(industrySupervisorToEdit.partner_id);
        setPosition(industrySupervisorToEdit.position || '');
        setPhone(industrySupervisorToEdit.phone);
        setEmail(industrySupervisorToEdit.email || '');
      } else {
        setName('');
        setPartnerId(partners[0]?.id || '');
        setPosition('Pembimbing DU/DI');
        setPhone('');
        setEmail('');
      }
    }
  }, [type, schoolSupervisorToEdit, industrySupervisorToEdit, isOpen, partners, departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      error('Validasi Gagal', 'Nama pembimbing wajib diisi.');
      return;
    }
    if (!phone.trim()) {
      error('Validasi Gagal', 'Nomor kontak telepon wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (type === 'school') {
        await dataService.saveSchoolSupervisor(
          {
            id: schoolSupervisorToEdit?.id,
            name: name.trim(),
            nip: nip.trim(),
            phone: phone.trim(),
            email: email.trim(),
            department_id: departmentId || undefined,
          },
          { name: user?.name || 'Petugas', email: user?.email || 'admin@simpkl.sch.id' }
        );
        success('Berhasil', 'Data pembimbing sekolah telah disimpan.');
      } else {
        if (!partnerId) {
          error('Validasi Gagal', 'Mitra industri wajib dipilih.');
          return;
        }
        await dataService.saveIndustrySupervisor(
          {
            id: industrySupervisorToEdit?.id,
            name: name.trim(),
            partner_id: partnerId,
            position: position.trim(),
            phone: phone.trim(),
            email: email.trim(),
          },
          { name: user?.name || 'Petugas', email: user?.email || 'admin@simpkl.sch.id' }
        );
        success('Berhasil', 'Data pembimbing industri telah disimpan.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      error('Gagal Menyimpan', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        type === 'school'
          ? schoolSupervisorToEdit
            ? 'Ubah Guru Pembimbing Sekolah'
            : 'Tambah Guru Pembimbing Sekolah'
          : industrySupervisorToEdit
          ? 'Ubah Pembimbing Industri (DU/DI)'
          : 'Tambah Pembimbing Industri (DU/DI)'
      }
      subtitle={
        type === 'school'
          ? 'Guru yang ditugaskan membimbing dan memonitor siswa di lapangan'
          : 'Instruktur / PIC teknis yang membimbing siswa di tempat magang'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Nama Lengkap & Gelar <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Contoh: Ahmad Fauzi, S.Kom., M.Kom."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            required
          />
        </div>

        {/* School specific: NIP & Department */}
        {type === 'school' ? (
          <>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                NIP (Nomor Induk Pegawai)
              </label>
              <input
                type="text"
                value={nip}
                onChange={e => setNip(e.target.value)}
                placeholder="19810214 200501 1 002"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Program Keahlian / Jurusan
              </label>
              <select
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">-- Semua Jurusan --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          /* Industry specific: Partner & Position */
          <>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Mitra Perusahaan / Instansi <span className="text-rose-500">*</span>
              </label>
              <select
                value={partnerId}
                onChange={e => setPartnerId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              >
                <option value="">-- Pilih Mitra Industri --</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Jabatan di Perusahaan
              </label>
              <input
                type="text"
                value={position}
                onChange={e => setPosition(e.target.value)}
                placeholder="Lead Engineer / Manager HRD / Supervisor"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </>
        )}

        {/* Contact Phone & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Nomor WhatsApp / HP <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="081234567890"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="pembimbing@instansi.com"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
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
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-sm shadow-teal-600/30"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Pembimbing'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
