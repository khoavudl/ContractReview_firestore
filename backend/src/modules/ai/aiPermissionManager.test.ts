import { describe, it, expect } from 'vitest';
import {
  canPerformAIAnalysis,
  buildAnalysisId,
} from './aiPermissionManager.js';

describe('aiPermissionManager', () => {
  describe('canPerformAIAnalysis', () => {
    it('allows owner USER to perform SUMMARY', () => {
      expect(canPerformAIAnalysis('SUMMARY', 'USER', true)).toBe(true);
    });

    it('denies non-owner USER from performing SUMMARY', () => {
      expect(canPerformAIAnalysis('SUMMARY', 'USER', false)).toBe(false);
    });

    it('denies USER from performing RISK or DECISION_BRIEF', () => {
      expect(canPerformAIAnalysis('RISK', 'USER', true)).toBe(false);
      expect(canPerformAIAnalysis('DECISION_BRIEF', 'USER', true)).toBe(false);
    });

    it('allows LEGAL to perform SUMMARY and RISK, but denies DECISION_BRIEF', () => {
      expect(canPerformAIAnalysis('SUMMARY', 'LEGAL', false)).toBe(true);
      expect(canPerformAIAnalysis('RISK', 'LEGAL', false)).toBe(true);
      expect(canPerformAIAnalysis('DECISION_BRIEF', 'LEGAL', false)).toBe(false);
    });

    it('allows HOL to perform all 3 analysis types', () => {
      expect(canPerformAIAnalysis('SUMMARY', 'HOL', false)).toBe(true);
      expect(canPerformAIAnalysis('RISK', 'HOL', false)).toBe(true);
      expect(canPerformAIAnalysis('DECISION_BRIEF', 'HOL', false)).toBe(true);
    });
  });

  describe('buildAnalysisId', () => {
    it('builds deterministic id for SUMMARY', () => {
      expect(buildAnalysisId('SUMMARY', 1)).toBe('SUMMARY_v1');
      expect(buildAnalysisId('SUMMARY', 3)).toBe('SUMMARY_v3');
    });

    it('builds deterministic id for RISK with role tag', () => {
      expect(buildAnalysisId('RISK', 1, 'BUYER')).toBe('RISK_v1_BUYER');
      expect(buildAnalysisId('RISK', 2, 'SELLER')).toBe('RISK_v2_SELLER');
      expect(buildAnalysisId('RISK', 1)).toBe('RISK_v1_GENERAL');
    });

    it('builds deterministic id for DECISION_BRIEF', () => {
      expect(buildAnalysisId('DECISION_BRIEF', 2)).toBe('DECISION_BRIEF_v2');
    });
  });
});
