/**
 * Feature: Review Tasks & Workflow Action Engine
 * Hook: useWorkflowActions.ts — Evaluates allowed state transitions per user role & status
 */

import { useState, useMemo, useCallback } from 'react';
import type { AuthUser, ContractDocument } from '@/shared';
import type { WorkflowActionConfig, WorkflowActionType } from '../types';
import { executeStatusTransition } from '../services/taskService';

export interface UseWorkflowActionsReturn {
  readonly availableActions: readonly WorkflowActionConfig[];
  readonly isExecuting: boolean;
  readonly error: string | null;
  readonly isRevisionModalOpen: boolean;
  readonly openRevisionModal: () => void;
  readonly closeRevisionModal: () => void;
  readonly confirmModalAction: WorkflowActionConfig | null;
  readonly closeConfirmModal: () => void;
  readonly triggerAction: (action: WorkflowActionConfig) => void;
  readonly handleConfirmAction: (payload?: { changeSummary?: string; rejectReason?: string }) => Promise<void>;
}

export function useWorkflowActions(
  contract: ContractDocument | null,
  currentUser: AuthUser | null,
  onTransitionSuccess?: () => void
): UseWorkflowActionsReturn {
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState<boolean>(false);
  const [confirmModalAction, setConfirmModalAction] = useState<WorkflowActionConfig | null>(null);

  const availableActions = useMemo<readonly WorkflowActionConfig[]>(() => {
    if (!contract || !currentUser) return [];

    const isOwner = currentUser.uid === contract.createdBy.uid;
    const isLegal = currentUser.role === 'LEGAL';
    const isHOL = currentUser.role === 'HOL';
    const actions: WorkflowActionConfig[] = [];

    switch (contract.status) {
      case 'DRAFT':
        if (isOwner) {
          actions.push({
            actionType: 'SUBMIT_TO_LEGAL',
            label: 'Nộp Thẩm Định',
            targetStatus: 'PENDING_LEGAL',
            variant: 'primary',
            iconName: 'send',
            requireConfirmation: true,
            confirmationTitle: 'Nộp hồ sơ thẩm định pháp chế',
            confirmationMessage: 'Hồ sơ sẽ được chuyển tới bộ phận Pháp chế để rà soát các điều khoản.',
          });
        }
        break;

      case 'PENDING_LEGAL':
        if (isLegal || isHOL) {
          actions.push({
            actionType: 'SEND_LEGAL_TASKS',
            label: 'Yêu Cầu Chỉnh Sửa',
            targetStatus: 'LEGAL_COMMENTED',
            variant: 'secondary',
            iconName: 'alert-circle',
            requireConfirmation: true,
            confirmationTitle: 'Gửi yêu cầu chỉnh sửa',
            confirmationMessage: 'Danh sách các điều khoản cần sửa đổi sẽ được bàn giao cho người phụ trách cập nhật.',
          });
          actions.push({
            actionType: 'APPROVE_LEGAL',
            label: 'Phê Duyệt Pháp Chế',
            targetStatus: 'LEGAL_APPROVED',
            variant: 'primary',
            iconName: 'check',
            requireConfirmation: true,
            confirmationTitle: 'Phê duyệt thẩm định pháp lý',
            confirmationMessage: 'Xác nhận hợp đồng đạt yêu cầu pháp lý và chuyển tiếp lên Trưởng phòng xét duyệt.',
          });
        }
        break;

      case 'LEGAL_COMMENTED':
        if (isOwner) {
          actions.push({
            actionType: 'START_REVISING',
            label: 'Bắt Đầu Sửa Đổi',
            targetStatus: 'USER_REVISING',
            variant: 'primary',
            iconName: 'edit',
          });
        }
        break;

      case 'USER_REVISING':
        if (isOwner) {
          actions.push({
            actionType: 'RESUBMIT_REVISION',
            label: 'Nộp Bản Sửa Đổi Mới',
            targetStatus: 'PENDING_LEGAL',
            variant: 'primary',
            iconName: 'upload',
            promptRevisionModal: true,
          });
        }
        break;

      case 'PENDING_HOL':
        if (isHOL) {
          actions.push({
            actionType: 'HOL_REJECT_TO_USER',
            label: 'Yêu Cầu Làm Rõ',
            targetStatus: 'HOL_COMMENTED',
            variant: 'danger',
            iconName: 'alert-circle',
            requireConfirmation: true,
            confirmationTitle: 'Yêu cầu làm rõ hợp đồng',
            confirmationMessage: 'Hồ sơ sẽ được chuyển lại cho người phụ trách để giải trình và hoàn thiện thêm.',
          });
          actions.push({
            actionType: 'APPROVE_FINAL',
            label: 'Phê Duyệt Chính Thức',
            targetStatus: 'HOL_APPROVED',
            variant: 'primary',
            iconName: 'check',
            requireConfirmation: true,
            confirmationTitle: 'Phê duyệt hợp đồng chính thức',
            confirmationMessage: 'Hồ sơ sẽ được phê duyệt và tạo bản PDF chỉ đọc chính thức để nộp WeSign.',
          });
        }
        break;

      case 'HOL_COMMENTED':
        if (isOwner) {
          actions.push({
            actionType: 'START_REVISING',
            label: 'Bắt Đầu Sửa Đổi',
            targetStatus: 'USER_REVISING',
            variant: 'primary',
            iconName: 'edit',
          });
        }
        break;

      case 'HOL_APPROVED':
        if (isOwner) {
          actions.push({
            actionType: 'CONFIRM_WESIGN',
            label: 'Xác Nhận Ký WeSign',
            targetStatus: 'COMPLETED',
            variant: 'primary',
            iconName: 'file-signature',
            requireConfirmation: true,
            confirmationTitle: 'Xác nhận hoàn tất ký kết',
            confirmationMessage: 'Hợp đồng đã hoàn thành ký số trên WeSign và sẽ được chuyển sang kho lưu trữ.',
          });
        }
        break;

      default:
        break;
    }

    return actions;
  }, [contract, currentUser]);

  const openRevisionModal = useCallback(() => setIsRevisionModalOpen(true), []);
  const closeRevisionModal = useCallback(() => setIsRevisionModalOpen(false), []);
  const closeConfirmModal = useCallback(() => setConfirmModalAction(null), []);

  const triggerAction = useCallback(
    (action: WorkflowActionConfig) => {
      if (action.promptRevisionModal) {
        setIsRevisionModalOpen(true);
        return;
      }
      if (action.requireConfirmation) {
        setConfirmModalAction(action);
        return;
      }
      // Execute immediately if no modal/confirm needed
      handleExecuteAction(action.actionType, action.targetStatus);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contract]
  );

  const handleExecuteAction = async (
    _actionType: WorkflowActionType,
    targetStatus: WorkflowActionConfig['targetStatus'],
    payload?: { changeSummary?: string; rejectReason?: string }
  ): Promise<void> => {
    if (!contract) return;
    setIsExecuting(true);
    setError(null);

    try {
      await executeStatusTransition(contract.contractId, targetStatus, payload);
      onTransitionSuccess?.();
    } catch (err: unknown) {
      console.error('[useWorkflowActions] executeStatusTransition error:', err);
      const msg = err instanceof Error ? err.message : 'Lỗi khi chuyển trạng thái.';
      setError(msg);
    } finally {
      setIsExecuting(false);
      setConfirmModalAction(null);
    }
  };

  const handleConfirmAction = useCallback(
    async (payload?: { changeSummary?: string; rejectReason?: string }): Promise<void> => {
      if (!confirmModalAction) return;
      await handleExecuteAction(confirmModalAction.actionType, confirmModalAction.targetStatus, payload);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [confirmModalAction, contract]
  );

  return {
    availableActions,
    isExecuting,
    error,
    isRevisionModalOpen,
    openRevisionModal,
    closeRevisionModal,
    confirmModalAction,
    closeConfirmModal,
    triggerAction,
    handleConfirmAction,
  };
}
