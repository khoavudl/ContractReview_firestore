import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateDocumentSignedUrl } from './documentUrlService.js';
import type { ContractDocument } from '../../types/index.js';

describe('documentUrlService', () => {
  const ownerUser = { uid: 'user-001', role: 'USER' as const };
  const otherUser = { uid: 'user-002', role: 'USER' as const };
  const legalUser = { uid: 'legal-001', role: 'LEGAL' as const };

  let mockContract: ContractDocument;
  let mockDb: any;
  let mockBucket: any;
  let mockFile: any;

  beforeEach(() => {
    mockContract = {
      contractId: 'CTR-2609-0001',
      title: 'Hợp đồng mua bán hàng hóa',
      supplier: 'Nhà cung cấp ABC',
      description: 'Mô tả',
      status: 'PENDING_LEGAL',
      currentVersion: 1,
      createdBy: {
        uid: 'user-001',
        email: 'user@test.vn',
        displayName: 'Nguyễn Văn User',
      },
      rejectCount: 0,
      isArchived: false,
      companyRole: 'BUYER',
      currentVersionFile: {
        versionNo: 1,
        originalFileName: 'contract.docx',
        storagePath: 'contracts/CTR-2609-0001/versions/v1.docx',
        previewPdfPath: 'contracts/CTR-2609-0001/previews/v1.pdf',
      },
      createdAt: { seconds: 1700000000, nanoseconds: 0 } as any,
      updatedAt: { seconds: 1700000000, nanoseconds: 0 } as any,
    };

    mockDb = {
      collection: vi.fn(() => ({
        doc: vi.fn((docId: string) => ({
          get: vi.fn(async () => ({
            exists: docId === 'CTR-2609-0001',
            data: () => mockContract,
          })),
        })),
      })),
    };

    mockFile = {
      exists: vi.fn(async () => [true]),
      getSignedUrl: vi.fn(async () => ['https://storage.googleapis.com/signed-url-mock']),
    };

    mockBucket = {
      file: vi.fn(() => mockFile),
    };
  });

  it('generates a signed URL successfully for contract owner USER', async () => {
    const result = await generateDocumentSignedUrl(
      mockDb,
      mockBucket,
      {
        contractId: 'CTR-2609-0001',
        storagePath: 'contracts/CTR-2609-0001/versions/v1.docx',
      },
      ownerUser
    );

    expect(result.signedUrl).toBe('https://storage.googleapis.com/signed-url-mock');
    expect(result.expiresAt).toBeDefined();
    expect(mockFile.getSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 'v4',
        action: 'read',
      })
    );
  });

  it('generates a signed URL successfully for LEGAL staff on any contract', async () => {
    const result = await generateDocumentSignedUrl(
      mockDb,
      mockBucket,
      {
        contractId: 'CTR-2609-0001',
        storagePath: 'contracts/CTR-2609-0001/previews/v1.pdf',
      },
      legalUser
    );

    expect(result.signedUrl).toBe('https://storage.googleapis.com/signed-url-mock');
  });

  it('throws INVALID_ARGUMENT when contractId or storagePath is missing', async () => {
    await expect(
      generateDocumentSignedUrl(mockDb, mockBucket, { contractId: '', storagePath: '' }, ownerUser)
    ).rejects.toThrow('INVALID_ARGUMENT');
  });

  it('throws INVALID_PATH when storagePath does not match contractId', async () => {
    await expect(
      generateDocumentSignedUrl(
        mockDb,
        mockBucket,
        {
          contractId: 'CTR-2609-0001',
          storagePath: 'contracts/CTR-DIFF-9999/versions/v1.docx',
        },
        ownerUser
      )
    ).rejects.toThrow('INVALID_PATH');
  });

  it('throws CONTRACT_NOT_FOUND when contract does not exist in Firestore', async () => {
    await expect(
      generateDocumentSignedUrl(
        mockDb,
        mockBucket,
        {
          contractId: 'NON-EXISTENT',
          storagePath: 'contracts/NON-EXISTENT/versions/v1.docx',
        },
        ownerUser
      )
    ).rejects.toThrow('CONTRACT_NOT_FOUND');
  });

  it('throws PERMISSION_DENIED when a non-owner USER tries to access the file', async () => {
    await expect(
      generateDocumentSignedUrl(
        mockDb,
        mockBucket,
        {
          contractId: 'CTR-2609-0001',
          storagePath: 'contracts/CTR-2609-0001/versions/v1.docx',
        },
        otherUser
      )
    ).rejects.toThrow('PERMISSION_DENIED');
  });

  it('throws FILE_NOT_FOUND when the file does not exist in GCS bucket', async () => {
    mockFile.exists.mockResolvedValueOnce([false]);

    await expect(
      generateDocumentSignedUrl(
        mockDb,
        mockBucket,
        {
          contractId: 'CTR-2609-0001',
          storagePath: 'contracts/CTR-2609-0001/versions/v1.docx',
        },
        ownerUser
      )
    ).rejects.toThrow('FILE_NOT_FOUND');
  });
});
