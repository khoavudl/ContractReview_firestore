/**
 * Feature: Comments & Discussion Thread
 * Component: CommentItem.tsx — Multi-directional Discussion & Activity Timeline Cards
 * - Left: User (Author/Requester, including Version Upload)
 * - Right: Staff (Legal & Head of Legal, including Version Upload)
 * - Center: System Status Notification (Minimalist pill)
 */

import React from 'react';
import { formatRelativeTime, formatDateTime } from '@/shared';
import type { CommentDocument } from '../types';

export interface CommentItemProps {
  comment: CommentDocument;
}

/**
 * Centered System Status Notification: Minimalist pill/card
 * - Line 1: Đã chuyển sang trạng thái "..."
 * - Line 2: x phút trước
 * - Extra: Lý do nếu có input từ người dùng
 */
const SystemStatusNotification: React.FC<{ comment: CommentDocument }> = ({ comment }) => {
  const fullTime = formatDateTime(comment.createdAt);
  const relTime = formatRelativeTime(comment.createdAt);
  const statusName = comment.statusLabel || comment.commentText;
  const reasonText = comment.rejectReason || comment.changeSummary;

  return (
    <div className="w-full flex justify-center my-2">
      <div className="max-w-md bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 rounded-xl px-4 py-2 text-center shadow-2xs backdrop-blur-xs space-y-0.5">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
          Đã chuyển sang trạng thái &quot;{statusName}&quot;
        </p>
        <p className="text-[11px] text-slate-400" title={fullTime}>
          {relTime}
        </p>
        {reasonText && (
          <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 mt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-left">
            • <strong className="text-slate-700 dark:text-slate-200">Lý do:</strong> {reasonText}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Left-aligned Card: User (Requester / Creator, including version upload)
 */
const UserBubble: React.FC<{ comment: CommentDocument }> = ({ comment }) => {
  const fullTime = formatDateTime(comment.createdAt);
  const relTime = formatRelativeTime(comment.createdAt);
  const isVersionUpload = comment.type === 'SYSTEM_VERSION_UPLOAD';

  return (
    <div className="w-full flex justify-start my-1">
      <div className="max-w-[85%] sm:max-w-[78%] bg-white dark:bg-slate-850 rounded-2xl rounded-tl-xs border-l-4 border-l-purple-500 border-t border-r border-b border-slate-200 dark:border-slate-800 p-3.5 shadow-2xs space-y-2 text-left">
        {/* Header */}
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-purple-700 dark:text-purple-400">
            {comment.author.displayName}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400" title={fullTime}>
              {relTime}
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-medium">
              v{comment.versionNo}
            </span>
          </div>
        </div>

        {/* Body */}
        {isVersionUpload ? (
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Tải lên phiên bản v{comment.versionNo}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              • <strong className="text-slate-700 dark:text-slate-200">Tóm tắt thay đổi:</strong>{' '}
              {comment.changeSummary || 'Không có mô tả thay đổi'}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
            {comment.commentText}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Right-aligned Card: Legal & Head of Legal (Reviewers, including version upload)
 */
const StaffBubble: React.FC<{ comment: CommentDocument }> = ({ comment }) => {
  const fullTime = formatDateTime(comment.createdAt);
  const relTime = formatRelativeTime(comment.createdAt);
  const isVersionUpload = comment.type === 'SYSTEM_VERSION_UPLOAD';

  return (
    <div className="w-full flex justify-end my-1">
      <div className="max-w-[85%] sm:max-w-[78%] bg-white dark:bg-slate-850 rounded-2xl rounded-tr-xs border-r-4 border-r-blue-600 border-t border-l border-b border-slate-200 dark:border-slate-800 p-3.5 shadow-2xs space-y-2 text-left">
        {/* Header */}
        <div className="space-y-0.5 text-right">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
            {comment.author.displayName}
          </p>
          <div className="flex items-center justify-end gap-2">
            <span className="px-1.5 py-0.2 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-medium">
              v{comment.versionNo}
            </span>
            <span className="text-[11px] text-slate-400" title={fullTime}>
              {relTime}
            </span>
          </div>
        </div>

        {/* Body */}
        {isVersionUpload ? (
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Tải lên phiên bản v{comment.versionNo}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              • <strong className="text-slate-700 dark:text-slate-200">Tóm tắt thay đổi:</strong>{' '}
              {comment.changeSummary || 'Không có mô tả thay đổi'}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
            {comment.commentText}
          </p>
        )}
      </div>
    </div>
  );
};

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  if (comment.type === 'SYSTEM_STATUS_CHANGE') {
    return <SystemStatusNotification comment={comment} />;
  }

  if (comment.author.role === 'LEGAL' || comment.author.role === 'HOL') {
    return <StaffBubble comment={comment} />;
  }

  return <UserBubble comment={comment} />;
};
