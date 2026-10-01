/**
 * Feature: Document Viewer
 * Component: UploadVersionModal.tsx — Dialog for authorized roles to upload a new Word (.docx) version
 * while keeping the current contract stage intact.
 */

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, Info } from 'lucide-react';
import { Modal, Button, formatFileSize, STATUS_CONFIG } from '@/shared';
import type { AuthUser, ContractDocument } from '@/shared';
import { uploadRevisionDocx } from '@/features/review-tasks';

export interface UploadVersionModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly contract: ContractDocument;
  readonly currentUser: AuthUser;
  readonly onUploaded: (newVersionNo: number) => void;
}

export function UploadVersionModal({
  isOpen,
  onClose,
  contract,
  currentUser,
  onUploaded,
}: UploadVersionModalProps): React.ReactElement {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [changeSummary, setChangeSummary] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentVersionNo = contract.currentVersion || 1;
  const nextVersionNo = currentVersionNo + 1;
  const statusConfig = STATUS_CONFIG[contract.status];

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
      setErrorMessage('Vui lòng chọn tệp Word (.docx) phiên bản mới.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const summary = changeSummary.trim() || `Tải lên phiên bản mới v${nextVersionNo}`;

      await uploadRevisionDocx(
        contract.contractId,
        currentUser,
        selectedFile,
        nextVersionNo,
        summary
      );

      onUploaded(nextVersionNo);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải lên phiên bản mới.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tải Lên Phiên Bản Mới (v${nextVersionNo})`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-900/50">
            {errorMessage}
          </div>
        )}

        {/* Stage preservation banner */}
        <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Giữ nguyên trạng thái: {statusConfig?.label || contract.status}
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Tệp Word tải lên sẽ được ghi nhận thành phiên bản <strong>v{nextVersionNo}</strong>. Trạng thái và quy trình xét duyệt của hợp đồng sẽ được giữ nguyên.
            </p>
          </div>
        </div>

        {/* Word File Upload Area */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Tệp tin văn bản Word (.docx) mới <span className="text-rose-500">*</span>
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

        {/* Change Summary Field (Optional) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Mô tả điểm thay đổi của bản v{nextVersionNo} (tùy chọn)
          </label>
          <textarea
            rows={2}
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            placeholder="Ví dụ: Cập nhật điều khoản thanh toán, bổ sung phụ lục giá mới..."
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} disabled={isUploading} type="button">
            Hủy
          </Button>
          <Button variant="primary" isLoading={isUploading} type="submit">
            Tải Lên Phiên Bản (v{nextVersionNo})
          </Button>
        </div>
      </form>
    </Modal>
  );
}
