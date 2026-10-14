import { describe, it, expect } from 'vitest';
import {
  getElapsedBusinessMs,
  isEligibleForHolReminder,
  toStandardDate,
} from './businessDaysCalculator.js';
import { MS_PER_DAY } from './autoArchiveService.js';

describe('businessDaysCalculator', () => {
  describe('toStandardDate', () => {
    it('returns null when input is null or undefined', () => {
      expect(toStandardDate(null)).toBeNull();
      expect(toStandardDate(undefined)).toBeNull();
    });

    it('returns date when input is already a Date', () => {
      const d = new Date('2026-10-12T10:00:00+07:00');
      expect(toStandardDate(d)).toBe(d);
    });

    it('converts Firestore Timestamp to Date', () => {
      const d = new Date('2026-10-12T10:00:00+07:00');
      const timestampLike = { toDate: () => d };
      expect(toStandardDate(timestampLike)).toBe(d);
    });
  });

  describe('getElapsedBusinessMs', () => {
    it('returns 0 when startDate is greater than or equal to endDate', () => {
      const d1 = new Date('2026-10-12T10:00:00+07:00');
      const d2 = new Date('2026-10-12T09:00:00+07:00');
      expect(getElapsedBusinessMs(d1, d2)).toBe(0);
      expect(getElapsedBusinessMs(d1, d1)).toBe(0);
    });

    it('calculates exact hours on the same weekday', () => {
      // Monday 09:00 to Monday 17:00 (8 hours)
      const start = new Date('2026-10-12T09:00:00+07:00');
      const end = new Date('2026-10-12T17:00:00+07:00');
      const expectedMs = 8 * 60 * 60 * 1000;
      expect(getElapsedBusinessMs(start, end)).toBe(expectedMs);
    });

    it('calculates 48 business hours from Monday 10:00 to Wednesday 10:00', () => {
      // 2026-10-12 is Monday, 2026-10-14 is Wednesday
      const start = new Date('2026-10-12T10:00:00+07:00');
      const end = new Date('2026-10-14T10:00:00+07:00');
      expect(getElapsedBusinessMs(start, end)).toBe(2 * MS_PER_DAY);
    });

    it('skips Saturday and Sunday entirely when spanning a weekend', () => {
      // 2026-10-15 is Thursday 15:00
      // 2026-10-19 is Monday 15:00
      // Thursday 15:00 -> Friday 24:00 = 33h
      // Saturday & Sunday = 0h
      // Monday 00:00 -> Monday 15:00 = 15h
      // Total = 48h
      const start = new Date('2026-10-15T15:00:00+07:00');
      const end = new Date('2026-10-19T15:00:00+07:00');
      expect(getElapsedBusinessMs(start, end)).toBe(2 * MS_PER_DAY);
    });

    it('returns 0 business time for interval entirely within Saturday and Sunday', () => {
      // 2026-10-17 is Saturday, 2026-10-18 is Sunday
      const start = new Date('2026-10-17T09:00:00+07:00');
      const end = new Date('2026-10-18T18:00:00+07:00');
      expect(getElapsedBusinessMs(start, end)).toBe(0);
    });

    it('handles starting on weekend and ending on Monday', () => {
      // Saturday 14:00 to Monday 10:00 -> only Monday 00:00 to 10:00 (10 hours)
      const start = new Date('2026-10-17T14:00:00+07:00');
      const end = new Date('2026-10-19T10:00:00+07:00');
      expect(getElapsedBusinessMs(start, end)).toBe(10 * 60 * 60 * 1000);
    });
  });

  describe('isEligibleForHolReminder', () => {
    it('returns false if reference date is missing', () => {
      expect(isEligibleForHolReminder(null)).toBe(false);
      expect(isEligibleForHolReminder(undefined)).toBe(false);
    });

    it('returns false when elapsed business time is under 48 hours', () => {
      // Monday 10:00 to Wednesday 09:59 (47h 59m)
      const start = new Date('2026-10-12T10:00:00+07:00');
      const now = new Date('2026-10-14T09:59:00+07:00');
      expect(isEligibleForHolReminder(start, now, 2)).toBe(false);
    });

    it('returns true when elapsed business time reaches 48 hours exactly', () => {
      // Monday 10:00 to Wednesday 10:00 (48h)
      const start = new Date('2026-10-12T10:00:00+07:00');
      const now = new Date('2026-10-14T10:00:00+07:00');
      expect(isEligibleForHolReminder(start, now, 2)).toBe(true);
    });

    it('handles Friday submissions properly (reaches 48h on Tuesday 10:00)', () => {
      // 2026-10-16 is Friday 10:00
      // 2026-10-19 is Monday 10:00 (24 business hours elapsed) -> false
      // 2026-10-20 is Tuesday 10:00 (48 business hours elapsed) -> true
      const start = new Date('2026-10-16T10:00:00+07:00');
      const monNow = new Date('2026-10-19T10:00:00+07:00');
      const tueNow = new Date('2026-10-20T10:00:00+07:00');

      expect(isEligibleForHolReminder(start, monNow, 2)).toBe(false);
      expect(isEligibleForHolReminder(start, tueNow, 2)).toBe(true);
    });

    it('supports Firestore Timestamp objects seamlessly', () => {
      const date = new Date('2026-10-12T10:00:00+07:00');
      const timestamp = { toDate: () => date };
      const now = new Date('2026-10-14T11:00:00+07:00');

      expect(isEligibleForHolReminder(timestamp, now, 2)).toBe(true);
    });
  });
});
