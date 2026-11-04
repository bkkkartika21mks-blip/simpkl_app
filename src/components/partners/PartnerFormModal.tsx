import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Partner } from '../../types/database';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface PartnerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  partnerToEdit?: Partner | null;
}

export const PartnerFormModal: React.FC<PartnerFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  partnerToEdit,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [companyName, setCompanyName] = useState('');
  const [industrySector, setIndustrySector] = useState('');
  const [address, setAddress] = useState('');
  const [personInCharge, setPersonInCharge] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [defaultQuota, setDefaultQuota] = useState(5);
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (partnerToEdit) {
      setCompanyName(partnerToEdit.company_name);
      setIndustrySector(partnerToEdit.industry_sector);
      setAddress(partnerToEdit.address);
      setPersonInCharge(partnerToEdit.person_in_charge);
      setContactNumber(partnerToEdit.contact_number);
      setEmail(partnerToEdit.email || '');
      setDefaultQuota(partnerToEdit.default_quota || 5);
      setGoogleMapsUrl(partnerToEdit.google_maps_url || '');
    } else {
      setCompanyName('');
      setIndustrySector('');
      setAddress('');
      setPersonInCharge('');
      setContactNumber('');
      setEmail('');
      setDefaultQuota(5);
      setGoogleMapsUrl('');
    }
  }, [partnerToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      error('Validasi Gagal', 'Nama mitra/perusahaan wajib diisi.');
      return;
    }
    if (!industrySector.trim()) {
      error('Validasi Gagal', 'Bidang usaha wajib diisi.');
      return;
    }
    if (!address.trim()) {
      error('Validasi Gagal', 'Alamat mitra wajib diisi.');
      return;
    }
    if (!personInCharge.trim()) {
      error('Validasi Gagal', 'Nama pimpinan / penanggung jawab wajib diisi.');
      return;
    }
    if (!contactNumber.trim()) {
      error('Validasi Gagal', 'Nomor kontak mitra wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      await dataService.savePartner(
        {
          id: partnerToEdit?.id,
          company_name: companyName.trim(),
          industry_sector: industrySector.trim(),
          address: address.trim(),
          person_in_charge: personInCharge.trim(),
          contact_number: contactNumber.trim(),
          email: email.trim(),
          default_quota: Number(defaultQuota) || 5,
          google_maps_url: googleMapsUrl.trim(),
        },
        { name: user?.name || 'Petugas', email: user?.email || 'admin@simpkl.sch.id' }
      );

      success(
        partnerToEdit ? 'Mitra Diperbarui' : 'Mitra Berhasil Ditambahkan',
        `${companyName} telah terdaftar di sistem SIMPKL.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Gagal Menyimpan Mitra', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={partnerToEdit ? 'Ubah Data Mitra DU/DI' : 'Tambah Mitra DU/DI Baru'}
      subtitle="Kelola profil industri, pimpinan, kuota penerimaan siswa, dan lokasi"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Nama Instansi / Perusahaan <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="Contoh: PT Telkom Akses Surabaya"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            required
          />
        </div>

        {/* Industry Sector & Quota */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Bidang Usaha / Sektor Industri <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={industrySector}
              onChange={e => setIndustrySector(e.target.value)}
              placeholder="Contoh: Teknologi Informasi / Jaringan"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Kuota Siswa per Periode <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={defaultQuota}
              onChange={e => setDefaultQuota(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Alamat Kantor / Lokasi Kerja <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Jalan, Gedung, Kawasan Industri, Kota..."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            required
          />
        </div>

        {/* Person In Charge & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Penanggung Jawab / Pimpinan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={personInCharge}
              onChange={e => setPersonInCharge(e.target.value)}
              placeholder="Contoh: Ir. Hendra Saputra, M.T."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              No. Kontak / Telepon Mitra <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={contactNumber}
              onChange={e => setContactNumber(e.target.value)}
              placeholder="021-1234567 atau 081234567890"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Email & Google Maps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Email Resmi Mitra
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="hrd@perusahaan.co.id"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              URL Google Maps Lokasi
            </label>
            <input
              type="url"
              value={googleMapsUrl}
              onChange={e => setGoogleMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/?q=..."
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
            {isSubmitting ? 'Menyimpan...' : partnerToEdit ? 'Perbarui Mitra' : 'Simpan Mitra'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
