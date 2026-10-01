/**
 * Feature: Comments & Discussion Thread
 * Component: CommentItem.tsx — Single Discussion Comment Card
 */

import React from 'react';
import { formatDate } from '@/shared';
import type { CommentDocument } from '../types';

export interface CommentItemProps {
  comment: CommentDocument;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  return (
    <div className="p-3 bg-white dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-left">
      {/* Header: Author Display Name, Version & Date */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
          {comment.author.displayName}
        </span>

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
