import { describe, it, expect } from 'vitest';
import { toValidDate, formatDateTime, formatDateOnly } from './dateUtils';

describe('dateUtils', () => {
  describe('toValidDate', () => {
    it('handles Date instances', () => {
      const d = new Date(2026, 8, 28, 14, 30);
      expect(toValidDate(d)).toEqual(d);
    });

    it('handles Firestore timestamp-like objects', () => {
      const ts = { seconds: 1790600000 };
      const expected = new Date(ts.seconds * 1000);
      expect(toValidDate(ts)).toEqual(expected);
    });

    it('handles ISO strings', () => {
      const iso = '2026-09-28T14:30:00.000Z';
      expect(toValidDate(iso)?.toISOString()).toBe(iso);
    });

    it('returns null for null, undefined or invalid dates', () => {
      expect(toValidDate(null)).toBeNull();
      expect(toValidDate(undefined)).toBeNull();
      expect(toValidDate('invalid-date-string')).toBeNull();
    });
  });

  describe('formatDateTime', () => {
    it('formats a valid date into DD/MM/YYYY HH:mm', () => {
      const d = new Date(2026, 8, 28, 9, 5); // Sept is month index 8
      expect(formatDateTime(d)).toBe('28/09/2026 09:05');
    });

    it('returns fallback dash for invalid inputs', () => {
      expect(formatDateTime(null)).toBe('—');
      expect(formatDateTime(undefined)).toBe('—');
    });
  });

  describe('formatDateOnly', () => {
    it('formats date into DD/MM/YYYY', () => {
      const d = new Date(2026, 8, 28, 15, 30);
      expect(formatDateOnly(d)).toBe('28/09/2026');
    });

    it('returns fallback dash for invalid inputs', () => {
      expect(formatDateOnly(null)).toBe('—');
    });
  });
});
