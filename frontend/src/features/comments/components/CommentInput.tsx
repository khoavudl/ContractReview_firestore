/**
 * Feature: Comments & Discussion Thread
 * Component: CommentInput.tsx — Comment Input with Clause Reference & Shortcuts
 */

import React, { useState } from 'react';
import { Send, Tag } from 'lucide-react';
import { Button } from '@/shared';

export interface CommentInputProps {
  isSubmitting: boolean;
  onSubmit: (payload: { clauseRef?: string; commentText: string }) => Promise<boolean>;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  isSubmitting,
  onSubmit,
}) => {
  const [commentText, setCommentText] = useState('');
  const [clauseRef, setClauseRef] = useState('');
  const [showClauseInput, setShowClauseInput] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    const success = await onSubmit({
      clauseRef: clauseRef.trim() || undefined,
      commentText: commentText.trim(),
    });

    if (success) {
      setCommentText('');
      setClauseRef('');
      setShowClauseInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-white dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 space-y-2 text-left"
    >
      {/* Optional Clause Reference Field */}
      {showClauseInput && (
        <div className="flex items-center gap-1.5 animate-fadeIn">
          <Tag className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          <input
            type="text"
            value={clauseRef}
            onChange={(e) => setClauseRef(e.target.value)}
            placeholder="Điều khoản tham chiếu (VD: Điều 4.2 - Thời hạn thanh toán)..."
            className="flex-1 text-xs px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-brand-500"
          />
          <button
            type="button"
            onClick={() => {
              setClauseRef('');
              setShowClauseInput(false);
            }}
            className="text-[11px] text-slate-400 hover:text-slate-600 px-1.5"
          >
            Hủy
          </button>
        </div>
      )}

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          rows={3}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Viết ý kiến trao đổi, giải trình hoặc thảo luận pháp lý... (Ctrl + Enter để gửi)"
          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-850 transition-all resize-none"
        />
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between">
        {!showClauseInput ? (
          <button
            type="button"
            onClick={() => setShowClauseInput(true)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-colors"
          >
            <Tag className="w-3 h-3" />
            <span>+ Gắn điều khoản tham chiếu</span>
          </button>
        ) : (
          <span className="text-[10px] text-slate-400">Ctrl + Enter để gửi</span>
        )}

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!commentText.trim() || isSubmitting}
          isLoading={isSubmitting}
          className="text-xs h-7.5 px-3 gap-1.5"
        >
          <Send className="w-3 h-3" />
          <span>Gửi ý kiến</span>
        </Button>
      </div>
    </form>
  );
};
