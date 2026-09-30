/**
 * Feature: Contracts Management & Dashboard
 * Component: CreateContractModal — Form Modal to Create a New Contract
 */

import React, { useState, useCallback } from 'react';
import { FilePlus, AlertCircle, UploadCloud, FileText, X } from 'lucide-react';
import { Modal, Button, Input, formatFileSize } from '@/shared';
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
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    setFileError(null);
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.docx')) {
      setFileError('Chỉ chấp nhận tệp văn bản Word định dạng .docx');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setFileError('Dung lượng tệp vượt quá giới hạn 50MB cho phép.');
      return;
    }

    setFile(selectedFile);
  }, []);

  const resetForm = useCallback(() => {
    setTitle('');
    setSupplier('');
    setDescription('');
    setDepartment(currentUser?.department || '');
    setFile(null);
    setFileError(null);
    clearError();
  }, [currentUser?.department, clearError]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setFileError('Vui lòng đính kèm tệp hợp đồng Word (.docx) phiên bản đầu tiên.');
      return;
    }

    const contractId = await submitContract({
      title,
      supplier,
      description,
      department,
      companyRole: 'BUYER',
      file,
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
            Mô tả tóm tắt nội dung *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tóm tắt phạm vi công việc, giá trị hợp đồng ước tính hoặc lưu ý đặc thù..."
            rows={3}
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Tệp văn bản hợp đồng Word (.docx) phiên bản đầu tiên *
          </label>

          {file ? (
            <div className="flex items-center justify-between p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {file.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {formatFileSize(file.size)} • Phiên bản v1
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={isSubmitting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                aria-label="Xóa tệp đã chọn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const droppedFile = e.dataTransfer.files?.[0] || null;
                handleFileSelect(droppedFile);
              }}
              className={`relative flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                dragOver
                  ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/30'
                  : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const picked = e.target.files?.[0] || null;
                  handleFileSelect(picked);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isSubmitting}
              />
              <UploadCloud className="w-8 h-8 text-brand-500 dark:text-brand-400 mb-2" />
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Kéo thả tệp Word (.docx) vào đây, hoặc click để duyệt tệp
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Bắt buộc định dạng .docx • Tối đa 50MB
              </div>
            </div>
          )}

          {fileError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {fileError}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
