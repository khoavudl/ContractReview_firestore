/**
 * Feature: Contracts Management & Dashboard
 * Component: ManageViewersModal — Modal to Add/Remove Viewers across all contract review stages
 */

import React, { useState, useEffect } from 'react';
import { Save, ShieldAlert } from 'lucide-react';
import { Modal, Button, useToast } from '@/shared';
import type { ContractDocument } from '@/shared';
import { ViewerSelector } from './ViewerSelector';
import { updateContractViewers } from '../services/contractService';

export interface ManageViewersModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly contract: ContractDocument;
  readonly isOwner: boolean;
  readonly onUpdated?: () => void;
}

export function ManageViewersModal({
  isOpen,
  onClose,
  contract,
  isOwner,
  onUpdated,
}: ManageViewersModalProps): React.ReactElement {
  const [emails, setEmails] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setEmails(contract.viewerEmails ? [...contract.viewerEmails] : []);
    }
  }, [isOpen, contract.viewerEmails]);

  const handleSave = async (): Promise<void> => {
    if (!isOwner) return;
    setIsSaving(true);
    try {
      await updateContractViewers(contract.contractId, emails);
      showToast({
        title: 'Cập nhật thành công',
        message: 'Danh sách Người xem (Viewers) đã được lưu.',
        variant: 'success',
      });
      onUpdated?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật người xem';
      showToast({ title: 'Lỗi', message: msg, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Người xem hồ sơ (${emails.length})`}
      size="md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {isOwner ? 'Hủy' : 'Đóng'}
          </Button>
          {isOwner && (
            <Button
              variant="primary"
              icon={isSaving ? undefined : <Save className="w-4 h-4" />}
              isLoading={isSaving}
              onClick={handleSave}
            >
              Lưu Thay Đổi
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {!isOwner && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              Chỉ Người tạo hồ sơ (Owner) mới có quyền Thêm hoặc Xóa Người xem chia sẻ.
            </span>
          </div>
        )}

        <ViewerSelector
          selectedEmails={emails}
          onChange={setEmails}
          creatorEmail={contract.createdBy.email}
          disabled={!isOwner}
          placeholder="Tìm theo tên hoặc email đồng sự, quản lý..."
        />

        <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
          <p className="font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
            Quyền hạn của Người xem (Viewers):
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400">
            <li>Xem và tải tài liệu hợp đồng, phụ lục và tài liệu tham chiếu.</li>
            <li>Tham gia nhắn tin trên tab Trao đổi trực tiếp.</li>
            <li>Xem Task list ở chế độ chỉ đọc; không thể can thiệp quy trình duyệt.</li>
            <li>Tự động nhận bản sao (CC) các email thông báo tiến độ của hồ sơ.</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
