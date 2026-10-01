interface FirestoreTimestampLike {
  seconds: number;
  nanoseconds?: number;
}

/**
 * Normalizes Firestore timestamp, Date, number, or ISO string to a JavaScript Date object.
 */
export function toValidDate(input: unknown): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  if (typeof input === 'object' && 'seconds' in input) {
    const ts = input as FirestoreTimestampLike;
    return new Date(ts.seconds * 1000);
  }

  if (typeof input === 'string' || typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Formats a timestamp into standard Vietnamese format: DD/MM/YYYY HH:mm
 */
export function formatDateTime(input: unknown): string {
  const date = toValidDate(input);
  if (!date) return '—';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formats a timestamp into date-only format: DD/MM/YYYY
 */
export function formatDateOnly(input: unknown): string {
  const date = toValidDate(input);
  if (!date) return '—';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export const formatDate = formatDateOnly;

/**
 * Formats a timestamp into relative Vietnamese time:
 * 'vừa xong', 'x phút trước', 'x giờ trước', 'x ngày trước', 'x tháng trước', 'x năm trước'
 */
export function formatRelativeTime(input: unknown, baseDate?: Date): string {
  const date = toValidDate(input);
  if (!date) return '—';

  const now = baseDate ?? new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 60 * 1000) {
    return 'vừa xong';
  }

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }

  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }

  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays < 30) {
    return `${diffDays} ngày trước`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} tháng trước`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} năm trước`;
}

