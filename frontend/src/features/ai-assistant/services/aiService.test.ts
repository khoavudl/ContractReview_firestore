import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildAnalysisDocId,
  getSampleAnalysisResult,
  fetchCachedAnalysis,
  triggerAIAnalysis,
  SAMPLE_SUMMARY_RESULT,
  SAMPLE_RISK_RESULT,
  SAMPLE_DECISION_BRIEF_RESULT,
} from './aiService';

vi.mock('@/shared', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/shared');
  return {
    ...actual,
    isMockDevEnvironment: vi.fn(() => false),
    getFirebaseDb: vi.fn(),
    getFirebaseFunctions: vi.fn(),
    FEATURE_FLAGS: {
      ENABLE_NOTIFICATIONS: false,
      ENABLE_AI: true,
      ENABLE_EMAIL: false,
    },
  };
});

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, _col, _id, _subCol, subId) => ({ path: `contracts/ctr-01/ai_analyses/${subId}` })),
  getDoc: vi.fn(),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
}));

import { isMockDevEnvironment, FEATURE_FLAGS } from '@/shared';
import { getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

describe('aiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FEATURE_FLAGS.ENABLE_AI = true;
  });

  describe('buildAnalysisDocId', () => {
    it('should generate SUMMARY_v{N} for SUMMARY analysis', () => {
      expect(buildAnalysisDocId('SUMMARY', 1)).toBe('SUMMARY_v1');
      expect(buildAnalysisDocId('SUMMARY', 3)).toBe('SUMMARY_v3');
    });

    it('should generate RISK_v{N}_{ROLE} for RISK analysis', () => {
      expect(buildAnalysisDocId('RISK', 1, 'BUYER')).toBe('RISK_v1_BUYER');
      expect(buildAnalysisDocId('RISK', 2, 'SELLER')).toBe('RISK_v2_SELLER');
      expect(buildAnalysisDocId('RISK', 1)).toBe('RISK_v1_BUYER');
    });

    it('should generate DECISION_BRIEF_v{N} for DECISION_BRIEF analysis', () => {
      expect(buildAnalysisDocId('DECISION_BRIEF', 1)).toBe('DECISION_BRIEF_v1');
      expect(buildAnalysisDocId('DECISION_BRIEF', 2)).toBe('DECISION_BRIEF_v2');
    });
  });

  describe('getSampleAnalysisResult', () => {
    it('should return appropriate sample object matching type', () => {
      expect(getSampleAnalysisResult('SUMMARY')).toEqual(SAMPLE_SUMMARY_RESULT);
      expect(getSampleAnalysisResult('RISK')).toEqual(SAMPLE_RISK_RESULT);
      expect(getSampleAnalysisResult('DECISION_BRIEF')).toEqual(SAMPLE_DECISION_BRIEF_RESULT);
    });
  });

  describe('fetchCachedAnalysis', () => {
    it('should return mock sample document when in mock environment', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(true);

      const res = await fetchCachedAnalysis('CTR-2609-0001', 'SUMMARY', 1);
      expect(res).not.toBeNull();
      expect(res?.analysisId).toBe('SUMMARY_v1');
      expect(res?.result).toEqual(SAMPLE_SUMMARY_RESULT);
    });

    it('should query Firestore and return document if it exists', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(false);

      const mockData = {
        analysisId: 'SUMMARY_v1',
        analysisType: 'SUMMARY',
        versionNo: 1,
        result: SAMPLE_SUMMARY_RESULT,
        analyzedBy: { uid: 'user_1', displayName: 'Legal Pro' },
        createdAt: new Date(),
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockData,
      } as any);

      const res = await fetchCachedAnalysis('CTR-2609-0001', 'SUMMARY', 1);
      expect(res).toEqual(mockData);
    });

    it('should return null if document does not exist in Firestore', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(false);

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
        data: () => undefined,
      } as any);

      const res = await fetchCachedAnalysis('CTR-9999-9999', 'SUMMARY', 1);
      expect(res).toBeNull();
    });

    it('should fallback to dev sample on Firestore error', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(false);
      vi.mocked(getDoc).mockRejectedValueOnce(new Error('Permission denied'));

      const res = await fetchCachedAnalysis('CTR-2609-0001', 'SUMMARY', 1);
      expect(res).not.toBeNull();
      expect(res?.analysisId).toBe('SUMMARY_v1');
    });
  });

  describe('triggerAIAnalysis', () => {
    it('should return mock response in mock environment', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(true);

      const res = await triggerAIAnalysis({
        contractId: 'CTR-2609-0001',
        analysisType: 'SUMMARY',
        versionNo: 1,
      });

      expect(res.cached).toBe(false);
      expect(res.analysisId).toBe('SUMMARY_v1');
      expect(res.result).toEqual(SAMPLE_SUMMARY_RESULT);
    });

    it('should call Cloud Function analyzeContractAI in production mode', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(false);

      const mockCallableReturn = {
        data: {
          cached: false,
          analysisId: 'RISK_v1_BUYER',
          result: SAMPLE_RISK_RESULT,
        },
      };

      const mockFn = vi.fn().mockResolvedValue(mockCallableReturn);
      vi.mocked(httpsCallable).mockReturnValue(mockFn as any);

      const res = await triggerAIAnalysis({
        contractId: 'CTR-2609-0001',
        analysisType: 'RISK',
        versionNo: 1,
        companyRole: 'BUYER',
      });

      expect(httpsCallable).toHaveBeenCalledWith(undefined, 'analyzeContractAI');
      expect(mockFn).toHaveBeenCalledWith({
        contractId: 'CTR-2609-0001',
        analysisType: 'RISK',
        versionNo: 1,
        companyRole: 'BUYER',
      });
      expect(res.analysisId).toBe('RISK_v1_BUYER');
    });

    it('should fallback safely if Cloud Function throws error', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(false);

      const mockFn = vi.fn().mockRejectedValue(new Error('Quota exceeded'));
      vi.mocked(httpsCallable).mockReturnValue(mockFn as any);

      const res = await triggerAIAnalysis({
        contractId: 'CTR-2609-0001',
        analysisType: 'DECISION_BRIEF',
        versionNo: 1,
      });

      expect(res.cached).toBe(false);
      expect(res.analysisId).toBe('DECISION_BRIEF_v1');
      expect(res.result).toEqual(SAMPLE_DECISION_BRIEF_RESULT);
    });

    it('should throw error when FEATURE_FLAGS.ENABLE_AI is false', async () => {
      FEATURE_FLAGS.ENABLE_AI = false;

      await expect(
        triggerAIAnalysis({
          contractId: 'CTR-2609-0001',
          analysisType: 'SUMMARY',
          versionNo: 1,
        })
      ).rejects.toThrow(/tạm tắt|vô hiệu hoá/);
    });
  });

  describe('FEATURE_FLAGS.ENABLE_AI disabled behavior', () => {
    it('fetchCachedAnalysis returns null immediately without querying when ENABLE_AI is false', async () => {
      FEATURE_FLAGS.ENABLE_AI = false;

      const res = await fetchCachedAnalysis('CTR-2609-0001', 'SUMMARY', 1);
      expect(res).toBeNull();
      expect(getDoc).not.toHaveBeenCalled();
    });
  });
});
