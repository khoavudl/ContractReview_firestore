import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeAIAnalysis } from './aiService.js';
import type { GeminiClient } from './aiTypes.js';
import type { ContractDocument } from '../../types/index.js';

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(async () => ({ value: 'Nội dung hợp đồng mẫu', messages: [] })),
  },
}));

describe('aiService', () => {
  const mockUser = { uid: 'user-001', role: 'USER' as const, displayName: 'User One' };
  const mockLegal = { uid: 'legal-001', role: 'LEGAL' as const, displayName: 'Legal One' };

  let mockContract: ContractDocument;
  let mockGeminiClient: GeminiClient;
  let mockDb: any;
  let mockBucket: any;
  let mockAnalysisDoc: any;
  let mockActivityDoc: any;

  beforeEach(() => {
    mockContract = {
      contractId: 'CTR-2609-0001',
      title: 'Hợp đồng mua bán',
      supplier: 'Công ty ABC',
      description: 'Mô tả',
      status: 'DRAFT',
      currentVersion: 1,
      createdBy: {
        uid: 'user-001',
        email: 'user@test.vn',
        displayName: 'User One',
      },
      rejectCount: 0,
      isArchived: false,
      companyRole: 'BUYER',
      currentVersionFile: {
        versionNo: 1,
        originalFileName: 'c.docx',
        storagePath: 'contracts/CTR-2609-0001/versions/v1.docx',
      },
      createdAt: {} as any,
      updatedAt: {} as any,
    };

    mockGeminiClient = {
      generateAnalysis: vi.fn().mockImplementation(async () => ({
        contractType: 'Hợp đồng mua bán',
        parties: { partyA: 'A', partyB: 'B' },
        keyObligations: ['Giao hàng'],
        financialTerms: '100.000.000 VNĐ',
        duration: '1 năm',
        terminationConditions: ['Báo trước 30 ngày'],
        specialClauses: ['Bảo mật'],
      })) as any,
    };

    mockAnalysisDoc = {
      get: vi.fn(async () => ({ exists: false })),
      set: vi.fn(async () => undefined),
    };

    mockActivityDoc = {
      id: 'activity-1',
      set: vi.fn(async () => undefined),
    };

    mockDb = {
      collection: vi.fn((colName: string) => {
        if (colName === 'contracts') {
          return {
            doc: vi.fn((docId: string) => ({
              get: vi.fn(async () => ({
                exists: docId === 'CTR-2609-0001',
                data: () => mockContract,
              })),
              collection: vi.fn((subCol: string) => {
                if (subCol === 'ai_analyses') {
                  return { doc: vi.fn(() => mockAnalysisDoc) };
                }
                if (subCol === 'activities') {
                  return { doc: vi.fn(() => mockActivityDoc) };
                }
                return { doc: vi.fn() };
              }),
            })),
          };
        }
        return { doc: vi.fn() };
      }),
    };

    mockBucket = {
      file: vi.fn(() => ({
        exists: vi.fn(async () => [true]),
        download: vi.fn(async () => [Buffer.from('%PDF-1.4')]),
      })),
    };
  });

  it('generates new AI analysis and stores in Firestore when no cache exists', async () => {
    const result = await executeAIAnalysis(
      mockDb,
      mockBucket,
      mockGeminiClient,
      {
        contractId: 'CTR-2609-0001',
        analysisType: 'SUMMARY',
        versionNo: 1,
      },
      mockUser
    );

    expect(result.cached).toBe(false);
    expect(result.analysisId).toBe('SUMMARY_v1');
    expect(mockGeminiClient.generateAnalysis).toHaveBeenCalled();
    expect(mockAnalysisDoc.set).toHaveBeenCalled();
    expect(mockActivityDoc.set).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'AI_ANALYSIS_COMPLETED' })
    );
  });

  it('returns cached analysis without calling Gemini API when cache is present', async () => {
    mockAnalysisDoc.get.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        analysisId: 'SUMMARY_v1',
        result: { cachedData: true },
      }),
    });

    const result = await executeAIAnalysis(
      mockDb,
      mockBucket,
      mockGeminiClient,
      {
        contractId: 'CTR-2609-0001',
        analysisType: 'SUMMARY',
        versionNo: 1,
      },
      mockUser
    );

    expect(result.cached).toBe(true);
    expect(result.result).toEqual({ cachedData: true });
    expect(mockGeminiClient.generateAnalysis).not.toHaveBeenCalled();
  });

  it('bypasses cache when forceRefresh is true', async () => {
    mockAnalysisDoc.get.mockResolvedValueOnce({
      exists: true,
      data: () => ({ result: { oldData: true } }),
    });

    const result = await executeAIAnalysis(
      mockDb,
      mockBucket,
      mockGeminiClient,
      {
        contractId: 'CTR-2609-0001',
        analysisType: 'SUMMARY',
        versionNo: 1,
        forceRefresh: true,
      },
      mockUser
    );

    expect(result.cached).toBe(false);
    expect(mockGeminiClient.generateAnalysis).toHaveBeenCalled();
  });

  it('throws PERMISSION_DENIED when USER attempts RISK analysis', async () => {
    await expect(
      executeAIAnalysis(
        mockDb,
        mockBucket,
        mockGeminiClient,
        {
          contractId: 'CTR-2609-0001',
          analysisType: 'RISK',
          versionNo: 1,
        },
        mockUser
      )
    ).rejects.toThrow('PERMISSION_DENIED');
  });

  it('allows LEGAL to run RISK analysis at PENDING_LEGAL', async () => {
    mockContract.status = 'PENDING_LEGAL';
    const result = await executeAIAnalysis(
      mockDb,
      mockBucket,
      mockGeminiClient,
      {
        contractId: 'CTR-2609-0001',
        analysisType: 'RISK',
        versionNo: 1,
        companyRole: 'BUYER',
      },
      mockLegal
    );

    expect(result.cached).toBe(false);
    expect(result.analysisId).toBe('RISK_v1_BUYER');
    expect(mockGeminiClient.generateAnalysis).toHaveBeenCalled();
  });

  it('throws PERMISSION_DENIED when USER attempts AI analysis at PENDING_LEGAL stage', async () => {
    mockContract.status = 'PENDING_LEGAL';
    await expect(
      executeAIAnalysis(
        mockDb,
        mockBucket,
        mockGeminiClient,
        {
          contractId: 'CTR-2609-0001',
          analysisType: 'SUMMARY',
          versionNo: 1,
        },
        mockUser
      )
    ).rejects.toThrow('PERMISSION_DENIED');
  });

  it('throws PERMISSION_DENIED when LEGAL attempts AI analysis at DRAFT stage', async () => {
    mockContract.status = 'DRAFT';
    await expect(
      executeAIAnalysis(
        mockDb,
        mockBucket,
        mockGeminiClient,
        {
          contractId: 'CTR-2609-0001',
          analysisType: 'SUMMARY',
          versionNo: 1,
        },
        mockLegal
      )
    ).rejects.toThrow('PERMISSION_DENIED');
  });

  it('throws CONTRACT_NOT_FOUND when contract does not exist', async () => {
    await expect(
      executeAIAnalysis(
        mockDb,
        mockBucket,
        mockGeminiClient,
        {
          contractId: 'NON-EXISTENT',
          analysisType: 'SUMMARY',
          versionNo: 1,
        },
        mockUser
      )
    ).rejects.toThrow('CONTRACT_NOT_FOUND');
  });

  it('throws CONTRACT_APPROVED_AI_LOCKED when attempting new AI analysis on approved contract', async () => {
    mockContract.status = 'HOL_APPROVED';
    await expect(
      executeAIAnalysis(
        mockDb,
        mockBucket,
        mockGeminiClient,
        {
          contractId: 'CTR-2609-0001',
          analysisType: 'SUMMARY',
          versionNo: 1,
        },
        mockUser
      )
    ).rejects.toThrow('CONTRACT_APPROVED_AI_LOCKED');
    expect(mockGeminiClient.generateAnalysis).not.toHaveBeenCalled();
  });

  it('allows reading existing cached AI analysis on approved contract', async () => {
    mockContract.status = 'HOL_APPROVED';
    mockAnalysisDoc.get.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        analysisId: 'SUMMARY_v1',
        result: { cachedData: true },
      }),
    });

    const result = await executeAIAnalysis(
      mockDb,
      mockBucket,
      mockGeminiClient,
      {
        contractId: 'CTR-2609-0001',
        analysisType: 'SUMMARY',
        versionNo: 1,
      },
      mockUser
    );

    expect(result.cached).toBe(true);
    expect(result.result).toEqual({ cachedData: true });
    expect(mockGeminiClient.generateAnalysis).not.toHaveBeenCalled();
  });
});
