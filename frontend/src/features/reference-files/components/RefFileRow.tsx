/**
 * Feature: Reference Files & Attachments
 * Component: RefFileRow.tsx — Single File Row with Icons, Meta and Actions
 */

import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  File,
  Download,
  Trash2,
} from 'lucide-react';
import { formatDate } from '@/shared';
import type { ReferenceFileDocument, FileCategory } from '../types';
import { getFileCategory, formatFileSize } from '../types';

export interface RefFileRowProps {
  file: ReferenceFileDocument;
  canDelete: boolean;
  onDelete: (file: ReferenceFileDocument) => Promise<boolean>;
}

const CATEGORY_ICON_MAP: Record<FileCategory, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
  doc: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  sheet: <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
  image: <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
  archive: <FileArchive className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
  other: <File className="w-5 h-5 text-slate-500" />,
};

export const RefFileRow: React.FC<RefFileRowProps> = ({
  file,
  canDelete,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const category = getFileCategory(file.mimeType, file.fileName);

  const handleDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tệp "${file.fileName}" không?`)) {
      return;
    }
    setIsDeleting(true);
    await onDelete(file);
    setIsDeleting(false);
  };

  const handleDownload = () => {
    // In dev / mock, create dummy text file blob download
    const blob = new Blob([`Tài liệu tham chiếu đính kèm: ${file.fileName}`], {
      type: file.mimeType,
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 bg-white dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 text-left">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-md flex-shrink-0">
          {CATEGORY_ICON_MAP[category]}
        </div>

        <div className="min-w-0 space-y-0.5">
          <p
            className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate"
            title={file.fileName}
          >
            {file.fileName}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
            <span>{formatFileSize(file.fileSize)}</span>
            <span>•</span>
            <span>Bởi {file.uploadedBy.displayName}</span>
            <span>•</span>
            <span>{formatDate(file.uploadedAt)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={handleDownload}
          title="Tải tệp xuống"
          className="p-1.5 rounded text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Xóa tệp đính kèm"
            className="p-1.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-pulse' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};
