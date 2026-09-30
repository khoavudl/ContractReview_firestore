/**
 * Feature: Reference Files & Attachments
 * Hook: useReferenceFiles.ts — Realtime listener, upload progress, and RBAC deletion
 */

import { useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '@/shared';
import type { ReferenceFileDocument } from '../types';
import {
  subscribeToReferenceFiles,
  uploadReferenceFile,
  deleteReferenceFile,
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
  error: string | null;
  totalCount: number;
  canDelete: (file: ReferenceFileDocument) => boolean;
  uploadFile: (file: File) => Promise<boolean>;
  deleteFile: (file: ReferenceFileDocument) => Promise<boolean>;
}

export function useReferenceFiles({
  contractId,
  currentUser,
}: UseReferenceFilesProps): UseReferenceFilesReturn {
  const [files, setFiles] = useState<ReferenceFileDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
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

  const uploadFile = useCallback(
    async (file: File): Promise<boolean> => {
      if (!currentUser) {
        setError('Yêu cầu đăng nhập trước khi đính kèm tệp.');
        return false;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        await uploadReferenceFile(
          contractId,
          file,
          {
            uid: currentUser.uid,
            displayName: currentUser.displayName || currentUser.email || 'Người dùng',
          },
          (pct) => setUploadProgress(pct)
        );
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Tải lên tệp thất bại';
        setError(msg);
        return false;
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    },
    [contractId, currentUser]
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
    error,
    totalCount: files.length,
    canDelete,
    uploadFile,
    deleteFile,
  };
}
