/**
 * Feature: Contracts Management & Dashboard
 * Component: CreateContractModal — Form Modal to Create a New Contract with Multi-document Bundle
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  FilePlus,
  AlertCircle,
  UploadCloud,
  FileText,
  X,
  ArrowUp,
  ArrowDown,
  Plus,
} from 'lucide-react';
import { Modal, Button, Input, formatFileSize } from '@/shared';
import { useAuth } from '@/features/auth';
import { useCreateContract } from '../hooks/useCreateContract';
import { generateAnnexId } from '../utils/annexHelpers';

export interface CreateContractModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: (contractId: string) => void;
}

const MAX_TOTAL_FILES = 6; // 1 Main contract + max 5 annexes

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
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdd = useCallback((incomingFiles: FileList | File[] | null) => {
    setFileError(null);
    if (!incomingFiles || incomingFiles.length === 0) return;

    const fileArray = Array.from(incomingFiles);
    const validDocxFiles: File[] = [];

    for (const f of fileArray) {
      if (!f.name.toLowerCase().endsWith('.docx')) {
        setFileError(`Tệp "${f.name}" không hợp lệ. Chỉ chấp nhận tệp Word định dạng .docx.`);
        return;
      }
      if (f.size > 50 * 1024 * 1024) {
        setFileError(`Tệp "${f.name}" vượt quá dung lượng 50MB cho phép.`);
        return;
      }
      validDocxFiles.push(f);
    }

    setFiles((prev) => {
      const combined = [...prev, ...validDocxFiles];
      if (combined.length > MAX_TOTAL_FILES) {
        setFileError(`Chỉ được đính kèm tối đa 1 hợp đồng chính và 5 phụ lục (${MAX_TOTAL_FILES} tệp).`);
        return combined.slice(0, MAX_TOTAL_FILES);
      }
      return combined;
    });
  }, []);

  const handleMoveFile = useCallback((index: number, direction: 'UP' | 'DOWN') => {
    setFiles((prev) => {
      const targetIndex = direction === 'UP' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  }, []);

  const resetForm = useCallback(() => {
    setTitle('');
    setSupplier('');
    setDescription('');
    setDepartment(currentUser?.department || '');
    setFiles([]);
    setFileError(null);
    clearError();
  }, [currentUser?.department, clearError]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setFileError('Vui lòng đính kèm ít nhất 1 tệp hợp đồng Word (.docx).');
      return;
    }

    const mainFile = files[0];
    const annexList = files.slice(1);

    const contractId = await submitContract({
      title,
      supplier,
      description,
      department,
      companyRole: 'BUYER',
      file: mainFile,
      annexFiles: annexList.length > 0 ? annexList : undefined,
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
            Tạo Hồ Sơ
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
            placeholder="Tóm tắt phạm vi công việc, lưu ý đặc thù..."
            rows={3}
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tài liệu xét duyệt * {files.length > 0 && `(${files.length}/${MAX_TOTAL_FILES} tệp)`}
            </label>
            {files.length > 0 && files.length < MAX_TOTAL_FILES && (
              <button
                type="button"
                onClick={() => addMoreInputRef.current?.click()}
                disabled={isSubmitting}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm tệp
              </button>
            )}
          </div>

          {files.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFilesAdd(e.dataTransfer.files);
              }}
              className={`relative flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                dragOver
                  ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/30'
                  : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  handleFilesAdd(e.target.files);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isSubmitting}
              />
              <UploadCloud className="w-8 h-8 text-brand-500 dark:text-brand-400 mb-2" />
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Kéo thả tệp Word (.docx) vào đây, hoặc click để duyệt tệp
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Có thể chọn cùng lúc HĐ chính & các Phụ lục (tối đa 5 phụ lục) • Định dạng .docx
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                ref={addMoreInputRef}
                type="file"
                multiple
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  handleFilesAdd(e.target.files);
                  if (addMoreInputRef.current) addMoreInputRef.current.value = '';
                }}
                className="hidden"
                disabled={isSubmitting}
              />

              {files.map((f, idx) => {
                const isMain = idx === 0;
                const annexCode = isMain ? null : generateAnnexId(idx);

                return (
                  <div
                    key={`${f.name}-${idx}`}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isMain
                        ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20'
                        : 'border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isMain
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                            : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                              isMain
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                            }`}
                          >
                            {isMain ? '⭐ HĐ Chính' : `📎 ${annexCode}`}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {f.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatFileSize(f.size)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveFile(idx, 'UP')}
                          disabled={isSubmitting}
                          title="Chuyển lên trên"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx < files.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveFile(idx, 'DOWN')}
                          disabled={isSubmitting}
                          title="Chuyển xuống dưới"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        disabled={isSubmitting}
                        title="Xóa tệp này"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
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
