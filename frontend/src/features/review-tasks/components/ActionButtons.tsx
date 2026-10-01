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

export interface ActionButtonsProps {
  readonly workflowActions: UseWorkflowActionsReturn;
  readonly contract?: ContractDocument;
  readonly currentUser?: AuthUser;
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
  openTasksCount = 0,
  onActionCompleted,
}: ActionButtonsProps): React.ReactElement | null {
  const {
    availableActions,
    isExecuting,
    error,
    confirmModalAction,
    closeConfirmModal,
    triggerAction,
    handleConfirmAction,
  } = workflowActions;

  const [rejectReason, setRejectReason] = useState<string>('');

  if (availableActions.length === 0 && !confirmModalAction) {
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
      <div className="flex flex-col gap-1 sm:items-end">
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
        {error && (
          <p className="text-[11px] text-rose-500 font-medium">
            {error}
          </p>
        )}
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

            {confirmModalAction.actionType === 'RESUBMIT_REVISION' && openTasksCount > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-800/60 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                <span>
                  Lưu ý: Hiện còn <strong>{openTasksCount} điều khoản</strong> chưa được đánh dấu đã sửa hoặc giải trình.
                </span>
              </div>
            )}

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
    </>
  );
}
