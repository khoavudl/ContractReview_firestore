import type * as admin from 'firebase-admin';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateDeletionEligibility,
  executeContractDeletion,
  type DeletionUserContext,
} from './contractDeletionService.js';
import type { ContractDocument } from '../../types/index.js';

type TestBucket = ReturnType<admin.storage.Storage['bucket']>;

describe('contractDeletionService', () => {
  const ownerUser: DeletionUserContext = {
    uid: 'user-001',
    role: 'USER',
    displayName: 'Nguyễn Văn A',
    email: 'user-a@test.vn',
  };

  const otherUser: DeletionUserContext = {
    uid: 'user-999',
    role: 'USER',
    displayName: 'Người Dùng Khác',
    email: 'other@test.vn',
  };

  const legalUser: DeletionUserContext = {
    uid: 'legal-001',
    role: 'LEGAL',
    displayName: 'Pháp Chế Viên',
    email: 'legal@test.vn',
  };

  let mockContract: ContractDocument;

  beforeEach(() => {
    mockContract = {
      contractId: 'CTR-2609-0001',
      title: 'Hợp đồng mua bao bì màng nhôm',
      supplier: 'Bao Bì Toàn Cầu',
      description: 'Hợp đồng nguyên tắc',
      status: 'DRAFT',
      currentVersion: 1,
      createdBy: {
        uid: 'user-001',
        email: 'user-a@test.vn',
        displayName: 'Nguyễn Văn A',
      },
      rejectCount: 0,
      isArchived: false,
      companyRole: 'BUYER',
      currentVersionFile: {
        versionNo: 1,
        originalFileName: 'CTR-2609-0001_v1.docx',
        storagePath: 'contracts/CTR-2609-0001/versions/v1.docx',
      },
      createdAt: { seconds: 1700000000, nanoseconds: 0 } as unknown as FirebaseFirestore.Timestamp,
      updatedAt: { seconds: 1700000000, nanoseconds: 0 } as unknown as FirebaseFirestore.Timestamp,
    };
  });

  describe('validateDeletionEligibility', () => {
    it('allows owner to delete when contract is in DRAFT', () => {
      mockContract.status = 'DRAFT';
      expect(() => validateDeletionEligibility(mockContract, ownerUser)).not.toThrow();
    });

    it('allows owner to delete when contract is in USER_REVISING', () => {
      mockContract.status = 'USER_REVISING';
      expect(() => validateDeletionEligibility(mockContract, ownerUser)).not.toThrow();
    });

    it('throws PERMISSION_DENIED when caller is not the owner', () => {
      expect(() => validateDeletionEligibility(mockContract, otherUser)).toThrow('PERMISSION_DENIED');
      expect(() => validateDeletionEligibility(mockContract, legalUser)).toThrow('PERMISSION_DENIED');
    });

    it('throws DELETION_DENIED when contract is in PENDING_LEGAL', () => {
      mockContract.status = 'PENDING_LEGAL';
      expect(() => validateDeletionEligibility(mockContract, ownerUser)).toThrow('DELETION_DENIED');
    });

    it('throws DELETION_DENIED when contract is in PENDING_HOL', () => {
      mockContract.status = 'PENDING_HOL';
      expect(() => validateDeletionEligibility(mockContract, ownerUser)).toThrow('DELETION_DENIED');
    });

    it('throws DELETION_DENIED when contract is in HOL_APPROVED', () => {
      mockContract.status = 'HOL_APPROVED';
      expect(() => validateDeletionEligibility(mockContract, ownerUser)).toThrow('DELETION_DENIED');
    });
  });

  describe('executeContractDeletion', () => {
    let mockBucket: { deleteFiles: ReturnType<typeof vi.fn> };
    let mockContractRef: {
      get: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      collection: ReturnType<typeof vi.fn>;
    };
    let mockDb: {
      collection: ReturnType<typeof vi.fn>;
      recursiveDelete?: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockBucket = {
        deleteFiles: vi.fn().mockResolvedValue(undefined),
      };

      mockContractRef = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => mockContract,
        }),
        delete: vi.fn().mockResolvedValue(undefined),
        collection: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: [{ ref: { delete: vi.fn().mockResolvedValue(undefined) } }],
          }),
        }),
      };

      mockDb = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue(mockContractRef),
        }),
        recursiveDelete: vi.fn().mockResolvedValue(undefined),
      };
    });

    it('successfully deletes storage files and invokes db.recursiveDelete', async () => {
      const result = await executeContractDeletion(
        mockDb as unknown as FirebaseFirestore.Firestore,
        mockBucket as unknown as TestBucket,
        'CTR-2609-0001',
        ownerUser
      );

      expect(result.success).toBe(true);
      expect(result.contractId).toBe('CTR-2609-0001');
      expect(mockBucket.deleteFiles).toHaveBeenCalledWith({
        prefix: 'contracts/CTR-2609-0001/',
      });
      expect(mockDb.recursiveDelete).toHaveBeenCalledWith(mockContractRef);
    });

    it('falls back to manual subcollection deletion when recursiveDelete is not available', async () => {
      delete mockDb.recursiveDelete;

      const result = await executeContractDeletion(
        mockDb as unknown as FirebaseFirestore.Firestore,
        mockBucket as unknown as TestBucket,
        'CTR-2609-0001',
        ownerUser
      );

      expect(result.success).toBe(true);
      expect(mockContractRef.collection).toHaveBeenCalled();
      expect(mockContractRef.delete).toHaveBeenCalled();
    });

    it('throws CONTRACT_NOT_FOUND if contract doc does not exist', async () => {
      mockContractRef.get.mockResolvedValueOnce({
        exists: false,
        data: () => undefined,
      });

      await expect(
        executeContractDeletion(
          mockDb as unknown as FirebaseFirestore.Firestore,
          mockBucket as unknown as TestBucket,
          'CTR-NON-EXISTENT',
          ownerUser
        )
      ).rejects.toThrow('CONTRACT_NOT_FOUND');
    });

    it('tolerates storage errors gracefully and continues deleting firestore data', async () => {
      mockBucket.deleteFiles.mockRejectedValueOnce(new Error('Storage bucket unavailable'));

      const result = await executeContractDeletion(
        mockDb as unknown as FirebaseFirestore.Firestore,
        mockBucket as unknown as TestBucket,
        'CTR-2609-0001',
        ownerUser
      );

      expect(result.success).toBe(true);
      expect(mockDb.recursiveDelete).toHaveBeenCalledWith(mockContractRef);
    });
  });
});
