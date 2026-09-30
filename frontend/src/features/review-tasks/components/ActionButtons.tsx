/**
 * Feature: Review Tasks & Workflow Action Engine
 * Component: ActionButtons.tsx — Workflow Action buttons with confirmation dialogs and revision modal
 */

import React, { useState } from 'react';
import {
  Send,
  Check,
  Edit3,
  Upload,
  ArrowRight,
  AlertCircle,
  FileSignature,
} from 'lucide-react';
import { Button, Modal } from '@/shared';
import type { AuthUser, ContractDocument } from '@/shared';
import type { UseWorkflowActionsReturn } from '../hooks/useWorkflowActions';
import type { WorkflowActionConfig } from '../types';
import { SubmitRevisionModal } from './SubmitRevisionModal';

export interface ActionButtonsProps {
  readonly workflowActions: UseWorkflowActionsReturn;
  readonly contract: ContractDocument;
  readonly currentUser: AuthUser;
  readonly openTasksCount?: number;
  readonly onActionCompleted?: () => void;
}

function renderActionIcon(iconName: WorkflowActionConfig['iconName']): React.ReactNode {
  switch (iconName) {
    case 'send':
      return <Send className="w-3.5 h-3.5" />;
    case 'check':
      return <Check className="w-3.5 h-3.5" />;
    case 'edit':
      return <Edit3 className="w-3.5 h-3.5" />;
    case 'upload':
      return <Upload className="w-3.5 h-3.5" />;
    case 'alert-circle':
      return <AlertCircle className="w-3.5 h-3.5" />;
    case 'file-signature':
      return <FileSignature className="w-3.5 h-3.5" />;
    default:
      return <ArrowRight className="w-3.5 h-3.5" />;
  }
}

export function ActionButtons({
  workflowActions,
  contract,
  currentUser,
  openTasksCount = 0,
  onActionCompleted,
}: ActionButtonsProps): React.ReactElement | null {
  const {
    availableActions,
    isExecuting,
    isRevisionModalOpen,
    closeRevisionModal,
    confirmModalAction,
    closeConfirmModal,
    triggerAction,
    handleConfirmAction,
  } = workflowActions;

  const [rejectReason, setRejectReason] = useState<string>('');

  if (availableActions.length === 0 && !confirmModalAction && !isRevisionModalOpen) {
    return null;
  }

  const handleConfirm = async (): Promise<void> => {
    const payload =
      confirmModalAction?.actionType === 'HOL_REJECT_TO_USER'
        ? { rejectReason: rejectReason.trim() }
        : undefined;

    await handleConfirmAction(payload);
    setRejectReason('');
    onActionCompleted?.();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {availableActions.map((action) => (
          <Button
            key={action.actionType}
            variant={action.variant}
            size="sm"
            isLoading={isExecuting}
            disabled={isExecuting}
            icon={renderActionIcon(action.iconName)}
            onClick={() => triggerAction(action)}
          >
            {action.label}
          </Button>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {confirmModalAction && (
        <Modal
          isOpen={Boolean(confirmModalAction)}
          onClose={closeConfirmModal}
          title={confirmModalAction.confirmationTitle || 'Xác nhận chuyển trạng thái'}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmModalAction.confirmationMessage}
            </p>

            {confirmModalAction.actionType === 'HOL_REJECT_TO_USER' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Lý do yêu cầu làm rõ / từ chối:
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ghi rõ lý do hoặc các điểm quan trọng cần người phụ trách giải trình thêm..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={closeConfirmModal}
                disabled={isExecuting}
              >
                Hủy
              </Button>
              <Button
                variant={confirmModalAction.variant}
                size="sm"
                isLoading={isExecuting}
                onClick={handleConfirm}
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Submit Revision Modal */}
      {isRevisionModalOpen && (
        <SubmitRevisionModal
          isOpen={isRevisionModalOpen}
          onClose={closeRevisionModal}
          contract={contract}
          currentUser={currentUser}
          openTasksCount={openTasksCount}
          onSubmitted={() => {
            onActionCompleted?.();
          }}
        />
      )}
    </>
  );
}
