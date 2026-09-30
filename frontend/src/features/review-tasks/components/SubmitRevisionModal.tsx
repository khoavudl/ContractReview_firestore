/**
 * Feature: Review Tasks & Workflow Action Engine
 * Component: SubmitRevisionModal.tsx — Dialog for User to upload revised Word document (.docx) and resubmit
 */

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertTriangle, X } from 'lucide-react';
import { Modal, Button, formatFileSize } from '@/shared';
import type { AuthUser, ContractDocument } from '@/shared';
import { uploadRevisionDocx, executeStatusTransition } from '../services/taskService';

export interface SubmitRevisionModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly contract: ContractDocument;
  readonly currentUser: AuthUser;
  readonly openTasksCount: number;
  readonly onSubmitted: () => void;
}

export function SubmitRevisionModal({
  isOpen,
  onClose,
  contract,
  currentUser,
  openTasksCount,
  onSubmitted,
}: SubmitRevisionModalProps): React.ReactElement {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [changeSummary, setChangeSummary] = useState<string>('');
  const [negoNotes, setNegoNotes] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextVersionNo = (contract.currentVersion || 1) + 1;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
      setErrorMessage('Vui lòng chọn đúng tệp Microsoft Word (.docx).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Dung lượng tệp vượt quá giới hạn 25MB.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleRemoveFile = (): void => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Vui lòng chọn tệp Word (.docx) đã chỉnh sửa.');
      return;
    }

    if (!changeSummary.trim() || changeSummary.trim().length < 5) {
      setErrorMessage('Vui lòng nhập tóm tắt nội dung chỉnh sửa (tối thiểu 5 ký tự).');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // Step 1: Upload revised file & record version
      await uploadRevisionDocx(
        contract.contractId,
        currentUser,
        selectedFile,
        nextVersionNo,
        changeSummary,
        negoNotes
      );

      // Step 2: Trigger status transition to PENDING_LEGAL
      await executeStatusTransition(contract.contractId, 'PENDING_LEGAL', {
        changeSummary: changeSummary.trim(),
        versionNo: nextVersionNo,
      });

      onSubmitted();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi nộp bản sửa đổi.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Nộp Bản Sửa Đổi Hợp Đồng (Phiên Bản v${nextVersionNo})`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-900/50">
            {errorMessage}
          </div>
        )}

        {openTasksCount > 0 && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-800/60 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <div>
              <span className="font-semibold">Lưu ý: </span>
              <span>
                Hiện còn <strong>{openTasksCount} điều khoản</strong> chưa được giải trình hoặc chưa đánh dấu đã sửa. Bạn vẫn có thể nộp tiếp nếu các nội dung này đã được thống nhất trực tiếp.
              </span>
            </div>
          </div>
        )}

        {/* Word File Upload Area */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Tệp tin văn bản Word sửa đổi mới (.docx) <span className="text-rose-500">*</span>
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
          />

          {!selectedFile ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40 group"
            >
              <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 inline-flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Nhấp để chọn tệp Word (.docx) hoặc kéo thả vào đây
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Tối đa 25MB • Định dạng Microsoft Word OpenXML
              </p>
            </button>
          ) : (
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1 rounded-md text-slate-400 hover:text-rose-500 transition-colors"
                title="Chọn lại tệp khác"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Change Summary Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Tóm tắt các điểm đã chỉnh sửa trong bản này <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={2}
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            placeholder="Ví dụ: Đã sửa thời hạn thanh toán thành 30 ngày, điều chỉnh mức phạt vi phạm về 8%..."
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Negotiation Notes Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Ghi chú đàm phán với đối tác (tùy chọn)
          </label>
          <textarea
            rows={2}
            value={negoNotes}
            onChange={(e) => setNegoNotes(e.target.value)}
            placeholder="Ghi chú thêm về các thỏa thuận phụ, biên bản thương thảo đính kèm..."
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} disabled={isUploading} type="button">
            Hủy
          </Button>
          <Button variant="primary" isLoading={isUploading} type="submit">
            Nộp Thẩm Định Lại
          </Button>
        </div>
      </form>
    </Modal>
  );
}
