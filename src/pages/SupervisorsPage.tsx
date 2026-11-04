import React, { useState, useEffect } from 'react';
import { UserCheck, Briefcase, Plus, Phone, Mail, Edit2, Search } from 'lucide-react';
import { SchoolSupervisor, IndustrySupervisor, Partner, Department } from '../types/database';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { SupervisorFormModal } from '../components/supervisors/SupervisorFormModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const SupervisorsPage: React.FC = () => {
  const { canEditOperations } = useAuth();
  const [activeTab, setActiveTab] = useState<'school' | 'industry'>('school');

  const [schoolSupervisors, setSchoolSupervisors] = useState<SchoolSupervisor[]>([]);
  const [industrySupervisors, setIndustrySupervisors] = useState<IndustrySupervisor[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSchoolSup, setSelectedSchoolSup] = useState<SchoolSupervisor | null>(null);
  const [selectedIndSup, setSelectedIndSup] = useState<IndustrySupervisor | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [schoolData, indData, partnerData, deptData] = await Promise.all([
        dataService.getSchoolSupervisors(),
        dataService.getIndustrySupervisors(),
        dataService.getPartners(),
        dataService.getDepartments(),
      ]);
      setSchoolSupervisors(schoolData);
      setIndustrySupervisors(indData);
      setPartners(partnerData);
      setDepartments(deptData);
    } catch (err) {
      console.error('Failed to load supervisors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSchool = schoolSupervisors.filter(
    s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nip && s.nip.includes(searchQuery))
  );

  const filteredIndustry = industrySupervisors.filter(
    i =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.partner?.company_name.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            Data Guru & Pembimbing PKL
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola data guru pembimbing dari pihak sekolah dan instruktur teknis dari dunia industri rekanan.
          </p>
        </div>

        {canEditOperations && (
          <button
            onClick={() => {
              if (activeTab === 'school') {
                setSelectedSchoolSup(null);
              } else {
                setSelectedIndSup(null);
              }
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-all shadow-md shadow-teal-600/30 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'school' ? 'Tambah Pembimbing Sekolah' : 'Tambah Pembimbing Industri'}
          </button>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('school')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'school'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Pembimbing Sekolah ({schoolSupervisors.length})
          </button>
          <button
            onClick={() => setActiveTab('industry')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'industry'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Pembimbing DU/DI ({industrySupervisors.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'school'
                ? 'Cari nama guru atau NIP...'
                : 'Cari nama pembimbing atau mitra...'
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <LoadingSpinner label="Memuat data pembimbing..." size="md" />
      ) : activeTab === 'school' ? (
        filteredSchool.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="Tidak Ada Guru Pembimbing Ditemukan"
            description="Belum ada guru pembimbing yang terdaftar atau hasil pencarian tidak sesuai."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchool.map(sup => (
              <div
                key={sup.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                      {sup.name.charAt(0)}
                    </div>
                    {canEditOperations && (
                      <button
                        onClick={() => {
                          setSelectedSchoolSup(sup);
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                        title="Ubah Data"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{sup.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    NIP: {sup.nip || 'Belum diisi'}
                  </p>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-1">
                    {sup.department?.name || 'Seluruh Jurusan'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sup.phone}</span>
                    </div>
                    {sup.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sup.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredIndustry.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Tidak Ada Pembimbing Industri Ditemukan"
          description="Belum ada instruktur industri yang terdaftar."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIndustry.map(ind => (
            <div
              key={ind.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  {canEditOperations && (
                    <button
                      onClick={() => {
                        setSelectedIndSup(ind);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                      title="Ubah Data"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{ind.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {ind.position || 'Pembimbing Teknis'}
                </p>
                <div className="mt-1 text-xs font-semibold text-teal-600 dark:text-teal-400">
                  {ind.partner?.company_name || 'Mitra Industri'}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ind.phone}</span>
                  </div>
                  {ind.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ind.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <SupervisorFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
        type={activeTab}
        schoolSupervisorToEdit={selectedSchoolSup}
        industrySupervisorToEdit={selectedIndSup}
        partners={partners}
        departments={departments}
      />
    </div>
  );
};
