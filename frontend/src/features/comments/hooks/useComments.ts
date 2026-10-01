/**
 * Feature: Comments & Discussion Thread
 * Hook: useComments.ts — Realtime sync, version filtering & comment posting state
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AuthUser } from '@/shared';
import type { CommentDocument, CreateCommentPayload } from '../types';
import { subscribeToComments, addComment } from '../services/commentService';

export interface UseCommentsProps {
  contractId: string;
  currentVersion?: number;
  currentUser?: AuthUser | null;
}

export interface UseCommentsReturn {
  comments: CommentDocument[];
  filteredComments: CommentDocument[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  filterVersion: number | 'ALL';
  setFilterVersion: (version: number | 'ALL') => void;
  totalCount: number;
  submitComment: (payload: { commentText: string }) => Promise<boolean>;
}

export function useComments({
  contractId,
  currentVersion = 1,
  currentUser,
}: UseCommentsProps): UseCommentsReturn {
  const [comments, setComments] = useState<CommentDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterVersion, setFilterVersion] = useState<number | 'ALL'>('ALL');

  useEffect(() => {
    if (!contractId) return;

    setIsLoading(true);
    setError(null);

    const unsub = subscribeToComments(
      contractId,
      (list) => {
        setComments(list);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message || 'Không thể đồng bộ danh sách bình luận');
        setIsLoading(false);
      }
    );

    return () => {
      unsub();
    };
  }, [contractId]);

  const filteredComments = useMemo(() => {
    if (filterVersion === 'ALL') {
      return comments;
    }
    return comments.filter((c) => c.versionNo === filterVersion);
  }, [comments, filterVersion]);

  const submitComment = useCallback(
    async (payload: { commentText: string }): Promise<boolean> => {
      if (!currentUser) {
        setError('Yêu cầu đăng nhập trước khi gửi bình luận.');
        return false;
      }

      if (!payload.commentText.trim()) {
        return false;
      }

      if (payload.commentText.trim().length > 1000) {
        setError('Ý kiến trao đổi không được vượt quá 1000 ký tự.');
        return false;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const fullPayload: CreateCommentPayload = {
          versionNo: typeof filterVersion === 'number' ? filterVersion : currentVersion,
          commentText: payload.commentText,
        };

        await addComment(contractId, fullPayload, {
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email || 'Người dùng',
          email: currentUser.email,
          role: currentUser.role,
        });

        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Lỗi khi gửi bình luận';
        setError(msg);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [contractId, currentVersion, currentUser, filterVersion]
  );

  return {
    comments,
    filteredComments,
    isLoading,
    isSubmitting,
    error,
    filterVersion,
    setFilterVersion,
    totalCount: comments.length,
    submitComment,
  };
}
