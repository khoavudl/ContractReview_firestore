/**
 * Feature: Comments & Discussion Thread
 * Component: CommentItem.tsx — Single Discussion Comment Card
 */

import React from 'react';
import { formatDate } from '@/shared';
import type { CommentDocument } from '../types';
import { COMMENT_TYPE_CONFIG } from '../types';

export interface CommentItemProps {
  comment: CommentDocument;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const typeCfg = COMMENT_TYPE_CONFIG[comment.type] || COMMENT_TYPE_CONFIG.USER_RESPONSE;
  const initials = comment.author.displayName
    ? comment.author.displayName.slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="p-3 bg-white dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-left">
      {/* Header: Author, Role Badge, Version & Date */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Avatar Initials */}
          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {initials}
          </div>

          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {comment.author.displayName}
          </span>

          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeCfg.badgeClass}`}
          >
            {typeCfg.label}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
            v{comment.versionNo}
          </span>
          <span>{formatDate(comment.createdAt)}</span>
        </div>
      </div>

      {/* Comment Body */}
      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
        {comment.commentText}
      </p>
    </div>
  );
};
