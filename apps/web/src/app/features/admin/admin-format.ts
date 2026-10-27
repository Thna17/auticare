export const errorMessage = (err: unknown, fallback: string): string =>
  (err as { error?: { error?: { message?: string } } })?.error?.error?.message ?? fallback;

export const formatDate = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** "ACCOUNT_SUSPENDED" → "Account suspended". */
export const actionLabel = (action: string): string => {
  const words = action.toLowerCase().split('_');
  return words.join(' ').replace(/^./, (c) => c.toUpperCase());
};

export const totalPages = (total: number, pageSize: number): number =>
  Math.max(1, Math.ceil(total / pageSize));
