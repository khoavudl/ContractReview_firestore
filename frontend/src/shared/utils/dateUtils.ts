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

