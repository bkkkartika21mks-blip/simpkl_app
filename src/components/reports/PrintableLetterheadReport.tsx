import React from 'react';
import { Placement, SchoolSettings } from '../../types/database';
import { formatDateIndo } from '../../utils/formatters';
import { Printer, X } from 'lucide-react';

interface PrintableLetterheadReportProps {
  isOpen: boolean;
  onClose: () => void;
  placements: Placement[];
  settings: SchoolSettings;
  periodName: string;
}

export const PrintableLetterheadReport: React.FC<PrintableLetterheadReportProps> = ({
  isOpen,
  onClose,
  placements,
  settings,
  periodName,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = formatDateIndo(new Date().toISOString().split('T')[0]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm p-4 sm:p-8 flex justify-center">
      <div className="relative w-full max-w-5xl bg-white text-black rounded-2xl shadow-2xl p-8 sm:p-12 overflow-y-auto my-auto print:p-0 print:m-0 print:shadow-none print:w-full print:max-w-none">
        {/* Floating Screen Action Bar (Hidden when printing) */}
        <div className="no-print flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Pratinjau Cetak / PDF Laporan Resmi PKL
            </h3>
            <p className="text-xs text-slate-500">
              Gunakan fitur print browser untuk simpan sebagai PDF atau cetak dokumen resmi dengan kop sekolah.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            FORMAL KOP SURAT SEKOLAH
            ========================================================================= */}
        <div className="border-b-4 border-double border-black pb-4 mb-6 text-center">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center font-serif">
              <h4 className="text-sm font-bold tracking-wider uppercase">
                {settings.province_name || 'PEMERINTAH PROVINSI SULAWESI SELATAN'}
              </h4>
              <h4 className="text-xs font-bold tracking-wider uppercase">
                {settings.agency_name || 'DINAS PENDIDIKAN'}
              </h4>
              <h2 className="text-xl font-extrabold uppercase tracking-wide mt-0.5">
                {settings.school_name}
              </h2>
              <p className="text-[11px] text-gray-700 mt-1 max-w-2xl font-sans">
                {settings.address} | Telp: {settings.phone} | Email: {settings.email}
              </p>
              <p className="text-[10px] text-gray-600 font-sans font-mono">
                NPSN: {settings.npsn} • Website: {settings.website}
              </p>
            </div>
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center mb-6">
          <h3 className="text-base font-bold underline uppercase tracking-wide">
            LAPORAN REKAPITULASI PENEMPATAN PRAKTIK KERJA LAPANGAN (PKL)
          </h3>
          <p className="text-xs font-medium text-gray-700 mt-1">
            Periode: <b>{periodName}</b> • Tanggal Cetak: {todayStr}
          </p>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100 font-bold border-b border-black">
                <th className="border border-black p-2 text-center w-8">No</th>
                <th className="border border-black p-2">Nama Siswa</th>
                <th className="border border-black p-2">NISN</th>
                <th className="border border-black p-2">Kelas</th>
                <th className="border border-black p-2">Mitra Industri (DU/DI)</th>
                <th className="border border-black p-2">Pembimbing Sekolah</th>
                <th className="border border-black p-2 text-center">Masa PKL</th>
                <th className="border border-black p-2 text-center">Status</th>
                <th className="border border-black p-2 text-center">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {placements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-black p-4 text-center italic text-gray-500">
                    Tidak ada data siswa yang memenuhi filter laporan.
                  </td>
                </tr>
              ) : (
                placements.map((plc, idx) => (
                  <tr key={plc.id} className="border-b border-black">
                    <td className="border border-black p-2 text-center">{idx + 1}</td>
                    <td className="border border-black p-2 font-bold">{plc.student?.full_name}</td>
                    <td className="border border-black p-2 font-mono">{plc.student?.nisn}</td>
                    <td className="border border-black p-2">{plc.student?.class?.name}</td>
                    <td className="border border-black p-2 font-medium">{plc.partner?.company_name}</td>
                    <td className="border border-black p-2">{plc.school_supervisor?.name || '-'}</td>
                    <td className="border border-black p-2 text-[11px] text-center">
                      {formatDateIndo(plc.start_date)} s.d.{' '}
                      {plc.actual_withdrawal_date
                        ? formatDateIndo(plc.actual_withdrawal_date)
                        : formatDateIndo(plc.planned_withdrawal_date)}
                    </td>
                    <td className="border border-black p-2 text-center capitalize font-semibold">
                      {plc.status.replace('_', ' ')}
                    </td>
                    <td className="border border-black p-2 text-center font-bold">
                      {plc.final_score !== undefined && plc.final_score !== null
                        ? plc.final_score
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Formal Signature Section */}
        <div className="grid grid-cols-2 gap-8 text-xs pt-4 font-sans break-inside-avoid">
          <div>
            <p>Mengetahui,</p>
            <p className="font-semibold">Ketua Pokja Hubungan Industri / PKL</p>
            <div className="h-20" /> {/* Space for signature & stamp */}
            <p className="font-bold underline">Ahmad Fauzi, S.Kom., M.Kom.</p>
            <p className="text-gray-600 font-mono">NIP. 19810214 200501 1 002</p>
          </div>

          <div className="text-right">
            <p>{settings.city || 'Makassar'}, {todayStr}</p>
            <p className="font-semibold">Kepala {settings.school_name}</p>
            <div className="h-20" /> {/* Space for signature & stamp */}
            <p className="font-bold underline">{settings.headmaster_name}</p>
            <p className="text-gray-600 font-mono">NIP. {settings.headmaster_nip || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
