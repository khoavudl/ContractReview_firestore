import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  executeAIAnalysis,
  formatTasksText,
  formatRiskText,
  cleanHtmlContent,
  extractDocxText,
  fetchBundleContractText,
  resolveVersionBundleFiles,
} from './aiService.js';
import type { GeminiClient } from './aiTypes.js';
import type { ContractDocument } from '../../types/index.js';

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(async () => ({ value: 'Nội dung hợp đồng mẫu', messages: [] })),
    convertToHtml: vi.fn(async () => ({ value: '<p>Nội dung hợp đồng mẫu</p>', messages: [] })),
  },
}));

describe('aiService', () => {
  const mockUser = { uid: 'user-001', role: 'USER' as const, displayName: 'User One' };
  const mockLegal = { uid: 'legal-001', role: 'LEGAL' as const, displayName: 'Legal One' };
  const mockHol = { uid: 'hol-001', role: 'HOL' as const, displayName: 'HOL One' };

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
                if (subCol === 'tasks') {
                  return {
                    orderBy: vi.fn(() => ({
                      get: vi.fn(async () => ({
                        empty: false,
                        docs: [
                          {
                            data: () => ({
                              taskId: 'task-1',
                              order: 1,
                              clauses: 'Điều 8.2',
                              category: 'PENALTY',
                              issueSummary: 'Mức phạt vi phạm quá cao (20%)',
                              legalRecommendation: 'Đàm phán giảm còn 8%',
                              status: 'RESOLVED',
                              userNotes: 'Đối tác đã đồng ý sửa',
                            }),
                          },
                        ],
                      })),
                    })),
                  };
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
    expect(result.analysisId).toBe('SUMMARY');
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

  it('throws PERMISSION_DENIED when HOL attempts AI analysis at PENDING_LEGAL stage', async () => {
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
        mockHol
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

  it('allows HOL to run DECISION_BRIEF analysis at PENDING_HOL with contract tasks', async () => {
    mockContract.status = 'PENDING_HOL';
    const result = await executeAIAnalysis(
      mockDb,
      mockBucket,
      mockGeminiClient,
      {
        contractId: 'CTR-2609-0001',
        analysisType: 'DECISION_BRIEF',
        versionNo: 1,
      },
      mockHol
    );

    expect(result.cached).toBe(false);
    expect(result.analysisId).toBe('DECISION_BRIEF_v1');
    expect(mockGeminiClient.generateAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        userPrompt: expect.stringContaining('--- DANH SÁCH NHIỆM VỤ RÀ SOÁT & ĐÀM PHÁN (TASK LIST) ---'),
      }),
      expect.any(Object)
    );
  });

  it('DECISION_BRIEF auto-generates RISK when absent and injects into prompt', async () => {
    mockContract.status = 'PENDING_HOL';
    mockGeminiClient.generateAnalysis = vi.fn()
      .mockResolvedValueOnce({
        overallRiskLevel: 'HIGH',
        risks: [{ clause: 'Điều 8.2', riskLevel: 'CRITICAL', description: 'Phạt cao', impact: 'Thiệt hại', mitigationWording: 'Sửa' }],
        favorableTerms: [],
        summary: 'Rủi ro cao',
      })
      .mockResolvedValueOnce({
        recommendation: 'APPROVE',
        executiveSummary: 'Duyệt',
        keyRisksRemaining: [],
        negotiationConcessions: [],
        unresolvedIssues: [],
        finalNotes: 'Ghi chú',
      });

    const result = await executeAIAnalysis(
      mockDb,
      mockBucket,
      mockGeminiClient,
      {
        contractId: 'CTR-2609-0001',
        analysisType: 'DECISION_BRIEF',
        versionNo: 1,
      },
      mockHol
    );

    expect(result.cached).toBe(false);
    expect(mockGeminiClient.generateAnalysis).toHaveBeenCalledTimes(2);
    // Call 1: Auto-generated RISK
    expect(mockGeminiClient.generateAnalysis).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ userPrompt: expect.stringContaining('Hãy rà soát toàn bộ hồ sơ hợp đồng') }),
      expect.any(Object)
    );
    // Call 2: DECISION_BRIEF with 3 sources
    expect(mockGeminiClient.generateAnalysis).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        userPrompt: expect.stringContaining('--- KẾT QUẢ ĐÁNH GIÁ RỦI RO (RISK ASSESSMENT) ---'),
      }),
      expect.any(Object)
    );
  });

  it('DECISION_BRIEF reuses existing cached RISK analysis without generating twice', async () => {
    mockContract.status = 'PENDING_HOL';
    const mockExistingRiskDoc = {
      get: vi.fn(async () => ({
        exists: true,
        data: () => ({
          result: {
            overallRiskLevel: 'LOW',
            summary: 'Rủi ro thấp',
            risks: [],
            favorableTerms: [],
          },
        }),
      })),
      set: vi.fn(),
    };

    mockDb.collection = vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(async () => ({ exists: true, data: () => mockContract })),
        collection: vi.fn((subCol: string) => {
          if (subCol === 'ai_analyses') {
            return {
              doc: vi.fn((id: string) => {
                if (id.startsWith('RISK_')) return mockExistingRiskDoc;
                return { get: vi.fn(async () => ({ exists: false })), set: vi.fn() };
              }),
            };
          }
          if (subCol === 'tasks') {
            return { orderBy: vi.fn(() => ({ get: vi.fn(async () => ({ empty: true, docs: [] })) })) };
          }
          if (subCol === 'activities') {
            return { doc: vi.fn(() => ({ set: vi.fn() })) };
          }
          return { doc: vi.fn() };
        }),
      })),
    }));

    mockGeminiClient.generateAnalysis = vi.fn().mockResolvedValue({
      recommendation: 'APPROVE',
      executiveSummary: 'Duyệt',
    });

    const result = await executeAIAnalysis(
      mockDb,
      mockBucket,
      mockGeminiClient,
      {
        contractId: 'CTR-2609-0001',
        analysisType: 'DECISION_BRIEF',
        versionNo: 1,
      },
      mockHol
    );

    expect(result.cached).toBe(false);
    expect(mockGeminiClient.generateAnalysis).toHaveBeenCalledTimes(1);
    expect(mockGeminiClient.generateAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        userPrompt: expect.stringContaining('Mức độ rủi ro tổng thể: LOW'),
      }),
      expect.any(Object)
    );
  });

  describe('formatTasksText', () => {
    it('returns empty message when task list is empty', () => {
      expect(formatTasksText([])).toBe('Không có nhiệm vụ rà soát nào được ghi nhận.');
    });

    it('formats tasks list into structured text block', () => {
      const mockTasks: any[] = [
        {
          order: 1,
          clauses: 'Điều 5.2',
          category: 'COMMERCIAL',
          issueSummary: 'Thời hạn thanh toán quá ngắn',
          legalRecommendation: 'Tăng lên 30 ngày',
          status: 'RESOLVED',
          userNotes: 'Đối tác đã đồng ý 30 ngày',
        },
      ];
      const text = formatTasksText(mockTasks);
      expect(text).toContain('Nhiệm vụ #1 (COMMERCIAL):');
      expect(text).toContain('Điều 5.2');
      expect(text).toContain('RESOLVED (Đã sửa)');
      expect(text).toContain('Đối tác đã đồng ý 30 ngày');
    });
  });

  describe('cleanHtmlContent', () => {
    it('removes empty paragraph and span tags and trims content', () => {
      const html = '<p></p><table><tr><td>Item</td><td>100k</td></tr></table><span>   </span>';
      expect(cleanHtmlContent(html)).toBe('<table><tr><td>Item</td><td>100k</td></tr></table>');
    });

    it('returns empty string when given empty input', () => {
      expect(cleanHtmlContent('')).toBe('');
    });
  });

  describe('formatRiskText with documentRef', () => {
    it('includes documentRef prefix when provided in risk items', () => {
      const mockRisk: any = {
        overallRiskLevel: 'HIGH',
        summary: 'Có rủi ro xung đột',
        risks: [
          {
            clause: 'Điều 3.1',
            documentRef: 'PL01',
            riskLevel: 'HIGH',
            description: 'Đơn giá chưa VAT',
            mitigationWording: 'Bổ sung đã bao gồm VAT',
          },
          {
            clause: 'Điều 8.2',
            documentRef: 'PL02 vs HĐ Chính',
            riskLevel: 'CRITICAL',
            description: 'Phạt không giới hạn mâu thuẫn HĐ chính',
            mitigationWording: 'Áp dụng trần phạt 8%',
          },
        ],
        favorableTerms: [],
      };
      const text = formatRiskText(mockRisk);
      expect(text).toContain('1. [HIGH] [PL01] Điều 3.1: Đơn giá chưa VAT');
      expect(text).toContain('2. [CRITICAL] [PL02 vs HĐ Chính] Điều 8.2: Phạt không giới hạn mâu thuẫn HĐ chính');
    });
  });

  describe('fetchBundleContractText', () => {
    it('formats single document bundle when contract has no annexes', async () => {
      const contractRef: any = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            get: vi.fn(async () => ({ exists: false })),
          })),
        })),
      };
      const contract: any = {
        title: 'HĐ Dịch Vụ',
        currentVersionFile: {
          originalFileName: 'HopDong.docx',
          storagePath: 'contracts/v1.docx',
        },
        annexFiles: [],
      };
      const bucket: any = {
        file: vi.fn(() => ({
          exists: vi.fn(async () => [true]),
          download: vi.fn(async () => [Buffer.from('test')]),
        })),
      };

      const result = await fetchBundleContractText(bucket, contractRef, contract, 1);
      expect(result).toContain('=== [TÀI LIỆU: HỢP ĐỒNG CHÍNH - HopDong.docx] ===');
    });

    it('formats multi-document bundle with numbered headers for main contract and annexes', async () => {
      const contractRef: any = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            get: vi.fn(async () => ({
              exists: true,
              data: () => ({
                fileName: 'HopDongNguyenTac.docx',
                storagePath: 'contracts/v1.docx',
                annexFiles: [
                  { annexId: 'PL01', originalFileName: 'PL01_BangGia.docx', label: 'PL01: Báo giá', storagePath: 'contracts/v1_pl01.docx', order: 1 },
                  { annexId: 'PL02', originalFileName: 'PL02_SLA.docx', label: 'PL02: Cam kết SLA', storagePath: 'contracts/v1_pl02.docx', order: 2 },
                ],
              }),
            })),
          })),
        })),
      };
      const contract: any = {
        title: 'HĐ Nguyên Tắc',
        annexFiles: [],
      };
      const bucket: any = {
        file: vi.fn(() => ({
          exists: vi.fn(async () => [true]),
          download: vi.fn(async () => [Buffer.from('docx-content')]),
        })),
      };

      const result = await fetchBundleContractText(bucket, contractRef, contract, 1);
      expect(result).toContain('=== [TÀI LIỆU 1/3: HỢP ĐỒNG CHÍNH - HopDongNguyenTac.docx] ===');
      expect(result).toContain('=== [TÀI LIỆU 2/3: PHỤ LỤC PL01 - PL01: Báo giá] ===');
      expect(result).toContain('=== [TÀI LIỆU 3/3: PHỤ LỤC PL02 - PL02: Cam kết SLA] ===');
    });
  });

  describe('extractDocxText', () => {
    it('extracts html text from buffer when convertToHtml succeeds', async () => {
      const text = await extractDocxText(Buffer.from('sample-docx'));
      expect(text).toContain('Nội dung hợp đồng mẫu');
    });
  });

  describe('resolveVersionBundleFiles', () => {
    it('sorts annex files by order ascending', async () => {
      const contractRef: any = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            get: vi.fn(async () => ({
              exists: true,
              data: () => ({
                fileName: 'HD.docx',
                annexFiles: [
                  { annexId: 'PL02', originalFileName: 'b.docx', order: 2 },
                  { annexId: 'PL01', originalFileName: 'a.docx', order: 1 },
                ],
              }),
            })),
          })),
        })),
      };
      const contract: any = { title: 'HD' };
      const res = await resolveVersionBundleFiles(contractRef, contract, 1);
      expect(res.sortedAnnexes[0].annexId).toBe('PL01');
      expect(res.sortedAnnexes[1].annexId).toBe('PL02');
    });
  });
});
