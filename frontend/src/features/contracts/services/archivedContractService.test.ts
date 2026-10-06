import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeSearchText,
  filterArchivedContracts,
  fetchArchivedContracts,
  resetArchivedCacheForTesting,
  mergeAndDeduplicateArchived,
} from './archivedContractService';
import type { ContractDocument, AuthUser } from '@/shared';

const mockContracts: ContractDocument[] = [
  {
    contractId: 'CTR-2609-0001',
    title: 'Hợp đồng mua bao bì màng nhôm vụ mùa 2026',
    supplier: 'Công ty Cổ phần Bao Bì Toàn Cầu',
    description: 'Cung cấp màng phức hợp nhôm đóng gói sản phẩm MacCoffee.',
    status: 'HOL_APPROVED',
    companyRole: 'BUYER',
    currentVersion: 2,
    currentVersionFile: { versionNo: 2, originalFileName: 'v2.docx', storagePath: '' },
    rejectCount: 1,
    isArchived: true,
    createdBy: { uid: 'user_sales_01', email: 'sales@fev.com', displayName: 'Nguyễn Văn Phụ Trách' },
    createdAt: new Date('2026-09-01'),
    updatedAt: new Date('2026-09-20'),
  },
  {
    contractId: 'CTR-2609-0004',
    title: 'Hợp đồng gia công rang xay cà phê hòa tan',
    supplier: 'Nhà máy Chế biến Nông sản Tây Nguyên',
    description: 'Gia công hạt cà phê Robusta chuẩn xuất khẩu',
    status: 'COMPLETED',
    companyRole: 'BUYER',
    currentVersion: 1,
    currentVersionFile: { versionNo: 1, originalFileName: 'v1.docx', storagePath: '' },
    rejectCount: 0,
    isArchived: true,
    createdBy: { uid: 'user_other', email: 'other@fev.com', displayName: 'Trần Văn Khác' },
    createdAt: new Date('2026-09-10'),
    updatedAt: new Date('2026-09-25'),
  },
];

describe('archivedContractService', () => {
  beforeEach(() => {
    resetArchivedCacheForTesting();
  });

  describe('normalizeSearchText', () => {
    it('normalizes accented Vietnamese words to lowercase without diacritics', () => {
      expect(normalizeSearchText('Hợp Đồng')).toBe('hop dong');
      expect(normalizeSearchText('Đà Nẵng')).toBe('da nang');
      expect(normalizeSearchText('Bao Bì Toàn Cầu')).toBe('bao bi toan cau');
    });

    it('handles empty strings and whitespace safely', () => {
      expect(normalizeSearchText('')).toBe('');
      expect(normalizeSearchText('   ')).toBe('');
    });
  });

  describe('filterArchivedContracts', () => {
    it('returns all contracts when keyword is empty', () => {
      const results = filterArchivedContracts(mockContracts, '');
      expect(results).toHaveLength(2);
    });

    it('filters by contractId', () => {
      const results = filterArchivedContracts(mockContracts, '0001');
      expect(results).toHaveLength(1);
      expect(results[0].contractId).toBe('CTR-2609-0001');
    });

    it('filters by title with unaccented keyword', () => {
      const results = filterArchivedContracts(mockContracts, 'bao bi mang nhom');
      expect(results).toHaveLength(1);
      expect(results[0].contractId).toBe('CTR-2609-0001');
    });

    it('filters by supplier name', () => {
      const results = filterArchivedContracts(mockContracts, 'tay nguyen');
      expect(results).toHaveLength(1);
      expect(results[0].contractId).toBe('CTR-2609-0004');
    });

    it('returns empty array when keyword does not match anything', () => {
      const results = filterArchivedContracts(mockContracts, 'khong co gi');
      expect(results).toHaveLength(0);
    });
  });

  describe('fetchArchivedContracts', () => {
    it('fetches archived contracts in mock dev environment', async () => {
      const legalUser: AuthUser = {
        uid: 'legal_01',
        email: 'legal@fev.com',
        displayName: 'Pháp Chế',
        role: 'LEGAL',
        isActive: true,
      };

      const results = await fetchArchivedContracts(legalUser, 10);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('caches results in memory and reuses them without re-querying', async () => {
      const legalUser: AuthUser = {
        uid: 'legal_01',
        email: 'legal@fev.com',
        displayName: 'Pháp Chế',
        role: 'LEGAL',
        isActive: true,
      };

      const firstCall = await fetchArchivedContracts(legalUser);
      const secondCall = await fetchArchivedContracts(legalUser);
      expect(firstCall).toEqual(secondCall);
    });

    it('filters by user id when role is USER', async () => {
      const regularUser: AuthUser = {
        uid: 'user_sales_01',
        email: 'user.sales@foodempire.vn',
        displayName: 'Nguyễn Văn Phụ Trách',
        role: 'USER',
        isActive: true,
      };

      const results = await fetchArchivedContracts(regularUser);
      expect(results.every((c) => c.createdBy.uid === 'user_sales_01')).toBe(true);
    });

    it('supports pagination with lastTimestamp', async () => {
      const legalUser: AuthUser = {
        uid: 'legal_01',
        email: 'legal@fev.com',
        displayName: 'Pháp Chế',
        role: 'LEGAL',
        isActive: true,
      };

      const page1 = await fetchArchivedContracts(legalUser, 1);
      expect(page1.length).toBe(1);

      const page2 = await fetchArchivedContracts(legalUser, 1, page1[0].updatedAt as Date);
      expect(page2.length).toBe(1);
      expect(page2[0].contractId).not.toBe(page1[0].contractId);
    });
  });

  describe('mergeAndDeduplicateArchived', () => {
    it('merges two lists, deduplicates identical contractId, and sorts descending by updatedAt', () => {
      const docA: ContractDocument = {
        ...mockContracts[0],
        contractId: 'CTR-A',
        updatedAt: new Date('2026-09-10'),
      };
      const docB: ContractDocument = {
        ...mockContracts[0],
        contractId: 'CTR-B',
        updatedAt: new Date('2026-09-20'),
      };
      const docADup: ContractDocument = {
        ...mockContracts[0],
        contractId: 'CTR-A',
        updatedAt: new Date('2026-09-15'),
      };

      const result = mergeAndDeduplicateArchived([docA], [docB, docADup], 10);
      expect(result).toHaveLength(2);
      expect(result[0].contractId).toBe('CTR-B');
      expect(result[1].contractId).toBe('CTR-A');
    });

    it('respects limitCount', () => {
      const docA: ContractDocument = { ...mockContracts[0], contractId: 'CTR-A' };
      const docB: ContractDocument = { ...mockContracts[0], contractId: 'CTR-B' };
      const result = mergeAndDeduplicateArchived([docA], [docB], 1);
      expect(result).toHaveLength(1);
    });
  });
});
