/**
 * Feature: Reference Files & Attachments
 * Component: UploadRefDropzone.tsx — Drag and Drop Attachment Upload Area
 */

import React, { useRef, useState } from 'react';
import { UploadCloud, FileUp, AlertCircle } from 'lucide-react';
import {
  MAX_REF_FILE_SIZE_BYTES,
  MAX_REF_FILES_PER_CONTRACT,
  formatFileSize,
} from '../types';

export interface UploadRefDropzoneProps {
  isUploading: boolean;
  uploadProgress: number | null;
  uploadStatusText?: string | null;
  currentFileCount?: number;
  maxFiles?: number;
  onUpload?: (file: File) => Promise<boolean>;
  onUploadFiles?: (files: File[]) => Promise<boolean>;
}

export const UploadRefDropzone: React.FC<UploadRefDropzoneProps> = ({
  isUploading,
  uploadProgress,
  uploadStatusText,
  currentFileCount = 0,
  maxFiles = MAX_REF_FILES_PER_CONTRACT,
  onUpload,
  onUploadFiles,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFull = currentFileCount >= maxFiles;

  const validateIncomingFiles = (incoming: File[]): boolean => {
    setSizeError(null);
    if (incoming.length === 0) return false;

    if (currentFileCount + incoming.length > maxFiles) {
      const remaining = Math.max(0, maxFiles - currentFileCount);
      setSizeError(
        `Hồ sơ đã có ${currentFileCount}/${maxFiles} tệp. Bạn chỉ có thể tải thêm tối đa ${remaining} tệp nữa.`
      );
      return false;
    }

    const oversized = incoming.find((f) => f.size > MAX_REF_FILE_SIZE_BYTES);
    if (oversized) {
      setSizeError(
        `Tệp "${oversized.name}" (${formatFileSize(oversized.size)}) vượt quá dung lượng tối đa 5MB. Vui lòng chọn tệp ≤ 5MB.`
      );
      return false;
    }

    return true;
  };

  const processFiles = async (files: File[]) => {
    if (!validateIncomingFiles(files)) return;

    if (onUploadFiles) {
      await onUploadFiles(files);
    } else if (onUpload) {
      for (const file of files) {
        await onUpload(file);
      }
    }

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploading && !isFull) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isUploading || isFull) return;

    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) {
      await processFiles(dropped);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    if (selected.length > 0) {
      await processFiles(selected);
    }
  };

  const handleClick = () => {
    if (!isUploading && !isFull) {
      inputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2 text-left">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`p-4 border-2 border-dashed rounded-lg text-center transition-colors ${
          isFull
            ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed opacity-80'
            : isDragOver
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 cursor-pointer'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer'
        } ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          disabled={isUploading || isFull}
          onChange={handleFileInput}
        />

        <div className="flex flex-col items-center justify-center space-y-1">
          {isFull ? (
            <AlertCircle className="w-6 h-6 text-amber-500" />
          ) : isUploading ? (
            <FileUp className="w-6 h-6 text-brand-600 animate-bounce" />
          ) : (
            <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-brand-600" />
          )}

          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {isFull
              ? `Đã đạt giới hạn tối đa ${maxFiles} tệp đính kèm`
              : isUploading
              ? uploadStatusText || `Đang tải lên... ${uploadProgress ?? 0}%`
              : 'Kéo thả tệp vào đây hoặc nhấn để chọn'}
          </p>

          <p className="text-[10px] text-slate-400">
            {isFull
              ? 'Xóa bớt tệp nếu muốn đính kèm thêm tài liệu mới'
              : `Hỗ trợ chọn nhiều tệp • Tối đa ${maxFiles} tệp/hồ sơ (≤ 5MB/tệp)`}
          </p>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && typeof uploadProgress === 'number' && (
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-brand-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {sizeError && (
        <p className="text-[11px] text-rose-600 dark:text-rose-400 px-1 font-medium">
          {sizeError}
        </p>
      )}
    </div>
  );
};
