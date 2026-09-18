export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return '₹' + amount.toLocaleString('en-IN');
}

export function formatDate(dateString: string | Date | undefined | null): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string | Date | undefined | null): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusBadgeClass(status: string | undefined): string {
  switch (status) {
    case 'PAID':
    case 'COMPLETED':
    case 'ACTIVE':
    case 'FULLY_RECEIVED':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'IN_PROGRESS':
    case 'PARTIALLY_RECEIVED':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'REVERSED':
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20 line-through';
    case 'PENDING':
    case 'PLANNING':
      return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    case 'ON_HOLD':
    case 'ARCHIVED':
      return 'bg-slate-700/50 text-slate-400 border border-slate-600/30';
    default:
      return 'bg-slate-800 text-slate-300 border border-slate-700';
  }
}
