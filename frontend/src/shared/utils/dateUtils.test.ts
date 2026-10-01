import { describe, it, expect } from 'vitest';
import { toValidDate, formatDateTime, formatDateOnly, formatRelativeTime } from './dateUtils';

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

  describe('formatRelativeTime', () => {
    const baseDate = new Date(2026, 8, 28, 12, 0, 0); // 28/09/2026 12:00:00

    it('returns "vừa xong" for timestamps less than 1 minute ago', () => {
      const thirtySecondsAgo = new Date(baseDate.getTime() - 30 * 1000);
      expect(formatRelativeTime(thirtySecondsAgo, baseDate)).toBe('vừa xong');
    });

    it('formats minutes ago properly', () => {
      const tenMinutesAgo = new Date(baseDate.getTime() - 10 * 60 * 1000);
      expect(formatRelativeTime(tenMinutesAgo, baseDate)).toBe('10 phút trước');
    });

    it('formats hours ago properly', () => {
      const threeHoursAgo = new Date(baseDate.getTime() - 3 * 3600 * 1000);
      expect(formatRelativeTime(threeHoursAgo, baseDate)).toBe('3 giờ trước');
    });

    it('formats days ago properly', () => {
      const twoDaysAgo = new Date(baseDate.getTime() - 2 * 24 * 3600 * 1000);
      expect(formatRelativeTime(twoDaysAgo, baseDate)).toBe('2 ngày trước');
    });

    it('formats months ago properly', () => {
      const twoMonthsAgo = new Date(baseDate.getTime() - 65 * 24 * 3600 * 1000);
      expect(formatRelativeTime(twoMonthsAgo, baseDate)).toBe('2 tháng trước');
    });

    it('formats years ago properly', () => {
      const twoYearsAgo = new Date(baseDate.getTime() - 750 * 24 * 3600 * 1000);
      expect(formatRelativeTime(twoYearsAgo, baseDate)).toBe('2 năm trước');
    });

    it('returns fallback dash for invalid inputs', () => {
      expect(formatRelativeTime(null)).toBe('—');
      expect(formatRelativeTime(undefined)).toBe('—');
      expect(formatRelativeTime('invalid-date')).toBe('—');
    });
  });
});
