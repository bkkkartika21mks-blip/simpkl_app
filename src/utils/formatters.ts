// Indonesian localized date & string formatters

export function formatDateIndo(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTimeIndo(dateTimeStr?: string | null): string {
  if (!dateTimeStr) return '-';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateTimeStr;
  }
}

export function formatWhatsAppUrl(phoneNumber?: string | null): string | null {
  if (!phoneNumber) return null;
  // Clean phone number: remove spaces, dashes, parentheses
  let cleaned = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  return `https://wa.me/${cleaned}`;
}

export function getPlacementStatusBadge(status: string) {
  switch (status) {
    case 'berlangsung':
      return {
        label: 'Sedang Berlangsung',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'terjadwal':
      return {
        label: 'Terjadwal',
        bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500',
      };
    case 'direncanakan':
      return {
        label: 'Direncanakan',
        bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
      };
    case 'menunggu_penarikan':
      return {
        label: 'Menunggu Penarikan',
        bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 animate-pulse',
        dot: 'bg-orange-500',
      };
    case 'selesai':
      return {
        label: 'Selesai & Ditarik',
        bg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800',
        dot: 'bg-teal-500',
      };
    case 'dibatalkan':
      return {
        label: 'Dibatalkan',
        bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-500',
      };
  }
}
