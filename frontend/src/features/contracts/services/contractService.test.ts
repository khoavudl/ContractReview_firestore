/**
 * Unit Tests for contractService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setDoc,
  runTransaction,
  onSnapshot,
  where,
  type Firestore,
} from 'firebase/firestore';
import * as shared from '@/shared';
import type { AuthUser } from '@/shared';
import {
  formatContractPeriod,
  formatContractId,
  getNextMockSequence,
  resetMockSequenceForTesting,
  generateContractId,
  calculateMetricCounts,
  filterContracts,
  buildNewContractDoc,
  createContract,
  subscribeContracts,
  DEV_SAMPLE_CONTRACTS,
} from './contractService';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  setDoc: vi.fn(),
  runTransaction: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}));

vi.mock('@/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared')>();
  return {
    ...actual,
    getFirebaseDb: vi.fn(() => ({} as Firestore)),
    isMockDevEnvironment: vi.fn(() => true),
  };
});

describe('contractService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ID generation & formatters', () => {
    it('formats period correctly from date', () => {
      const date = new Date(2026, 8, 30); // Sep 2026
      expect(formatContractPeriod(date)).toBe('2609');
    });

    it('formats contract ID with 4-digit zero-padded sequence', () => {
      expect(formatContractId('2609', 1)).toBe('CTR-2609-0001');
      expect(formatContractId('2609', 42)).toBe('CTR-2609-0042');
      expect(formatContractId('2609', 1234)).toBe('CTR-2609-1234');
    });

    it('generates an ID matching format CTR-YYMM-XXXX', () => {
      const id = generateContractId('2609', 7);
      expect(id).toBe('CTR-2609-0007');
    });

    it('increments mock sequence sequentially', () => {
      resetMockSequenceForTesting(10);
      expect(getNextMockSequence()).toBe(11);
      expect(getNextMockSequence()).toBe(12);
    });
  });

  describe('calculateMetricCounts', () => {
    it('accurately counts contracts across 4 metric groups', () => {
      const counts = calculateMetricCounts(DEV_SAMPLE_CONTRACTS);
      expect(counts.all).toBe(5);
      // DEV_SAMPLE_CONTRACTS: 1 DRAFT, 1 USER_REVISING => 2 draft
      expect(counts.draft).toBe(2);
      // 1 PENDING_LEGAL => 1 legal
      expect(counts.legal).toBe(1);
      // 1 PENDING_HOL => 1 head
      expect(counts.head).toBe(1);
      // 1 HOL_APPROVED => 1 approved
      expect(counts.approved).toBe(1);
    });

    it('returns zeroes for an empty list', () => {
      const counts = calculateMetricCounts([]);
      expect(counts).toEqual({
        all: 0,
        draft: 0,
        legal: 0,
        head: 0,
        approved: 0,
      });
    });
  });

  describe('filterContracts', () => {
    it('returns all contracts when activeGroup is ALL and keyword is empty', () => {
      const filtered = filterContracts(DEV_SAMPLE_CONTRACTS, {
        activeGroup: 'ALL',
        searchKeyword: '',
      });
      expect(filtered.length).toBe(5);
    });

    it('filters by activeGroup: draft', () => {
      const filtered = filterContracts(DEV_SAMPLE_CONTRACTS, {
        activeGroup: 'draft',
        searchKeyword: '',
      });
      expect(filtered.length).toBe(2);
      filtered.forEach((c) => {
        expect(['DRAFT', 'USER_REVISING']).toContain(c.status);
      });
    });

    it('filters by search keyword matching contractId', () => {
      const filtered = filterContracts(DEV_SAMPLE_CONTRACTS, {
        activeGroup: 'ALL',
        searchKeyword: '2609-0002',
      });
      expect(filtered.length).toBe(1);
      expect(filtered[0].contractId).toBe('CTR-2609-0002');
    });

    it('filters by search keyword matching supplier', () => {
      const filtered = filterContracts(DEV_SAMPLE_CONTRACTS, {
        activeGroup: 'ALL',
        searchKeyword: 'buhler',
      });
      expect(filtered.length).toBe(1);
      expect(filtered[0].contractId).toBe('CTR-2609-0004');
    });

    it('combines activeGroup and searchKeyword', () => {
      const filtered = filterContracts(DEV_SAMPLE_CONTRACTS, {
        activeGroup: 'draft',
        searchKeyword: 'màng nhôm',
      });
      expect(filtered.length).toBe(1);
      expect(filtered[0].contractId).toBe('CTR-2609-0001');
    });
  });

  describe('buildNewContractDoc & createContract', () => {
    const mockUser: AuthUser = {
      uid: 'u-1',
      email: 'user@foodempire.vn',
      displayName: 'Tin Doan',
      role: 'USER',
      isActive: true,
      department: 'Marketing',
    };

    it('builds a new contract document in DRAFT status', () => {
      const doc = buildNewContractDoc(
        mockUser,
        {
          title: 'Hợp đồng mua hạt macca',
          supplier: 'Công ty Hạt Vàng',
          description: 'Hợp đồng thử nghiệm',
          companyRole: 'BUYER',
        },
        'CTR-2609-9999'
      );

      expect(doc.contractId).toBe('CTR-2609-9999');
      expect(doc.status).toBe('DRAFT');
      expect(doc.currentVersion).toBe(1);
      expect(doc.createdBy.uid).toBe('u-1');
      expect(doc.title).toBe('Hợp đồng mua hạt macca');
    });

    it('sets currentVersionFile with file name and storagePath when file is provided', () => {
      const mockFile = new File(['content'], 'Hop_dong_v1.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const doc = buildNewContractDoc(
        mockUser,
        {
          title: 'Hợp đồng mua hạt macca',
          supplier: 'Công ty Hạt Vàng',
          description: 'Hợp đồng thử nghiệm',
          file: mockFile,
        },
        'CTR-2609-0001'
      );
      expect(doc.currentVersionFile.originalFileName).toBe('CTR-2609-0001_v1.docx');
      expect(doc.currentVersionFile.storagePath).toBe('contracts/CTR-2609-0001/versions/v1.docx');
      expect(doc.currentVersionFile.versionNo).toBe(1);
    });

    it('creates a new contract sequentially in mock dev mode', async () => {
      const mockDb = {} as Firestore;
      vi.mocked(shared.isMockDevEnvironment).mockReturnValue(true);
      resetMockSequenceForTesting(5);
      vi.mocked(setDoc).mockResolvedValueOnce(undefined);

      const contractId = await createContract(
        mockUser,
        {
          title: 'Hợp đồng in ấn',
          supplier: 'In Phúc Long',
          description: 'In ấn tem nhãn',
        },
        mockDb
      );

      expect(contractId).toMatch(/^CTR-\d{4}-0006$/);
      expect(setDoc).toHaveBeenCalledTimes(1);
    });

    it('creates a new contract atomically via runTransaction in production mode', async () => {
      const mockDb = {} as Firestore;
      vi.mocked(shared.isMockDevEnvironment).mockReturnValue(false);

      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ lastSeq: 41, period: '2609' }),
        }),
        set: vi.fn(),
      };

      vi.mocked(runTransaction).mockImplementation(async (_db, callback) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return callback(mockTransaction as any);
      });

      const contractId = await createContract(
        mockUser,
        {
          title: 'Hợp đồng vận chuyển nguyên vật liệu',
          supplier: 'Vận Tải Phương Nam',
          description: 'Vận chuyển 20 tấn cà phê',
        },
        mockDb
      );

      expect(contractId).toMatch(/^CTR-\d{4}-0042$/);
      expect(mockTransaction.get).toHaveBeenCalledTimes(1);
      expect(mockTransaction.set).toHaveBeenCalledTimes(2); // counter + contract doc
    });
  });

  describe('subscribeContracts', () => {
    const mockDb = {} as Firestore;

    it('creates user-filtered query for USER role', () => {
      const user: AuthUser = {
        uid: 'user-sales',
        email: 'sales@foodempire.vn',
        displayName: 'Sales',
        role: 'USER',
        isActive: true,
      };

      subscribeContracts(user, vi.fn(), undefined, mockDb);

      expect(where).toHaveBeenCalledWith('createdBy.uid', '==', 'user-sales');
      expect(where).toHaveBeenCalledWith('isArchived', '==', false);
      expect(onSnapshot).toHaveBeenCalledTimes(1);
    });

    it('does not filter by user for LEGAL role', () => {
      const legalUser: AuthUser = {
        uid: 'legal-1',
        email: 'legal@foodempire.vn',
        displayName: 'Legal Staff',
        role: 'LEGAL',
        isActive: true,
      };

      subscribeContracts(legalUser, vi.fn(), undefined, mockDb);

      expect(where).not.toHaveBeenCalledWith('createdBy.uid', '==', 'legal-1');
      expect(where).toHaveBeenCalledWith('isArchived', '==', false);
      expect(onSnapshot).toHaveBeenCalledTimes(1);
    });
  });
});
