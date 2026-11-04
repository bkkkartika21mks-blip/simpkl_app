# SIMPKL - Sistem Informasi Pengelolaan Praktik Kerja Lapangan

SIMPKL adalah aplikasi web full-stack modern, aman, dan siap pakai untuk pengelolaan Praktik Kerja Lapangan (PKL) siswa SMK / Vokasi terintegrasi. Sistem ini menghubungkan identitas siswa, mitra industri (DU/DI), guru pembimbing sekolah, pembimbing industri, penetapan penempatan, pemantauan kunjungan (monitoring), proses penarikan, serta pelaporan resmi ber-kop surat.

---

## 🌟 Fitur Utama

1. **Dashboard Operasional Real-Time**:
   - Statistik dinamis berdasarkan periode PKL yang aktif (total siswa, siswa ditempatkan, sedang berlangsung, menunggu penarikan, selesai).
   - Grafik batang visual distribusi siswa per program keahlian/jurusan.
   - Agenda kegiatan 7 hari mendatang (jadwal mulai, rencana penarikan, dan kunjungan monitoring).
   - Indikator peringatan dini operasional (biodata belum lengkap, siswa belum ditempatkan, penarikan terlambat).

2. **Data Master Siswa**:
   - CRUD lengkap data siswa.
   - Pencarian cerdas (Nama, NISN, NIS) & filter per jurusan dan kelas.
   - Validasi ketat NISN: tepat 10 digit numerik dan unik.
   - Profil siswa komprehensif, tautan cepat WhatsApp siswa & orang tua, dan riwayat penempatan PKL lengkap.
   - Pengarsipan aman (*soft archival*) untuk menjaga integritas riwayat penempatan.

3. **Mitra PKL (Dunia Usaha & Dunia Industri)**:
   - CRUD profil perusahaan, penanggung jawab, kontak, kuota penerimaan siswa per periode, dan tautan Google Maps.
   - Progress bar kuota visual secara real-time.
   - Modal detail menampilkan seluruh daftar siswa yang aktif ditempatkan di mitra terkait.

4. **Pembimbing Sekolah & Industri**:
   - Pengelolaan guru pembimbing sekolah (NIP, program keahlian binaan, kontak).
   - Pengelolaan instruktur / pembimbing teknis DU/DI yang terikat langsung pada mitra industri terpilih.

5. **Penempatan Siswa (Placements)**:
   - Formulir penempatan dengan validasi multi-level:
     - **Pencegahan Benturan Jadwal**: Satu siswa tidak dapat ditempatkan pada rentang tanggal yang saling bertumpang tindih.
     - **Pemeriksaan Batas Kuota Mitra**: Penempatan baru otomatis ditolak jika kuota mitra untuk periode tersebut telah penuh.
     - **Konsistensi Pembimbing DU/DI**: Pembimbing industri otomatis disaring hanya untuk instruktur yang bekerja pada mitra yang dipilih.
     - **Validasi Urutan Tanggal**: Rencana penarikan tidak boleh sebelum tanggal mulai penempatan.

6. **Monitoring Kunjungan**:
   - Pencatatan berkala kunjungan guru pembimbing ke lokasi industri.
   - Form mencakup: tanggal kunjungan, perkembangan kompetensi siswa, kendala/masalah, dan rencana tindak lanjut.
   - Dukungan unggah lampiran berkas/foto kunjungan ke private bucket dengan batas ukuran maksimal 10MB.
   - Pembimbing sekolah otomatis difokuskan pada siswa bimbingannya sendiri.

7. **Penarikan & Penyelesaian PKL**:
   - Tab pemantauan: *Mendekati Jadwal Penarikan (14 Hari)*, *Terlambat Ditindaklanjuti (Overdue)*, dan *Selesai & Ditarik*.
   - Aturan bisnis: Lewat rencana penarikan tidak otomatis berarti selesai; status selesai mensyaratkan pencatatan tanggal realisasi penarikan riil dan catatan berita acara.

8. **Impor Data Siswa via CSV**:
   - Unduh template standar CSV resmi.
   - Validasi baris demi baris sebelum disimpan (deteksi duplikasi NISN dalam file maupun di database, validasi kelas terdaftar, dan format 10 digit).
   - Laporan kesalahan transparan per baris (*no silent drops*). Baris valid tetap dapat disimpan.

9. **Laporan & Rekapitulasi Ber-Kop Surat**:
   - Filter multi-dimensi: Periode, Jurusan, Kelas, Mitra DU/DI, Pembimbing, dan Status.
   - Ekspor rekapitulasi data ke format CSV / Microsoft Excel kompatibel (UTF-8 BOM).
   - Pratinjau dan cetak dokumen resmi ber-**Kop Surat Sekolah** lengkap dengan kolom tanda tangan Ketua Pokja PKL dan Kepala Sekolah (dilengkapi NIP).

10. **Audit Trail**:
    - Pencatatan visual otomatis setiap aksi penambahan, perubahan nilai (*before/after diff*), pengarsipan, pemulihan, impor massal, dan perubahan status penempatan.

---

## 🛡️ Hak Akses Pengguna (Role-Based Access Control)

Sistem menerapkan otorisasi ketat di tingkat antarmuka dan Row Level Security (RLS) PostgreSQL:
1. **Admin**: Mengelola seluruh data, akun petugas, pengaturan sekolah, periode, dan laporan.
2. **Operator**: Mengelola data operasional PKL (siswa, mitra, pembimbing, penempatan, monitoring, penarikan), tanpa hak mengelola akun administrator.
3. **Pembimbing Sekolah**: Melihat siswa bimbingannya, melihat mitra, dan mengisi monitoring kunjungan.
4. **Kepala Sekolah**: Melihat dashboard statistik dan laporan rekapitulasi secara *read-only*.

> **Keamanan**: Pendaftaran akun mandiri (*public sign up*) dinonaktifkan. Seluruh akun dibuat dan diundang secara resmi oleh pihak Administrator. Service role key tidak pernah diekspos ke frontend.

---

## 🛠️ Arsitektur Teknologi

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React Icons.
- **Backend / Database**: Supabase (PostgreSQL 15+, Supabase Auth, Private Storage Bucket).
- **Security**: PostgreSQL Row Level Security (RLS), Trigger-based Validation, Signed Temporary URLs.
- **Parsing & Export**: PapaParse, Native Print Engine with `@media print` Kop Surat.

---

## 🚀 Panduan Setup & Instalasi Lokal

### 1. Prasyarat
- Node.js (v18 ke atas) & pnpm / npm
- Akun Supabase (opsional jika ingin menghubungkan ke database cloud langsung)

### 2. Salin Repositori & Instal Dependensi
```bash
# Clone atau buka direktori proyek
cd SIMPKL

# Instal dependensi
pnpm install
```

### 3. Konfigurasi Variabel Lingkungan (.env)
Salin `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Isi kredensial Supabase Anda:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
*(Catatan: Jika kredensial belum dimasukkan, SIMPKL otomatis berjalan dalam Mode Simulasi Lokal Persisten dengan data fiktif berlabel [DATA CONTOH], sehingga seluruh alur CRUD, validasi, dan ekspor dapat langsung diuji tanpa crash).*

### 4. Eksekusi Migrasi Database PostgreSQL Supabase
Buka **SQL Editor** pada Dashboard Supabase Anda, lalu jalankan file migrasi berikut secara berurutan:
1. `supabase/migrations/01_initial_schema.sql` (Struktur 11 tabel, foreign keys, indeks, dan 4 triggers aturan bisnis).
2. `supabase/migrations/02_security_rls.sql` (Kebijakan Row Level Security untuk 4 peran serta konfigurasi bucket privat `simpkl_documents`).
3. `supabase/seed.sql` (Data awal simulasi fiktif berlabel [DATA CONTOH]).

### 5. Jalankan Server Pengembang
```bash
pnpm run dev
```
Buka browser pada `http://localhost:5173`.

---

## 💾 Panduan Backup & Restore Database Resmi

> ⚠️ **PENTING**: Ekspor CSV/Excel melalui menu Laporan hanyalah rekapan tabular untuk kebutuhan administratif sekolah dan **BUKAN** merupakan cadangan database lengkap (*full database backup*). Ekspor spreadsheet tidak menyimpan relasi foreign keys, triggers aturan bisnis, histori audit log, hash kata sandi, maupun policy RLS.

### Melakukan Backup Penuh (pg_dump)
Jalankan perintah ini di terminal server untuk membuat cadangan skema dan data biner PostgreSQL:
```bash
pg_dump -h db.[PROJECT-ID].supabase.co -U postgres -d postgres -F c -b -v -f "simpkl_backup_$(date +%Y%m%d).dump"
```

### Melakukan Restore Database (pg_restore)
Untuk mengembalikan data dari cadangan dump ke database baru:
```bash
pg_restore -h db.[PROJECT-ID].supabase.co -U postgres -d postgres -v --clean "simpkl_backup_YYYYMMDD.dump"
```

---

## 📄 Lisensi
Hak Cipta © 2026 SIMPKL. Dibuat untuk sistem informasi operasional sekolah kejuruan dan vokasi Indonesia.
