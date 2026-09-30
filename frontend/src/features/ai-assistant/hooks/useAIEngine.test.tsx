import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAIEngine } from './useAIEngine';
import {
  SAMPLE_SUMMARY_RESULT,
} from '../services/aiService';

vi.mock('../services/aiService', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../services/aiService');
  return {
    ...actual,
    fetchCachedAnalysis: vi.fn(),
    triggerAIAnalysis: vi.fn(),
  };
});

import { fetchCachedAnalysis, triggerAIAnalysis } from '../services/aiService';

describe('useAIEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchCachedAnalysis).mockResolvedValue({
      analysisId: 'SUMMARY_v1',
      analysisType: 'SUMMARY',
      versionNo: 1,
      result: SAMPLE_SUMMARY_RESULT,
      analyzedBy: { uid: 'ai', displayName: 'AI' },
      createdAt: new Date(),
    });
    vi.mocked(triggerAIAnalysis).mockResolvedValue({
      cached: false,
      analysisId: 'SUMMARY_v1',
      result: SAMPLE_SUMMARY_RESULT,
    });
  });

  describe('RBAC tab access control', () => {
    it('USER role should only have access to SUMMARY tab', async () => {
      const { result } = renderHook(() =>
        useAIEngine({
          contractId: 'CTR-2609-0001',
          versionNo: 1,
          userRole: 'USER',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.allowedTabs.map((t) => t.id)).toEqual(['SUMMARY']);
      expect(result.current.canAccessTab('SUMMARY')).toBe(true);
      expect(result.current.canAccessTab('RISK')).toBe(false);
      expect(result.current.canAccessTab('DECISION_BRIEF')).toBe(false);

      // Attempt switching to RISK should be blocked
      act(() => {
        result.current.setActiveTab('RISK');
      });
      expect(result.current.activeTab).toBe('SUMMARY');
    });

    it('LEGAL role should have access to SUMMARY and RISK tabs', async () => {
      const { result } = renderHook(() =>
        useAIEngine({
          contractId: 'CTR-2609-0001',
          versionNo: 1,
          userRole: 'LEGAL',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.allowedTabs.map((t) => t.id)).toEqual(['SUMMARY', 'RISK']);
      expect(result.current.canAccessTab('SUMMARY')).toBe(true);
      expect(result.current.canAccessTab('RISK')).toBe(true);
      expect(result.current.canAccessTab('DECISION_BRIEF')).toBe(false);

      // Can switch to RISK
      act(() => {
        result.current.setActiveTab('RISK');
      });
      expect(result.current.activeTab).toBe('RISK');

      // Cannot switch to DECISION_BRIEF
      act(() => {
        result.current.setActiveTab('DECISION_BRIEF');
      });
      expect(result.current.activeTab).toBe('RISK');
    });

    it('HOL role should have access to all 3 tabs', async () => {
      const { result } = renderHook(() =>
        useAIEngine({
          contractId: 'CTR-2609-0001',
          versionNo: 1,
          userRole: 'HOL',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.allowedTabs.map((t) => t.id)).toEqual([
        'SUMMARY',
        'RISK',
        'DECISION_BRIEF',
      ]);
      expect(result.current.canAccessTab('SUMMARY')).toBe(true);
      expect(result.current.canAccessTab('RISK')).toBe(true);
      expect(result.current.canAccessTab('DECISION_BRIEF')).toBe(true);

      // Can switch to DECISION_BRIEF
      act(() => {
        result.current.setActiveTab('DECISION_BRIEF');
      });
      expect(result.current.activeTab).toBe('DECISION_BRIEF');
    });
  });

  describe('Data loading and caching', () => {
    it('should automatically load cached summary on mount', async () => {
      vi.mocked(fetchCachedAnalysis).mockResolvedValueOnce({
        analysisId: 'SUMMARY_v1',
        analysisType: 'SUMMARY',
        versionNo: 1,
        result: SAMPLE_SUMMARY_RESULT,
        analyzedBy: { uid: 'ai', displayName: 'AI' },
        createdAt: new Date(),
      });

      const { result } = renderHook(() =>
        useAIEngine({
          contractId: 'CTR-2609-0001',
          versionNo: 1,
          userRole: 'USER',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentResult).toEqual(SAMPLE_SUMMARY_RESULT);
      expect(result.current.isCached).toBe(true);
      expect(fetchCachedAnalysis).toHaveBeenCalledWith('CTR-2609-0001', 'SUMMARY', 1, 'BUYER');
    });

    it('should trigger AI analysis if no cached document exists', async () => {
      vi.mocked(fetchCachedAnalysis).mockResolvedValueOnce(null);
      vi.mocked(triggerAIAnalysis).mockResolvedValueOnce({
        cached: false,
        analysisId: 'SUMMARY_v1',
        result: SAMPLE_SUMMARY_RESULT,
      });

      const { result } = renderHook(() =>
        useAIEngine({
          contractId: 'CTR-2609-0001',
          versionNo: 1,
          userRole: 'USER',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(triggerAIAnalysis).toHaveBeenCalledWith({
        contractId: 'CTR-2609-0001',
        analysisType: 'SUMMARY',
        versionNo: 1,
        companyRole: 'BUYER',
        forceRefresh: false,
      });
      expect(result.current.currentResult).toEqual(SAMPLE_SUMMARY_RESULT);
    });

    it('should force re-analysis when reanalyzeCurrentTab is called', async () => {
      vi.mocked(fetchCachedAnalysis).mockResolvedValueOnce({
        analysisId: 'SUMMARY_v1',
        analysisType: 'SUMMARY',
        versionNo: 1,
        result: SAMPLE_SUMMARY_RESULT,
        analyzedBy: { uid: 'ai', displayName: 'AI' },
        createdAt: new Date(),
      });

      const { result } = renderHook(() =>
        useAIEngine({
          contractId: 'CTR-2609-0001',
          versionNo: 1,
          userRole: 'USER',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Now trigger re-analyze
      vi.mocked(triggerAIAnalysis).mockResolvedValueOnce({
        cached: false,
        analysisId: 'SUMMARY_v1',
        result: { ...SAMPLE_SUMMARY_RESULT, financialTerms: 'Updated Terms' },
      });

      await act(async () => {
        await result.current.reanalyzeCurrentTab();
      });

      expect(triggerAIAnalysis).toHaveBeenCalledWith({
        contractId: 'CTR-2609-0001',
        analysisType: 'SUMMARY',
        versionNo: 1,
        companyRole: 'BUYER',
        forceRefresh: true,
      });
      expect((result.current.currentResult as any)?.financialTerms).toBe('Updated Terms');
    });

    it('should set error message when trigger fails', async () => {
      vi.mocked(fetchCachedAnalysis).mockResolvedValueOnce(null);
      vi.mocked(triggerAIAnalysis).mockRejectedValueOnce(new Error('AI rate limit reached'));

      const { result } = renderHook(() =>
        useAIEngine({
          contractId: 'CTR-2609-0001',
          versionNo: 1,
          userRole: 'USER',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('AI rate limit reached');
    });
  });
});
