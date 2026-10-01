/**
 * Feature: Comments & Discussion Thread
 * Component: CommentItem.tsx — Multi-directional Discussion & Activity Timeline Cards
 * - Left: User (Author/Requester, including Version Upload & Status Transitions)
 * - Right: Staff (Legal & Head of Legal, including Version Upload & Status Transitions)
 */

import React from 'react';
import { formatRelativeTime, formatDateTime } from '@/shared';
import type { CommentDocument } from '../types';

export interface CommentItemProps {
  comment: CommentDocument;
}

/**
 * Left-aligned Card: User (Requester / Creator, including version upload & status transitions)
 */
const UserBubble: React.FC<{ comment: CommentDocument }> = ({ comment }) => {
  const fullTime = formatDateTime(comment.createdAt);
  const relTime = formatRelativeTime(comment.createdAt);
  const isVersionUpload = comment.type === 'SYSTEM_VERSION_UPLOAD';
  const isStatusChange = comment.type === 'SYSTEM_STATUS_CHANGE';
  const statusName = comment.statusLabel || comment.commentText;
  const noteContent = comment.rejectReason || comment.changeSummary;

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
        {isStatusChange ? (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              Chuyển tới &quot;{comment.statusIcon ? `${comment.statusIcon} ` : ''}{statusName}&quot;
            </p>
            {noteContent && (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                {noteContent}
              </p>
            )}
          </div>
        ) : isVersionUpload ? (
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
 * Right-aligned Card: Legal & Head of Legal (Reviewers, including version upload & status transitions)
 */
const StaffBubble: React.FC<{ comment: CommentDocument }> = ({ comment }) => {
  const fullTime = formatDateTime(comment.createdAt);
  const relTime = formatRelativeTime(comment.createdAt);
  const isVersionUpload = comment.type === 'SYSTEM_VERSION_UPLOAD';
  const isStatusChange = comment.type === 'SYSTEM_STATUS_CHANGE';
  const statusName = comment.statusLabel || comment.commentText;
  const noteContent = comment.rejectReason || comment.changeSummary;

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
        {isStatusChange ? (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              Chuyển tới &quot;{comment.statusIcon ? `${comment.statusIcon} ` : ''}{statusName}&quot;
            </p>
            {noteContent && (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                {noteContent}
              </p>
            )}
          </div>
        ) : isVersionUpload ? (
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
  if (comment.author.role === 'LEGAL' || comment.author.role === 'HOL') {
    return <StaffBubble comment={comment} />;
  }

  return <UserBubble comment={comment} />;
};
