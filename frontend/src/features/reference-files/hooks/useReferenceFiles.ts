/**
 * Feature: Reference Files & Attachments
 * Hook: useReferenceFiles.ts — Realtime listener, upload progress, and RBAC deletion
 */

import { useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '@/shared';
import type { ReferenceFileDocument } from '../types';
import {
  MAX_REF_FILE_SIZE_BYTES,
  MAX_REF_FILES_PER_CONTRACT,
  formatFileSize,
} from '../types';
import {
  subscribeToReferenceFiles,
  uploadReferenceFile,
  deleteReferenceFile,
  getReferenceFileViewUrl,
} from '../services/refFileService';

export interface UseReferenceFilesProps {
  contractId: string;
  currentUser?: AuthUser | null;
}

export interface UseReferenceFilesReturn {
  files: ReferenceFileDocument[];
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number | null;
  uploadStatusText?: string | null;
  error: string | null;
  totalCount: number;
  canDelete: (file: ReferenceFileDocument) => boolean;
  uploadFile: (file: File) => Promise<boolean>;
  uploadFiles: (files: File[]) => Promise<boolean>;
  openFileInNewTab: (file: ReferenceFileDocument) => Promise<boolean>;
  deleteFile: (file: ReferenceFileDocument) => Promise<boolean>;
}

/**
 * Validates file count and file size limits before uploading
 */
export function validateFilesForUpload(
  newFiles: File[],
  currentCount: number
): { valid: boolean; error?: string } {
  if (newFiles.length === 0) {
    return { valid: true };
  }
  if (currentCount + newFiles.length > MAX_REF_FILES_PER_CONTRACT) {
    const remaining = Math.max(0, MAX_REF_FILES_PER_CONTRACT - currentCount);
    return {
      valid: false,
      error: `Hồ sơ đã có ${currentCount}/${MAX_REF_FILES_PER_CONTRACT} tệp. Bạn chỉ có thể tải thêm tối đa ${remaining} tệp nữa.`,
    };
  }
  const oversized = newFiles.find((f) => f.size > MAX_REF_FILE_SIZE_BYTES);
  if (oversized) {
    return {
      valid: false,
      error: `Tệp "${oversized.name}" (${formatFileSize(oversized.size)}) vượt quá dung lượng tối đa 5MB. Vui lòng chọn tệp nhỏ hơn 5MB.`,
    };
  }
  return { valid: true };
}

export function useReferenceFiles({
  contractId,
  currentUser,
}: UseReferenceFilesProps): UseReferenceFilesReturn {
  const [files, setFiles] = useState<ReferenceFileDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contractId) return;

    setIsLoading(true);
    setError(null);

    const unsub = subscribeToReferenceFiles(
      contractId,
      (list) => {
        setFiles(list);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message || 'Không thể đồng bộ danh sách tệp đính kèm');
        setIsLoading(false);
      }
    );

    return () => {
      unsub();
    };
  }, [contractId]);

  const canDelete = useCallback(
    (file: ReferenceFileDocument): boolean => {
      if (!currentUser) return false;
      return currentUser.uid === file.uploadedBy.uid || currentUser.role === 'HOL';
    },
    [currentUser]
  );

  const uploadFiles = useCallback(
    async (selectedFiles: File[]): Promise<boolean> => {
      if (!currentUser) {
        setError('Yêu cầu đăng nhập trước khi đính kèm tệp.');
        return false;
      }
      const validation = validateFilesForUpload(selectedFiles, files.length);
      if (!validation.valid) {
        setError(validation.error || 'Tệp không hợp lệ.');
        return false;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      const userMeta = {
        uid: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email || 'Người dùng',
      };

      try {
        const total = selectedFiles.length;
        for (let i = 0; i < total; i++) {
          const file = selectedFiles[i];
          setUploadStatusText(`Đang tải lên (${i + 1}/${total}): ${file.name}`);
          await uploadReferenceFile(contractId, file, userMeta, (pct) => {
            const overallPct = Math.round(((i + pct / 100) / total) * 100);
            setUploadProgress(overallPct);
          });
        }
        setUploadProgress(100);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Tải lên tệp thất bại';
        setError(msg);
        return false;
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
        setUploadStatusText(null);
      }
    },
    [contractId, currentUser, files.length]
  );

  const uploadFile = useCallback(
    async (file: File): Promise<boolean> => {
      return uploadFiles([file]);
    },
    [uploadFiles]
  );

  const openFileInNewTab = useCallback(
    async (file: ReferenceFileDocument): Promise<boolean> => {
      const newTab = window.open('about:blank', '_blank');
      try {
        const url = await getReferenceFileViewUrl(
          contractId,
          file.storagePath,
          file.mimeType,
          file.fileName
        );
        if (newTab) {
          newTab.location.href = url;
        }
        return true;
      } catch (err) {
        if (newTab) {
          newTab.close();
        }
        const msg = err instanceof Error ? err.message : 'Không thể mở tệp xem trước';
        setError(msg);
        return false;
      }
    },
    [contractId]
  );

  const deleteFile = useCallback(
    async (file: ReferenceFileDocument): Promise<boolean> => {
      if (!canDelete(file)) {
        setError('Bạn không có quyền xóa tệp đính kèm này.');
        return false;
      }

      try {
        await deleteReferenceFile(contractId, file.fileId, file.storagePath);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Xóa tệp thất bại';
        setError(msg);
        return false;
      }
    },
    [canDelete, contractId]
  );

  return {
    files,
    isLoading,
    isUploading,
    uploadProgress,
    uploadStatusText,
    error,
    totalCount: files.length,
    canDelete,
    uploadFile,
    uploadFiles,
    openFileInNewTab,
    deleteFile,
  };
}
