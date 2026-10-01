import { describe, it, expect } from 'vitest';
import {
  validateTransition,
  computeStatusUpdates,
  type TransitionUserContext,
} from './statusStateMachine.js';

describe('statusStateMachine', () => {
  const ownerUser: TransitionUserContext = {
    uid: 'user-001',
    role: 'USER',
    displayName: 'Nguyễn Văn User',
    email: 'user@company.vn',
  };

  const otherUser: TransitionUserContext = {
    uid: 'user-999',
    role: 'USER',
    displayName: 'Người Khác',
    email: 'other@company.vn',
  };

  const legalStaff: TransitionUserContext = {
    uid: 'legal-001',
    role: 'LEGAL',
    displayName: 'Trần Thị Legal',
    email: 'legal@company.vn',
  };

  const headOfLegal: TransitionUserContext = {
    uid: 'hol-001',
    role: 'HOL',
    displayName: 'Lê Văn HOL',
    email: 'hol@company.vn',
  };

  describe('validateTransition', () => {
    it('allows owner USER to submit DRAFT to PENDING_LEGAL', () => {
      const result = validateTransition('DRAFT', 'PENDING_LEGAL', 'user-001', ownerUser);
      expect(result.allowed).toBe(true);
    });

    it('denies non-owner USER from submitting DRAFT to PENDING_LEGAL', () => {
      const result = validateTransition('DRAFT', 'PENDING_LEGAL', 'user-001', otherUser);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Chỉ người phụ trách tạo hợp đồng');
    });

    it('denies illegal shortcut transition (DRAFT -> HOL_APPROVED)', () => {
      const result = validateTransition('DRAFT', 'HOL_APPROVED', 'user-001', ownerUser);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('không hợp lệ trong State Machine');
    });

    it('allows LEGAL to request revision: PENDING_LEGAL -> USER_REVISING', () => {
      const result = validateTransition('PENDING_LEGAL', 'USER_REVISING', 'user-001', legalStaff);
      expect(result.allowed).toBe(true);
    });

    it('allows LEGAL to escalate/submit: PENDING_LEGAL -> PENDING_HOL', () => {
      const result = validateTransition('PENDING_LEGAL', 'PENDING_HOL', 'user-001', legalStaff);
      expect(result.allowed).toBe(true);
    });

    it('denies HOL from interfering at PENDING_LEGAL (only LEGAL allowed)', () => {
      const res1 = validateTransition('PENDING_LEGAL', 'USER_REVISING', 'user-001', headOfLegal);
      expect(res1.allowed).toBe(false);
      expect(res1.reason).toContain('không được phép thực hiện');

      const res2 = validateTransition('PENDING_LEGAL', 'PENDING_HOL', 'user-001', headOfLegal);
      expect(res2.allowed).toBe(false);
      expect(res2.reason).toContain('không được phép thực hiện');
    });

    it('denies USER from approving or escalating at PENDING_LEGAL', () => {
      const result = validateTransition('PENDING_LEGAL', 'PENDING_HOL', 'user-001', ownerUser);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('không được phép thực hiện');
    });

    it('allows owner USER to resubmit from USER_REVISING to PENDING_LEGAL', () => {
      const result = validateTransition('USER_REVISING', 'PENDING_LEGAL', 'user-001', ownerUser);
      expect(result.allowed).toBe(true);
    });

    it('denies non-owner USER from resubmitting from USER_REVISING', () => {
      const result = validateTransition('USER_REVISING', 'PENDING_LEGAL', 'user-001', otherUser);
      expect(result.allowed).toBe(false);
    });

    it('allows HOL to return contract for revision: PENDING_HOL -> USER_REVISING', () => {
      const result = validateTransition('PENDING_HOL', 'USER_REVISING', 'user-001', headOfLegal);
      expect(result.allowed).toBe(true);
    });

    it('denies LEGAL from returning contract at PENDING_HOL', () => {
      const result = validateTransition('PENDING_HOL', 'USER_REVISING', 'user-001', legalStaff);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('không được phép thực hiện');
    });

    it('allows HOL to approve PENDING_HOL -> HOL_APPROVED', () => {
      const result = validateTransition('PENDING_HOL', 'HOL_APPROVED', 'user-001', headOfLegal);
      expect(result.allowed).toBe(true);
    });

    it('denies LEGAL from approving PENDING_HOL (only HOL allowed)', () => {
      const result = validateTransition('PENDING_HOL', 'HOL_APPROVED', 'user-001', legalStaff);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('không được phép thực hiện');
    });

    it('allows owner USER to complete contract after HOL_APPROVED', () => {
      const result = validateTransition('HOL_APPROVED', 'COMPLETED', 'user-001', ownerUser);
      expect(result.allowed).toBe(true);
    });
  });

  describe('computeStatusUpdates', () => {
    it('increments rejectCount when resubmitting from USER_REVISING to PENDING_LEGAL', () => {
      const updates = computeStatusUpdates(
        { status: 'USER_REVISING', rejectCount: 0, isArchived: false },
        'PENDING_LEGAL'
      );
      expect(updates.status).toBe('PENDING_LEGAL');
      expect(updates.rejectCount).toBe(1);
    });

    it('increments rejectCount from existing count', () => {
      const updates = computeStatusUpdates(
        { status: 'USER_REVISING', rejectCount: 2, isArchived: false },
        'PENDING_LEGAL'
      );
      expect(updates.rejectCount).toBe(3);
    });

    it('does not increment rejectCount when initial submit from DRAFT', () => {
      const updates = computeStatusUpdates(
        { status: 'DRAFT', rejectCount: 0, isArchived: false },
        'PENDING_LEGAL'
      );
      expect(updates.status).toBe('PENDING_LEGAL');
      expect(updates.rejectCount).toBeUndefined();
    });

    it('sets isArchived: true when transitioning to COMPLETED', () => {
      const updates = computeStatusUpdates(
        { status: 'HOL_APPROVED', rejectCount: 1, isArchived: false },
        'COMPLETED'
      );
      expect(updates.status).toBe('COMPLETED');
      expect(updates.isArchived).toBe(true);
    });
  });
});
