/**
 * Feature: Contracts Management & Dashboard
 * Component: CreateContractModal — Form Modal to Create a New Contract
 */

import React, { useState, useCallback } from 'react';
import { FilePlus, AlertCircle } from 'lucide-react';
import { Modal, Button, Input } from '@/shared';
import { useAuth } from '@/features/auth';
import { useCreateContract } from '../hooks/useCreateContract';

export interface CreateContractModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: (contractId: string) => void;
}

export function CreateContractModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateContractModalProps): React.ReactElement {
  const { currentUser } = useAuth();
  const { isSubmitting, error, submitContract, clearError } = useCreateContract(currentUser);

  const [title, setTitle] = useState('');
  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState(currentUser?.department || '');

  const resetForm = useCallback(() => {
    setTitle('');
    setSupplier('');
    setDescription('');
    setDepartment(currentUser?.department || '');
    clearError();
  }, [currentUser?.department, clearError]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contractId = await submitContract({
      title,
      supplier,
      description,
      department,
      companyRole: 'BUYER',
    });

    if (contractId) {
      resetForm();
      onSuccess(contractId);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tạo Mới Hồ Sơ Hợp Đồng"
      size="lg"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button
            variant="primary"
            icon={<FilePlus className="w-4 h-4" />}
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            Tạo Hồ Sơ (DRAFT)
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Tiêu đề hợp đồng *"
          placeholder="VD: Hợp đồng mua bao bì màng nhôm niên vụ 2026"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          fullWidth
        />

        <Input
          label="Đối tác / Nhà cung cấp *"
          placeholder="VD: Công ty Cổ phần Bao Bì Toàn Cầu"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          required
          fullWidth
        />

        <Input
          label="Phòng ban phụ trách"
          placeholder="VD: Sales, Marketing, Mua hàng..."
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          fullWidth
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Mô tả tóm tắt nội dung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tóm tắt phạm vi công việc, giá trị hợp đồng ước tính hoặc lưu ý đặc thù..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>
      </form>
    </Modal>
  );
}
