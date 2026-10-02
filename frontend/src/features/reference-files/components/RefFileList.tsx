/**
 * Feature: Reference Files & Attachments
 * Component: RefFileList.tsx — Master Reference Files Tab 4 Container
 */

import React from 'react';
import { Paperclip, Files } from 'lucide-react';
import type { AuthUser, ContractStatus } from '@/shared';
import { useReferenceFiles } from '../hooks/useReferenceFiles';
import { UploadRefDropzone } from './UploadRefDropzone';
import { RefFileRow } from './RefFileRow';

export interface RefFileListProps {
  contractId: string;
  currentUser?: AuthUser | null;
  contractStatus?: ContractStatus;
  createdByUid?: string;
  isOwner?: boolean;
}

export function canUploadRefFiles(
  contractStatus?: ContractStatus,
  user?: AuthUser | null,
  isOwner = true
): boolean {
  if (!user || !contractStatus) return true;
  if (contractStatus === 'HOL_APPROVED' || contractStatus === 'COMPLETED') {
    return false;
  }
  if (
    contractStatus === 'DRAFT' ||
    contractStatus === 'USER_REVISING' ||
    contractStatus === 'LEGAL_COMMENTED' ||
    contractStatus === 'HOL_COMMENTED'
  ) {
    return user.role === 'USER' && isOwner;
  }
  if (contractStatus === 'PENDING_LEGAL') {
    return user.role === 'LEGAL';
  }
  if (contractStatus === 'PENDING_HOL') {
    return user.role === 'HOL';
  }
  return false;
}

export const RefFileList: React.FC<RefFileListProps> = ({
  contractId,
  currentUser,
  contractStatus,
  createdByUid,
  isOwner: isOwnerProp,
}) => {
  const {
    files,
    isLoading,
    isUploading,
    uploadProgress,
    uploadStatusText,
    error,
    totalCount,
    canDelete,
    uploadFile,
    uploadFiles,
    openFileInNewTab,
    deleteFile,
  } = useReferenceFiles({
    contractId,
    currentUser,
  });

  const isOwner = isOwnerProp ?? (createdByUid ? currentUser?.uid === createdByUid : currentUser?.role === 'USER');
  const isApproved = contractStatus === 'HOL_APPROVED' || contractStatus === 'COMPLETED';
  const canUpload = canUploadRefFiles(contractStatus, currentUser, isOwner);

  const statusSubtitle = isApproved
    ? 'Hồ sơ đã duyệt (Chỉ xem)'
    : !canUpload
    ? 'Chỉ vai trò phụ trách giai đoạn này mới được tải lên'
    : `${totalCount}/10 tệp • Tối đa 5MB/tệp`;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden text-left bg-slate-50/50 dark:bg-slate-900">
      {/* Header bar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Tài liệu tham chiếu đính kèm ({totalCount})
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          {statusSubtitle}
        </span>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 text-xs text-rose-700 dark:text-rose-300 px-4">
          {error}
        </div>
      )}

      {/* Main content scroll area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Upload dropzone (visible only to active role of current stage) */}
        {canUpload && (
          <UploadRefDropzone
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            uploadStatusText={uploadStatusText}
            currentFileCount={files.length}
            maxFiles={10}
            onUpload={uploadFile}
            onUploadFiles={uploadFiles}
          />
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="text-center py-8 space-y-2 text-slate-400">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Đang tải danh sách tài liệu...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && files.length === 0 && (
          <div className="text-center py-10 space-y-2 text-slate-400">
            <Files className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Chưa có tài liệu tham chiếu nào được đính kèm.
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Đính kèm báo giá, đăng ký kinh doanh, phụ lục SLA kỹ thuật hoặc biên bản làm việc để các bên cùng đối chiếu.
            </p>
          </div>
        )}

        {/* Files list */}
        {!isLoading && files.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Danh sách tệp tin ({files.length})
            </h5>
            <div className="space-y-2">
              {files.map((file) => (
                <RefFileRow
                  key={file.fileId}
                  file={file}
                  canDelete={canUpload && canDelete(file)}
                  onDelete={deleteFile}
                  onOpen={openFileInNewTab}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
