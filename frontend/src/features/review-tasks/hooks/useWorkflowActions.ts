/**
 * Feature: Review Tasks & Workflow Action Engine
 * Hook: useWorkflowActions.ts — Evaluates allowed state transitions per user role & status
 */

import { useState, useMemo, useCallback } from 'react';
import type { AuthUser, ContractDocument } from '@/shared';
import { STATUS_CONFIG } from '@/shared';
import type { WorkflowActionConfig, WorkflowActionType } from '../types';
import { executeStatusTransition } from '../services/taskService';
import { addSystemEventComment } from '@/features/comments';

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
            label: 'Submit Legal',
            targetStatus: 'PENDING_LEGAL',
            variant: 'primary',
            iconName: 'send',
            requireConfirmation: true,
            confirmationTitle: 'Xác nhận nộp thẩm định (Submit Legal)',
            confirmationMessage: 'Hồ sơ sẽ được chuyển tới bộ phận Pháp chế để rà soát các điều khoản.',
          });
        }
        break;

      case 'PENDING_LEGAL':
        if (isLegal) {
          actions.push({
            actionType: 'SEND_LEGAL_TASKS',
            label: 'Request Change',
            targetStatus: 'USER_REVISING',
            variant: 'secondary',
            iconName: 'alert-circle',
            requireConfirmation: true,
            confirmationTitle: 'Yêu cầu chỉnh sửa (Request Change)',
            confirmationMessage: 'Danh sách các điều khoản cần sửa đổi sẽ được bàn giao cho người phụ trách cập nhật.',
          });
          actions.push({
            actionType: 'APPROVE_LEGAL',
            label: 'Submit Head',
            targetStatus: 'PENDING_HOL',
            variant: 'primary',
            iconName: 'send',
            requireConfirmation: true,
            confirmationTitle: 'Trình Trưởng phòng duyệt (Submit Head)',
            confirmationMessage: 'Xác nhận hợp đồng đạt yêu cầu pháp lý và chuyển tiếp lên Trưởng phòng (Head of Legal) xem xét phê duyệt.',
          });
        }
        break;

      case 'USER_REVISING':
      case 'LEGAL_COMMENTED':
      case 'HOL_COMMENTED':
        if (isOwner) {
          actions.push({
            actionType: 'RESUBMIT_REVISION',
            label: 'Submit Legal',
            targetStatus: 'PENDING_LEGAL',
            variant: 'primary',
            iconName: 'send',
            requireConfirmation: true,
            confirmationTitle: 'Xác nhận nộp lại hồ sơ (Submit Legal)',
            confirmationMessage: 'Hồ sơ sẽ được chuyển lại tới bộ phận Pháp chế để tiếp tục rà soát thẩm định.',
          });
        }
        break;

      case 'PENDING_HOL':
        if (isHOL) {
          actions.push({
            actionType: 'HOL_REJECT_TO_USER',
            label: 'Request Change',
            targetStatus: 'USER_REVISING',
            variant: 'danger',
            iconName: 'alert-circle',
            requireConfirmation: true,
            confirmationTitle: 'Yêu cầu sửa đổi / làm rõ (Request Change)',
            confirmationMessage: 'Hồ sơ sẽ được chuyển lại cho người phụ trách (User) để giải trình và hoàn thiện thêm.',
          });
          actions.push({
            actionType: 'APPROVE_FINAL',
            label: 'Approve',
            targetStatus: 'HOL_APPROVED',
            variant: 'primary',
            iconName: 'check',
            requireConfirmation: true,
            confirmationTitle: 'Phê duyệt hợp đồng chính thức (Approve)',
            confirmationMessage: 'Hồ sơ sẽ được phê duyệt chính thức và tạo bản PDF chỉ đọc để chuẩn bị nộp WeSign.',
          });
        }
        break;

      case 'HOL_APPROVED':
        if (isOwner) {
          actions.push({
            actionType: 'CONFIRM_WESIGN',
            label: 'WeSign Done',
            targetStatus: 'COMPLETED',
            variant: 'primary',
            iconName: 'file-signature',
            requireConfirmation: true,
            confirmationTitle: 'Xác nhận hoàn tất ký kết (WeSign Done)',
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

  const getStatusEventIcon = (status: string): string => {
    if (status === 'HOL_APPROVED' || status === 'LEGAL_APPROVED') return '💚';
    if (status === 'USER_REVISING' || status === 'HOL_COMMENTED') return '⚠️';
    if (status === 'COMPLETED') return '🎉';
    return '⚡';
  };

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

      // Automatically post system status change comment to discussion timeline
      try {
        const meta = STATUS_CONFIG[targetStatus];
        const reasonText = payload?.rejectReason || payload?.changeSummary;
        await addSystemEventComment(
          contract.contractId,
          {
            eventType: 'SYSTEM_STATUS_CHANGE',
            versionNo: contract.currentVersion,
            statusLabel: meta?.label || targetStatus,
            statusIcon: getStatusEventIcon(targetStatus),
            commentText: meta?.label || targetStatus,
            changeSummary: reasonText,
            rejectReason: payload?.rejectReason,
          },
          {
            uid: currentUser?.uid || 'system',
            displayName: currentUser?.displayName || currentUser?.email || 'Hệ thống',
            email: currentUser?.email,
            role: currentUser?.role || 'SYSTEM',
          }
        );
      } catch (commentErr) {
        console.warn('[useWorkflowActions] Failed to post status change comment:', commentErr);
      }

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

      const finalPayload =
        confirmModalAction.actionType === 'RESUBMIT_REVISION'
          ? {
              changeSummary:
                payload?.changeSummary?.trim() ||
                'Bộ phận Legal vui lòng xem xét và duyệt lại hợp đồng.',
              versionNo: contract?.currentVersion || 1,
            }
          : payload;

      await handleExecuteAction(confirmModalAction.actionType, confirmModalAction.targetStatus, finalPayload);
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
