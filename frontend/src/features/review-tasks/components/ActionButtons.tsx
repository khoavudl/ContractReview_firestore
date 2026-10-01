/**
 * Feature: Review Tasks & Workflow Action Engine
 * Component: ActionButtons.tsx — Workflow Action buttons with confirmation dialogs and revision modal
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Check,
  Edit3,
  Upload,
  ArrowRight,
  AlertCircle,
  FileSignature,
  Trash2,
} from 'lucide-react';
import { Button, Modal, useToast } from '@/shared';
import type { AuthUser, ContractDocument } from '@/shared';
import { deleteContractDoc, DeleteContractConfirmModal } from '@/features/contracts';
import type { UseWorkflowActionsReturn } from '../hooks/useWorkflowActions';
import type { WorkflowActionConfig, WorkflowActionType } from '../types';

export interface ActionButtonsProps {
  readonly workflowActions: UseWorkflowActionsReturn;
  readonly contract?: ContractDocument;
  readonly currentUser?: AuthUser;
  readonly openTasksCount?: number;
  readonly onActionCompleted?: () => void;
  readonly onDeleteCompleted?: () => void;
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
  onDeleteCompleted,
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

  const [actionNote, setActionNote] = useState<string>('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const canDeleteContract =
    Boolean(contract && currentUser) &&
    (contract?.status === 'DRAFT' || contract?.status === 'USER_REVISING') &&
    currentUser?.uid === contract?.createdBy.uid;

  if (availableActions.length === 0 && !confirmModalAction && !canDeleteContract) {
    return null;
  }

  const getActionInputConfig = (actionType: WorkflowActionType) => {
    switch (actionType) {
      case 'SUBMIT_TO_LEGAL':
        return {
          label: 'Ghi chú (tuỳ chọn):',
          placeholder: 'Nhập ghi chú tóm tắt nội dung hoặc các điều khoản cần Pháp chế lưu ý rà soát...',
        };
      case 'RESUBMIT_REVISION':
        return {
          label: 'Nội dung đã sửa đổi / Ghi chú gửi Pháp chế:',
          placeholder: 'Tóm tắt các điều khoản đã sửa đổi hoặc giải trình theo ý kiến góp ý...',
        };
      case 'SEND_LEGAL_TASKS':
        return {
          label: 'Lý do / Hướng dẫn yêu cầu chỉnh sửa:',
          placeholder: 'Ghi rõ các nội dung hoặc điều khoản cần người phụ trách điều chỉnh lại...',
        };
      case 'HOL_REJECT_TO_USER':
        return {
          label: 'Lý do yêu cầu làm rõ / từ chối:',
          placeholder: 'Ghi rõ lý do hoặc các điểm quan trọng cần người phụ trách giải trình thêm...',
        };
      case 'APPROVE_LEGAL':
        return {
          label: 'Ghi chú (tuỳ chọn):',
          placeholder: 'Ghi chú bàn giao hoặc tóm tắt các điểm quan trọng đã thẩm định...',
        };
      default:
        return null;
    }
  };

  const handleConfirm = async (): Promise<void> => {
    const inputConfig = confirmModalAction ? getActionInputConfig(confirmModalAction.actionType) : null;
    const payload = inputConfig && actionNote.trim()
      ? { rejectReason: actionNote.trim(), changeSummary: actionNote.trim() }
      : undefined;

    await handleConfirmAction(payload);
    setActionNote('');
    onActionCompleted?.();
  };

  const handleDeleteContract = async (): Promise<void> => {
    if (!contract) return;
    try {
      setIsDeleting(true);
      await deleteContractDoc(contract.contractId);
      showToast({
        variant: 'success',
        title: 'Đã xóa hồ sơ',
        message: `Hồ sơ ${contract.contractId} đã được xóa thành công.`,
      });
      setIsDeleteModalOpen(false);
      if (onDeleteCompleted) {
        onDeleteCompleted();
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa hồ sơ';
      showToast({
        variant: 'error',
        title: 'Lỗi khi xóa hồ sơ',
        message: msg,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-1 sm:items-end">
        <div className="flex flex-wrap items-center gap-2">
          {canDeleteContract && (
            <Button
              variant="outline"
              size="sm"
              className="text-rose-600 border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40"
              disabled={isExecuting || isDeleting}
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Xóa Hồ Sơ
            </Button>
          )}
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

            {confirmModalAction && getActionInputConfig(confirmModalAction.actionType) && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {getActionInputConfig(confirmModalAction.actionType)?.label}
                </label>
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={getActionInputConfig(confirmModalAction.actionType)?.placeholder}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setActionNote('');
                  closeConfirmModal();
                }}
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

      {/* Delete Contract Confirmation Modal */}
      {canDeleteContract && contract && (
        <DeleteContractConfirmModal
          isOpen={isDeleteModalOpen}
          contractId={contract.contractId}
          contractTitle={contract.title}
          isDeleting={isDeleting}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteContract}
        />
      )}
    </>
  );
}
