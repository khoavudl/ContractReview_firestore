/**
 * Unit Tests for useWorkflowActions Hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkflowActions } from './useWorkflowActions';
import type { AuthUser, ContractDocument } from '@/shared';
import * as taskService from '../services/taskService';

vi.mock('../services/taskService', () => ({
  executeStatusTransition: vi.fn(),
}));

vi.mock('@/features/comments', () => ({
  addSystemEventComment: vi.fn().mockResolvedValue({}),
}));

describe('useWorkflowActions Hook', () => {
  const mockUser: AuthUser = {
    uid: 'u-user-1',
    email: 'user@foodempire.vn',
    displayName: 'Nguyễn Văn Phụ Trách',
    role: 'USER',
    isActive: true,
  };

  const mockLegal: AuthUser = {
    uid: 'u-legal-1',
    email: 'legal@foodempire.vn',
    displayName: 'Luật sư Trần',
    role: 'LEGAL',
    isActive: true,
  };

  const mockHOL: AuthUser = {
    uid: 'u-hol-1',
    email: 'hol@foodempire.vn',
    displayName: 'Trưởng ban Pháp chế',
    role: 'HOL',
    isActive: true,
  };

  const baseContract: ContractDocument = {
    contractId: 'CTR-2609-0001',
    title: 'Hợp đồng mua bao bì',
    supplier: 'Bao Bì Toàn Cầu',
    description: 'Mô tả hợp đồng',
    status: 'DRAFT',
    currentVersion: 1,
    createdBy: { uid: 'u-user-1', email: 'user@foodempire.vn', displayName: 'Nguyễn Văn Phụ Trách' },
    rejectCount: 0,
    isArchived: false,
    companyRole: 'BUYER',
    currentVersionFile: { versionNo: 1, originalFileName: '', storagePath: '' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes SUBMIT_TO_LEGAL action to owner when contract is DRAFT', () => {
    const { result } = renderHook(() =>
      useWorkflowActions(baseContract, mockUser)
    );

    expect(result.current.availableActions.length).toBe(1);
    expect(result.current.availableActions[0].actionType).toBe('SUBMIT_TO_LEGAL');
    expect(result.current.availableActions[0].targetStatus).toBe('PENDING_LEGAL');
  });

  it('exposes SEND_LEGAL_TASKS and APPROVE_LEGAL to LEGAL when contract is PENDING_LEGAL', () => {
    const pendingContract: ContractDocument = {
      ...baseContract,
      status: 'PENDING_LEGAL',
    };

    const { result } = renderHook(() =>
      useWorkflowActions(pendingContract, mockLegal)
    );

    const actionTypes = result.current.availableActions.map((a) => a.actionType);
    expect(actionTypes).toContain('SEND_LEGAL_TASKS');
    expect(actionTypes).toContain('APPROVE_LEGAL');

    const sendTasksAction = result.current.availableActions.find((a) => a.actionType === 'SEND_LEGAL_TASKS');
    expect(sendTasksAction?.targetStatus).toBe('USER_REVISING');

    const approveAction = result.current.availableActions.find((a) => a.actionType === 'APPROVE_LEGAL');
    expect(approveAction?.targetStatus).toBe('PENDING_HOL');
    expect(approveAction?.label).toContain('Trình Trưởng Phòng');
  });

  it('denies HOL from seeing or executing actions at PENDING_LEGAL stage', () => {
    const pendingContract: ContractDocument = {
      ...baseContract,
      status: 'PENDING_LEGAL',
    };

    const { result } = renderHook(() =>
      useWorkflowActions(pendingContract, mockHOL)
    );

    expect(result.current.availableActions.length).toBe(0);
  });

  it('exposes RESUBMIT_REVISION with requireConfirmation when contract is USER_REVISING and sends default changeSummary', async () => {
    vi.mocked(taskService.executeStatusTransition).mockResolvedValue({
      success: true,
      newStatus: 'PENDING_LEGAL',
    });

    const revisingContract: ContractDocument = {
      ...baseContract,
      status: 'USER_REVISING',
      currentVersion: 2,
    };

    const { result } = renderHook(() =>
      useWorkflowActions(revisingContract, mockUser)
    );

    expect(result.current.availableActions.length).toBe(1);
    expect(result.current.availableActions[0].actionType).toBe('RESUBMIT_REVISION');
    expect(result.current.availableActions[0].requireConfirmation).toBe(true);
    expect(result.current.availableActions[0].label).toBe('Nộp Lại Thẩm Định');

    act(() => {
      result.current.triggerAction(result.current.availableActions[0]);
    });
    expect(result.current.confirmModalAction?.actionType).toBe('RESUBMIT_REVISION');

    await act(async () => {
      await result.current.handleConfirmAction();
    });

    expect(taskService.executeStatusTransition).toHaveBeenCalledWith(
      'CTR-2609-0001',
      'PENDING_LEGAL',
      {
        changeSummary: 'Bộ phận Legal vui lòng xem xét và duyệt lại hợp đồng.',
        versionNo: 2,
      }
    );
  });

  it('exposes HOL_REJECT_TO_USER (targetStatus: USER_REVISING) and APPROVE_FINAL to HOL when contract is PENDING_HOL', () => {
    const pendingHolContract: ContractDocument = {
      ...baseContract,
      status: 'PENDING_HOL',
    };

    const { result } = renderHook(() =>
      useWorkflowActions(pendingHolContract, mockHOL)
    );

    const actionTypes = result.current.availableActions.map((a) => a.actionType);
    expect(actionTypes).toContain('HOL_REJECT_TO_USER');
    expect(actionTypes).toContain('APPROVE_FINAL');

    const rejectAction = result.current.availableActions.find((a) => a.actionType === 'HOL_REJECT_TO_USER');
    expect(rejectAction?.targetStatus).toBe('USER_REVISING');
  });

  it('exposes RESUBMIT_REVISION directly to owner when contract is LEGAL_COMMENTED', () => {
    const commentedContract: ContractDocument = {
      ...baseContract,
      status: 'LEGAL_COMMENTED',
    };

    const { result } = renderHook(() =>
      useWorkflowActions(commentedContract, mockUser)
    );

    expect(result.current.availableActions.length).toBe(1);
    expect(result.current.availableActions[0].actionType).toBe('RESUBMIT_REVISION');
    expect(result.current.availableActions[0].targetStatus).toBe('PENDING_LEGAL');
  });

  it('exposes RESUBMIT_REVISION directly to owner when contract is HOL_COMMENTED', () => {
    const holCommentedContract: ContractDocument = {
      ...baseContract,
      status: 'HOL_COMMENTED',
    };

    const { result } = renderHook(() =>
      useWorkflowActions(holCommentedContract, mockUser)
    );

    expect(result.current.availableActions.length).toBe(1);
    expect(result.current.availableActions[0].actionType).toBe('RESUBMIT_REVISION');
    expect(result.current.availableActions[0].targetStatus).toBe('PENDING_LEGAL');
  });

  it('executes status transition upon confirmation', async () => {
    vi.mocked(taskService.executeStatusTransition).mockResolvedValue({
      success: true,
      newStatus: 'PENDING_LEGAL',
    });

    const onTransitionSuccess = vi.fn();
    const { result } = renderHook(() =>
      useWorkflowActions(baseContract, mockUser, onTransitionSuccess)
    );

    const action = result.current.availableActions[0];
    act(() => {
      result.current.triggerAction(action);
    });

    expect(result.current.confirmModalAction?.actionType).toBe('SUBMIT_TO_LEGAL');

    await act(async () => {
      await result.current.handleConfirmAction();
    });

    expect(taskService.executeStatusTransition).toHaveBeenCalledWith(
      'CTR-2609-0001',
      'PENDING_LEGAL',
      undefined
    );
    expect(onTransitionSuccess).toHaveBeenCalled();
  });
});
