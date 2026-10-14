/**
 * Pure Helper: Business Days & Hours Calculator (UTC+7 / Asia/Ho_Chi_Minh)
 * Follows Clean Architecture & SRP (<= 25 lines per function).
 */

import { MS_PER_DAY } from './autoArchiveService.js';

export const VN_TIMEZONE_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Converts a Date or Firestore Timestamp into a standard JavaScript Date.
 */
export function toStandardDate(
  dateOrTimestamp: Date | { toDate?: () => Date } | undefined | null
): Date | null {
  if (!dateOrTimestamp) return null;
  if (dateOrTimestamp instanceof Date) return dateOrTimestamp;
  if (typeof dateOrTimestamp.toDate === 'function') {
    return dateOrTimestamp.toDate();
  }
  return null;
}

/**
 * Calculates total elapsed business time (in milliseconds) between two dates,
 * excluding Saturdays and Sundays based on UTC+7 (Vietnam Timezone).
 * Follows SRP with <= 25 lines of logic.
 */
export function getElapsedBusinessMs(startDate: Date, endDate: Date): number {
  if (startDate >= endDate) return 0;

  let currentMs = startDate.getTime();
  const endMs = endDate.getTime();
  let elapsedBusinessMs = 0;

  while (currentMs < endMs) {
    const vnTime = currentMs + VN_TIMEZONE_OFFSET_MS;
    const dayIndex = Math.floor(vnTime / MS_PER_DAY);
    const nextDayStartUtc = (dayIndex + 1) * MS_PER_DAY - VN_TIMEZONE_OFFSET_MS;
    const segmentEnd = Math.min(endMs, nextDayStartUtc);

    // 0 = Sun, 6 = Sat (Unix Epoch 1970-01-01 was Thursday = 4)
    const dayOfWeek = ((dayIndex + 4) % 7 + 7) % 7;
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      elapsedBusinessMs += segmentEnd - currentMs;
    }

    currentMs = segmentEnd;
  }

  return elapsedBusinessMs;
}

/**
 * Checks if an overdue threshold in business days (e.g. 2 business days = 48 business hours)
 * has been reached since the reference date.
 * Follows SRP with <= 25 lines of logic.
 */
export function isEligibleForHolReminder(
  lastRefDate: Date | { toDate?: () => Date } | undefined | null,
  now: Date = new Date(),
  thresholdBusinessDays = 2
): boolean {
  const startDate = toStandardDate(lastRefDate);
  if (!startDate) return false;

  const elapsedMs = getElapsedBusinessMs(startDate, now);
  const requiredMs = thresholdBusinessDays * MS_PER_DAY;
  return elapsedMs >= requiredMs;
}
