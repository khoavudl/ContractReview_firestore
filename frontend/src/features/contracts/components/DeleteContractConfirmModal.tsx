/**
 * Feature: Contracts Management
 * Component: DeleteContractConfirmModal.tsx
 * Destructive confirmation modal for permanently deleting a contract case in DRAFT or USER_REVISING.
 */

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button, Modal } from '@/shared';

export interface DeleteContractConfirmModalProps {
  readonly isOpen: boolean;
  readonly contractId: string;
  readonly contractTitle?: string;
  readonly isDeleting?: boolean;
  readonly onConfirm: () => void | Promise<void>;
  readonly onClose: () => void;
}

export const DeleteContractConfirmModal: React.FC<DeleteContractConfirmModalProps> = ({
  isOpen,
  contractId,
  contractTitle,
  isDeleting = false,
  onConfirm,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isDeleting ? () => {} : onClose}
      title="Xác nhận xóa hồ sơ"
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-50 border border-rose-200">
          <div className="p-2 rounded-full bg-rose-100 text-rose-600 flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-xs text-rose-900 leading-relaxed">
            <p className="font-bold text-rose-800 text-[13px] mb-1">
              Hành động nguy hiểm không thể hoàn tác!
            </p>
            <p>
              Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ{' '}
              <strong className="font-mono">{contractId}</strong>
              {contractTitle ? ` (${contractTitle})` : ''}?
            </p>
            <p className="mt-1 text-rose-700">
              Toàn bộ tài liệu Word, tệp đính kèm, các phiên bản và lịch sử thảo luận liên quan sẽ bị xóa sạch khỏi hệ thống.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            isLoading={isDeleting}
            onClick={onConfirm}
          >
            Xác nhận xóa
          </Button>
        </div>
      </div>
    </Modal>
  );
};
