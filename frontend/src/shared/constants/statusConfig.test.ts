import { describe, it, expect } from 'vitest';
import { getStatusMeta, getMetricGroup } from './statusConfig';
import type { ContractStatus } from '../types/statusEnums';

describe('statusConfig', () => {
  const allStatuses: ContractStatus[] = [
    'DRAFT',
    'PENDING_LEGAL',
    'LEGAL_COMMENTED',
    'USER_REVISING',
    'LEGAL_APPROVED',
    'PENDING_HOL',
    'HOL_COMMENTED',
    'HOL_APPROVED',
    'COMPLETED',
  ];

  it('defines metadata for all 9 core contract statuses', () => {
    allStatuses.forEach((status) => {
      const meta = getStatusMeta(status);
      expect(meta).toBeDefined();
      expect(meta.label).toBeTruthy();
      expect(meta.variant).toBeTruthy();
    });
  });

  describe('getMetricGroup', () => {
    it('maps draft-related statuses to draft group', () => {
      expect(getMetricGroup('DRAFT')).toBe('draft');
      expect(getMetricGroup('USER_REVISING')).toBe('draft');
    });

    it('maps legal review statuses to legal group', () => {
      expect(getMetricGroup('PENDING_LEGAL')).toBe('legal');
      expect(getMetricGroup('LEGAL_COMMENTED')).toBe('legal');
    });

    it('maps head review statuses to head group', () => {
      expect(getMetricGroup('PENDING_HOL')).toBe('head');
      expect(getMetricGroup('HOL_COMMENTED')).toBe('head');
    });

    it('maps approved & completed statuses to approved group', () => {
      expect(getMetricGroup('LEGAL_APPROVED')).toBe('approved');
      expect(getMetricGroup('HOL_APPROVED')).toBe('approved');
      expect(getMetricGroup('COMPLETED')).toBe('approved');
    });
  });
});
