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

const MAX_ANNEX_FILES = 5;

function normalizeFileName(name: string): string {
  return name.trim().toLowerCase();
}

function validateDocxFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.docx')) {
    return `Tệp "${file.name}" không hợp lệ. Chỉ chấp nhận tệp Word định dạng .docx.`;
  }
  if (file.size > 50 * 1024 * 1024) {
    return `Tệp "${file.name}" vượt quá dung lượng 50MB cho phép.`;
  }
  return null;
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
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [annexFiles, setAnnexFiles] = useState<File[]>([]);
  const [dragOverMain, setDragOverMain] = useState<boolean>(false);
  const [dragOverAnnex, setDragOverAnnex] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const annexInputRef = useRef<HTMLInputElement>(null);

  const handleMainFileSelect = useCallback(
    (incomingFiles: FileList | File[] | null) => {
      setFileError(null);
      if (!incomingFiles || incomingFiles.length === 0) return;

      const fileArray = Array.from(incomingFiles);
      if (fileArray.length > 1) {
        setFileError('Khung Hợp đồng chính chỉ cho phép đính kèm duy nhất 1 tệp (.docx).');
        return;
      }

      const file = fileArray[0];
      const err = validateDocxFile(file);
      if (err) {
        setFileError(err);
        return;
      }

      const targetName = normalizeFileName(file.name);
      if (annexFiles.some((af) => normalizeFileName(af.name) === targetName)) {
        setFileError(
          `Tệp "${file.name}" đã có trong danh sách Phụ lục đính kèm. Vui lòng không chọn các tệp trùng tên.`
        );
        return;
      }

      setMainFile(file);
    },
    [annexFiles]
  );

  const handleAnnexFilesAdd = useCallback(
    (incomingFiles: FileList | File[] | null) => {
      setFileError(null);
      if (!incomingFiles || incomingFiles.length === 0) return;

      const fileArray = Array.from(incomingFiles);
      const validDocxFiles: File[] = [];
      const existingNames = new Set(annexFiles.map((af) => normalizeFileName(af.name)));
      const mainName = mainFile ? normalizeFileName(mainFile.name) : null;

      for (const f of fileArray) {
        const err = validateDocxFile(f);
        if (err) {
          setFileError(err);
          return;
        }
        const normalized = normalizeFileName(f.name);
        if (mainName && normalized === mainName) {
          setFileError(
            `Tệp "${f.name}" trùng tên với Hợp đồng chính. Vui lòng không chọn các tệp trùng tên.`
          );
          return;
        }
        if (existingNames.has(normalized)) {
          setFileError(
            `Tệp phụ lục "${f.name}" đã được đính kèm trước đó. Vui lòng không chọn các tệp trùng tên.`
          );
          return;
        }
        existingNames.add(normalized);
        validDocxFiles.push(f);
      }

      setAnnexFiles((prev) => {
        const combined = [...prev, ...validDocxFiles];
        if (combined.length > MAX_ANNEX_FILES) {
          setFileError(`Chỉ được đính kèm tối đa ${MAX_ANNEX_FILES} phụ lục.`);
          return combined.slice(0, MAX_ANNEX_FILES);
        }
        return combined;
      });
    },
    [annexFiles, mainFile]
  );

  const handleRemoveMainFile = useCallback(() => {
    setMainFile(null);
    setFileError(null);
  }, []);

  const handleRemoveAnnexFile = useCallback((index: number) => {
    setAnnexFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  }, []);

  const resetForm = useCallback(() => {
    setTitle('');
    setSupplier('');
    setDescription('');
    setDepartment(currentUser?.department || '');
    setMainFile(null);
    setAnnexFiles([]);
    setFileError(null);
    clearError();
  }, [currentUser?.department, clearError]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainFile) {
      setFileError('Vui lòng đính kèm tệp Hợp đồng chính (.docx) để tạo hồ sơ.');
      return;
    }

    const contractId = await submitContract({
      title,
      supplier,
      description,
      department,
      companyRole: 'BUYER',
      file: mainFile,
      annexFiles: annexFiles.length > 0 ? annexFiles : undefined,
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
            disabled={isSubmitting || !mainFile}
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

        {/* 2 Hàng Upload Tách Biệt: Hàng 1 Hợp đồng chính (Bắt buộc) & Hàng 2 Phụ lục (Tùy chọn) */}
        <div className="space-y-3.5 pt-1">
          {/* HÀNG 1: HỢP ĐỒNG CHÍNH (Bắt buộc, chỉ 1 file) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                1. Hợp đồng chính <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Bắt buộc • Chỉ 1 tệp .docx
              </span>
            </div>

            <input
              ref={mainInputRef}
              data-testid="main-file-input"
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                handleMainFileSelect(e.target.files);
                if (mainInputRef.current) mainInputRef.current.value = '';
              }}
              className="hidden"
              disabled={isSubmitting}
            />

            {!mainFile ? (
              <div
                data-testid="main-contract-dropzone"
                onClick={() => !isSubmitting && mainInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverMain(true);
                }}
                onDragLeave={() => setDragOverMain(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverMain(false);
                  handleMainFileSelect(e.dataTransfer.files);
                }}
                className={`relative flex flex-col items-center justify-center py-3.5 px-4 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center ${
                  dragOverMain
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <UploadCloud className="w-6 h-6 text-blue-500 dark:text-blue-400 mb-1" />
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Kéo thả hoặc chọn Hợp đồng chính (.docx)
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Chỉ 1 tệp Word (.docx) • Tối đa 50MB
                </div>
              </div>
            ) : (
              <div className="relative group flex items-center justify-between p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20">
                {/* Custom Instant Tooltip on Hover */}
                <div
                  role="tooltip"
                  className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-3 mb-1.5 z-50 max-w-[92%] px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-[11px] font-medium leading-snug shadow-lg break-all"
                >
                  📄 {mainFile.name}
                </div>

                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 shrink-0">
                        ⭐ HĐ Chính
                      </span>
                      <p
                        title={mainFile.name}
                        className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate"
                      >
                        {mainFile.name}
                      </p>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                        ({formatFileSize(mainFile.size)})
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveMainFile}
                  disabled={isSubmitting}
                  title="Xóa Hợp đồng chính"
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* HÀNG 2: PHỤ LỤC ĐÍNH KÈM (Không bắt buộc, 1 hoặc nhiều file) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                2. Phụ lục đính kèm{' '}
                <span className="font-normal text-slate-400 dark:text-slate-500">
                  (Tùy chọn{annexFiles.length > 0 ? ` • ${annexFiles.length}/${MAX_ANNEX_FILES}` : ''})
                </span>
              </label>
              {annexFiles.length > 0 && annexFiles.length < MAX_ANNEX_FILES && (
                <button
                  type="button"
                  onClick={() => annexInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm phụ lục
                </button>
              )}
            </div>

            <input
              ref={annexInputRef}
              data-testid="annex-file-input"
              type="file"
              multiple
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                handleAnnexFilesAdd(e.target.files);
                if (annexInputRef.current) annexInputRef.current.value = '';
              }}
              className="hidden"
              disabled={isSubmitting}
            />

            {annexFiles.length === 0 ? (
              <div
                data-testid="annex-dropzone"
                onClick={() => !isSubmitting && annexInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverAnnex(true);
                }}
                onDragLeave={() => setDragOverAnnex(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverAnnex(false);
                  handleAnnexFilesAdd(e.dataTransfer.files);
                }}
                className={`relative flex flex-col items-center justify-center py-3.5 px-4 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center ${
                  dragOverAnnex
                    ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/30'
                    : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <UploadCloud className="w-6 h-6 text-purple-500 dark:text-purple-400 mb-1" />
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Kéo thả hoặc chọn Phụ lục (nếu có)
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Có thể chọn 1 hoặc nhiều tệp .docx cùng lúc (tối đa {MAX_ANNEX_FILES} phụ lục)
                </div>
              </div>
            ) : (
              <div
                data-testid="annex-dropzone-list"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverAnnex(true);
                }}
                onDragLeave={() => setDragOverAnnex(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverAnnex(false);
                  handleAnnexFilesAdd(e.dataTransfer.files);
                }}
                className={`space-y-1.5 p-2 rounded-xl border transition-all ${
                  dragOverAnnex
                    ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/30'
                    : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                {annexFiles.map((f, idx) => {
                  const annexCode = generateAnnexId(idx + 1);
                  return (
                    <div
                      key={`${f.name}-${idx}`}
                      className="relative group flex items-center justify-between p-2 rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20"
                    >
                      {/* Custom Instant Tooltip on Hover */}
                      <div
                        role="tooltip"
                        className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-3 mb-1.5 z-50 max-w-[92%] px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-[11px] font-medium leading-snug shadow-lg break-all"
                      >
                        📎 {f.name}
                      </div>

                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 shrink-0">
                          📎 {annexCode}
                        </span>
                        <span
                          title={f.name}
                          className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate"
                        >
                          {f.name}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                          ({formatFileSize(f.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAnnexFile(idx)}
                        disabled={isSubmitting}
                        title="Xóa phụ lục này"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {fileError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
            {fileError}
          </p>
        )}
      </form>
    </Modal>
  );
}
