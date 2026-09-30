import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeContractTransition } from './contractTransitionService.js';
import type { ContractDocument } from '../../types/index.js';
import type { TransitionUserContext } from './statusStateMachine.js';

describe('contractTransitionService', () => {
  const mockUser: TransitionUserContext = {
    uid: 'user-001',
    role: 'USER',
    displayName: 'Nguyễn Văn User',
    email: 'user@test.vn',
  };

  const mockLegal: TransitionUserContext = {
    uid: 'legal-001',
    role: 'LEGAL',
    displayName: 'Trần Thị Legal',
    email: 'legal@test.vn',
  };

  const mockHol: TransitionUserContext = {
    uid: 'hol-001',
    role: 'HOL',
    displayName: 'Lê Văn HOL',
    email: 'hol@test.vn',
  };

  let mockContract: ContractDocument;
  let mockTransaction: {
    get: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
  };
  let mockDb: any;

  beforeEach(() => {
    mockContract = {
      contractId: 'CTR-2609-0001',
      title: 'Hợp đồng mua bán thiết bị văn phòng',
      supplier: 'Công ty Cổ phần Công nghệ ABC',
      description: 'Cung cấp thiết bị',
      status: 'DRAFT',
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

    mockTransaction = {
      get: vi.fn().mockImplementation(async (ref: any) => ({
        exists: ref.id === 'CTR-2609-0001',
        data: () => mockContract,
      })),
      update: vi.fn(),
      set: vi.fn(),
    };

    const createDocMock = (id = 'mock-id') => ({
      id,
      collection: vi.fn(() => ({
        doc: vi.fn(() => createDocMock('mock-sub-id')),
      })),
    });

    mockDb = {
      collection: vi.fn((colName: string) => {
        if (colName === 'users') {
          return {
            where: vi.fn((field: string, _op: string, val: any) => ({
              where: vi.fn(() => ({
                get: vi.fn(async () => {
                  if (field === 'role' && val === 'LEGAL') {
                    return { docs: [{ id: 'legal-001' }] };
                  }
                  if (field === 'role' && val === 'HOL') {
                    return { docs: [{ id: 'hol-001' }] };
                  }
                  return { docs: [] };
                }),
              })),
            })),
          };
        }
        return {
          doc: vi.fn((docId: string) => ({
            id: docId,
            collection: vi.fn((_subCol: string) => ({
              doc: vi.fn(() => createDocMock('mock-sub-id')),
            })),
          })),
        };
      }),
      runTransaction: vi.fn(async (cb: (tx: any) => Promise<any>) => cb(mockTransaction)),
    };
  });

  it('successfully transitions from DRAFT to PENDING_LEGAL and notifies LEGAL staff', async () => {
    const result = await executeContractTransition(
      mockDb,
      { contractId: 'CTR-2609-0001', targetStatus: 'PENDING_LEGAL' },
      mockUser
    );

    expect(result.success).toBe(true);
    expect(result.previousStatus).toBe('DRAFT');
    expect(result.newStatus).toBe('PENDING_LEGAL');
    expect(mockTransaction.update).toHaveBeenCalled();
    expect(mockTransaction.set).toHaveBeenCalledTimes(2); // 1 Activity + 1 Notification for Legal staff
  });

  it('queues notification for Legal staff when USER resubmits from USER_REVISING', async () => {
    mockContract.status = 'USER_REVISING';

    const result = await executeContractTransition(
      mockDb,
      { contractId: 'CTR-2609-0001', targetStatus: 'PENDING_LEGAL' },
      mockUser
    );

    expect(result.success).toBe(true);
    expect(result.newStatus).toBe('PENDING_LEGAL');
    expect(mockTransaction.set).toHaveBeenCalledTimes(2); // 1 Activity + 1 Notification for Legal staff
  });

  it('queues notification for HOL when LEGAL approves to PENDING_HOL', async () => {
    mockContract.status = 'LEGAL_APPROVED';

    const result = await executeContractTransition(
      mockDb,
      { contractId: 'CTR-2609-0001', targetStatus: 'PENDING_HOL' },
      mockLegal
    );

    expect(result.success).toBe(true);
    expect(result.newStatus).toBe('PENDING_HOL');
    expect(mockTransaction.set).toHaveBeenCalledTimes(2); // 1 Activity + 1 Notification for HOL
  });

  it('queues notification for User when LEGAL comments on PENDING_LEGAL', async () => {
    mockContract.status = 'PENDING_LEGAL';

    const result = await executeContractTransition(
      mockDb,
      {
        contractId: 'CTR-2609-0001',
        targetStatus: 'LEGAL_COMMENTED',
        payload: { changeSummary: 'Cần sửa điều 4 và điều 7' },
      },
      mockLegal
    );

    expect(result.success).toBe(true);
    expect(result.newStatus).toBe('LEGAL_COMMENTED');
    expect(mockTransaction.set).toHaveBeenCalledTimes(2); // 1 Activity + 1 Notification for User
  });

  it('queues notification for User when HOL comments or returns with rejectReason on PENDING_HOL', async () => {
    mockContract.status = 'PENDING_HOL';

    const result = await executeContractTransition(
      mockDb,
      {
        contractId: 'CTR-2609-0001',
        targetStatus: 'HOL_COMMENTED',
        payload: { rejectReason: 'Nhà cung cấp không đạt tiêu chuẩn năng lực' },
      },
      mockHol
    );

    expect(result.success).toBe(true);
    expect(result.newStatus).toBe('HOL_COMMENTED');
    expect(mockTransaction.set).toHaveBeenCalledTimes(2); // 1 Activity + 1 Notification for User
  });

  it('throws CONTRACT_NOT_FOUND when contract does not exist', async () => {
    await expect(
      executeContractTransition(
        mockDb,
        { contractId: 'NON-EXISTENT', targetStatus: 'PENDING_LEGAL' },
        mockUser
      )
    ).rejects.toThrow('CONTRACT_NOT_FOUND');
  });

  it('throws TRANSITION_DENIED when rule is violated (USER approving contract)', async () => {
    mockContract.status = 'PENDING_LEGAL';

    await expect(
      executeContractTransition(
        mockDb,
        { contractId: 'CTR-2609-0001', targetStatus: 'LEGAL_APPROVED' },
        mockUser
      )
    ).rejects.toThrow('TRANSITION_DENIED');
  });
});
