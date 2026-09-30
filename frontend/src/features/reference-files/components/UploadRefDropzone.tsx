/**
 * Feature: Reference Files & Attachments
 * Component: UploadRefDropzone.tsx — Drag and Drop Attachment Upload Area
 */

import React, { useRef, useState } from 'react';
import { UploadCloud, FileUp } from 'lucide-react';

export interface UploadRefDropzoneProps {
  isUploading: boolean;
  uploadProgress: number | null;
  onUpload: (file: File) => Promise<boolean>;
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const UploadRefDropzone: React.FC<UploadRefDropzoneProps> = ({
  isUploading,
  uploadProgress,
  onUpload,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setSizeError(null);
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSizeError('Kích thước tệp vượt quá giới hạn tối đa 25MB.');
      return;
    }
    await onUpload(file);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }
  };

  return (
    <div className="space-y-2 text-left">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80'
        } ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          disabled={isUploading}
          onChange={handleFileInput}
        />

        <div className="flex flex-col items-center justify-center space-y-1">
          {isUploading ? (
            <FileUp className="w-6 h-6 text-brand-600 animate-bounce" />
          ) : (
            <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-brand-600" />
          )}

          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {isUploading
              ? `Đang tải lên... ${uploadProgress ?? 0}%`
              : 'Kéo thả tệp vào đây hoặc nhấn để chọn'}
          </p>

          <p className="text-[10px] text-slate-400">
            Hỗ trợ PDF, DOCX, XLSX, Ảnh, ZIP (Tối đa 25MB)
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
