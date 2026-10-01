/**
 * Feature: Comments & Discussion Thread
 * Component: CommentThread.tsx — Master Realtime Discussion Container
 */

import React, { useRef, useEffect } from 'react';
import { MessageSquare, MessagesSquare, Lock } from 'lucide-react';
import type { AuthUser, ContractStatus } from '@/shared';
import { useComments } from '../hooks/useComments';
import { CommentItem } from './CommentItem';
import { CommentInput } from './CommentInput';

export interface CommentThreadProps {
  contractId: string;
  versionNo: number;
  currentUser?: AuthUser | null;
  contractStatus?: ContractStatus;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  contractId,
  versionNo,
  currentUser,
  contractStatus,
}) => {
  const {
    filteredComments,
    isLoading,
    isSubmitting,
    error,
    totalCount,
    submitComment,
  } = useComments({
    contractId,
    currentVersion: versionNo,
    currentUser,
  });

  const scrollBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new comments
  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [filteredComments.length]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden text-left bg-slate-50/50 dark:bg-slate-900">
      {/* Header bar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Trao đổi trực tiếp ({totalCount})
          </span>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-2 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 text-xs text-rose-700 dark:text-rose-300 px-4">
          {error}
        </div>
      )}

      {/* Message List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <div className="text-center py-10 space-y-2 text-slate-400">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Đang tải lịch sử trao đổi...</p>
          </div>
        )}

        {!isLoading && filteredComments.length === 0 && (
          <div className="text-center py-12 space-y-2 text-slate-400">
            <MessagesSquare className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Chưa có ý kiến trao đổi nào cho hồ sơ này.
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Hãy để lại câu hỏi, giải trình hoặc đề xuất pháp lý đầu tiên bên dưới.
            </p>
          </div>
        )}

        {!isLoading &&
          filteredComments.map((comment) => (
            <CommentItem key={comment.commentId} comment={comment} />
          ))}

        <div ref={scrollBottomRef} />
      </div>

      {/* Bottom Input Area or Approved Notice */}
      {contractStatus === 'HOL_APPROVED' || contractStatus === 'COMPLETED' ? (
        <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 text-xs text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Hồ sơ đã được phê duyệt chính thức. Đóng luồng gửi trao đổi mới.</span>
        </div>
      ) : (
        <CommentInput
          isSubmitting={isSubmitting}
          onSubmit={submitComment}
        />
      )}
    </div>
  );
};
