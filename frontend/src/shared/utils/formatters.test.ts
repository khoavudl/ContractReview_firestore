import { describe, it, expect } from 'vitest';
import { formatContractId, truncateText, formatFileSize } from './formatters';

describe('formatters', () => {
  describe('formatContractId', () => {
    it('formats year-month and sequence correctly', () => {
      expect(formatContractId('2609', 1)).toBe('CTR-2609-0001');
      expect(formatContractId('2609', 42)).toBe('CTR-2609-0042');
      expect(formatContractId('2609', 9999)).toBe('CTR-2609-9999');
    });

    it('strips non-numeric characters from yearMonth', () => {
      expect(formatContractId('26-09', 5)).toBe('CTR-2609-0005');
    });
  });

  describe('truncateText', () => {
    it('returns original string if within maxLength', () => {
      expect(truncateText('Short text', 20)).toBe('Short text');
    });

    it('truncates and adds ellipsis if exceeds maxLength', () => {
      expect(truncateText('This is a longer contract clause description', 15)).toBe(
        'This is a longe...'
      );
    });

    it('handles empty input gracefully', () => {
      expect(truncateText('', 10)).toBe('');
    });
  });

  describe('formatFileSize', () => {
    it('formats 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('formats small bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('formats kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(2048)).toBe('2.0 KB');
    });

    it('formats megabytes', () => {
      expect(formatFileSize(1024 * 1024 * 5)).toBe('5.0 MB');
    });
  });
});
