/**
 * Feature: Contracts Management
 * Unit Tests: annexHelpers.test.ts — Verification of multi-document bundle & inheritance logic
 */

import { describe, it, expect } from 'vitest';
import type { AnnexFile } from '@/shared';
import {
  generateAnnexId,
  formatAnnexLabel,
  buildAnnexStoragePath,
  computeApprovedFileName,
  resolveInheritedAnnexFiles,
} from './annexHelpers';

describe('annexHelpers', () => {
  describe('generateAnnexId', () => {
    it('generates padded PL identifiers for single digit indices', () => {
      expect(generateAnnexId(1)).toBe('PL01');
      expect(generateAnnexId(2)).toBe('PL02');
      expect(generateAnnexId(9)).toBe('PL09');
    });

    it('generates correct identifiers for two digit indices', () => {
      expect(generateAnnexId(10)).toBe('PL10');
      expect(generateAnnexId(12)).toBe('PL12');
    });

    it('gracefully handles zero or negative numbers by clamping to PL01', () => {
      expect(generateAnnexId(0)).toBe('PL01');
      expect(generateAnnexId(-5)).toBe('PL01');
    });
  });

  describe('formatAnnexLabel', () => {
    it('formats default label when custom title is omitted', () => {
      expect(formatAnnexLabel('PL01')).toBe('Phụ lục 1');
      expect(formatAnnexLabel('PL02')).toBe('Phụ lục 2');
      expect(formatAnnexLabel('PL10')).toBe('Phụ lục 10');
    });

    it('formats with custom title and trims whitespace', () => {
      expect(formatAnnexLabel('PL01', 'Bảng giá & Chi phí ')).toBe('PL01: Bảng giá & Chi phí');
      expect(formatAnnexLabel('PL02', '  SLA Cam kết dịch vụ')).toBe('PL02: SLA Cam kết dịch vụ');
    });

    it('falls back to default label when custom title is only whitespace', () => {
      expect(formatAnnexLabel('PL01', '   ')).toBe('Phụ lục 1');
    });
  });

  describe('buildAnnexStoragePath', () => {
    it('builds standard path under contract versions folder', () => {
      const path = buildAnnexStoragePath('CTR-2610-0001', 2, 'PL01');
      expect(path).toBe('contracts/CTR-2610-0001/versions/v2_PL01.docx');
    });
  });

  describe('computeApprovedFileName', () => {
    it('computes main contract approved file name', () => {
      expect(computeApprovedFileName('CTR-2610-0001', undefined, true)).toBe(
        'CTR-2610-0001_HD_Chinh_approved.docx'
      );
      expect(computeApprovedFileName('CTR-2610-0001')).toBe(
        'CTR-2610-0001_HD_Chinh_approved.docx'
      );
    });

    it('computes annex approved file name with annexId', () => {
      expect(computeApprovedFileName('CTR-2610-0001', 'PL01')).toBe(
        'CTR-2610-0001_PL01_approved.docx'
      );
      expect(computeApprovedFileName('CTR-2610-0001', 'PL02')).toBe(
        'CTR-2610-0001_PL02_approved.docx'
      );
    });
  });

  describe('resolveInheritedAnnexFiles', () => {
    const mockV1Annexes: AnnexFile[] = [
      {
        annexId: 'PL01',
        label: 'Phụ lục 1: Phạm vi SOW',
        originalFileName: 'PL01_SOW.docx',
        storagePath: 'contracts/CTR-001/versions/v1_PL01.docx',
        sourceVersionNo: 1,
        order: 1,
      },
      {
        annexId: 'PL02',
        label: 'Phụ lục 2: Bảng giá SLA',
        originalFileName: 'PL02_Gia.docx',
        storagePath: 'contracts/CTR-001/versions/v1_PL02.docx',
        sourceVersionNo: 1,
        order: 2,
      },
    ];

    it('returns empty array when no annexes exist', () => {
      const result = resolveInheritedAnnexFiles({
        nextVersionNo: 2,
      });
      expect(result).toEqual([]);
    });

    it('preserves all pointers and sourceVersionNo when no files are modified in v2', () => {
      const result = resolveInheritedAnnexFiles({
        previousAnnexFiles: mockV1Annexes,
        nextVersionNo: 2,
      });

      expect(result).toHaveLength(2);
      expect(result[0].annexId).toBe('PL01');
      expect(result[0].sourceVersionNo).toBe(1);
      expect(result[0].storagePath).toBe('contracts/CTR-001/versions/v1_PL01.docx');
      expect(result[1].annexId).toBe('PL02');
      expect(result[1].sourceVersionNo).toBe(1);
      expect(result[1].storagePath).toBe('contracts/CTR-001/versions/v1_PL02.docx');
    });

    it('updates only modified annex and increments its sourceVersionNo while leaving others unchanged', () => {
      const result = resolveInheritedAnnexFiles({
        previousAnnexFiles: mockV1Annexes,
        updatedAnnexMap: {
          PL01: {
            storagePath: 'contracts/CTR-001/versions/v2_PL01.docx',
            originalFileName: 'PL01_SOW_v2_edited.docx',
            label: 'Phụ lục 1: Phạm vi SOW cập nhật',
          },
        },
        nextVersionNo: 2,
      });

      expect(result).toHaveLength(2);
      // PL01 is updated:
      expect(result[0].annexId).toBe('PL01');
      expect(result[0].sourceVersionNo).toBe(2);
      expect(result[0].storagePath).toBe('contracts/CTR-001/versions/v2_PL01.docx');
      expect(result[0].originalFileName).toBe('PL01_SOW_v2_edited.docx');
      expect(result[0].label).toBe('Phụ lục 1: Phạm vi SOW cập nhật');

      // PL02 is unchanged:
      expect(result[1].annexId).toBe('PL02');
      expect(result[1].sourceVersionNo).toBe(1);
      expect(result[1].storagePath).toBe('contracts/CTR-001/versions/v1_PL02.docx');
      expect(result[1].originalFileName).toBe('PL02_Gia.docx');
    });

    it('removes annexes specified in removedAnnexIds and re-indexes order', () => {
      const result = resolveInheritedAnnexFiles({
        previousAnnexFiles: mockV1Annexes,
        removedAnnexIds: ['PL01'],
        nextVersionNo: 2,
      });

      expect(result).toHaveLength(1);
      expect(result[0].annexId).toBe('PL02');
      expect(result[0].order).toBe(1);
      expect(result[0].sourceVersionNo).toBe(1);
    });

    it('appends newly added annex with nextVersionNo as sourceVersionNo', () => {
      const result = resolveInheritedAnnexFiles({
        previousAnnexFiles: mockV1Annexes,
        newAnnexes: [
          {
            annexId: 'PL03',
            label: 'Phụ lục 3: Tiến độ',
            originalFileName: 'Tien_do.docx',
            storagePath: 'contracts/CTR-001/versions/v2_PL03.docx',
          },
        ],
        nextVersionNo: 2,
      });

      expect(result).toHaveLength(3);
      expect(result[2].annexId).toBe('PL03');
      expect(result[2].sourceVersionNo).toBe(2);
      expect(result[2].order).toBe(3);
    });
  });
});
