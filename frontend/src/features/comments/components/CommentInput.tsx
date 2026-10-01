/**
 * Feature: Comments & Discussion Thread
 * Component: CommentInput.tsx — Comment Input with Clause Reference & Shortcuts
 */

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/shared';

export interface CommentInputProps {
  isSubmitting: boolean;
  onSubmit: (payload: { commentText: string }) => Promise<boolean>;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  isSubmitting,
  onSubmit,
}) => {
  const [commentText, setCommentText] = useState('');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() || commentText.length > 1000 || isSubmitting) return;

    const success = await onSubmit({
      commentText: commentText.trim(),
    });

    if (success) {
      setCommentText('');
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
      {/* Main Textarea */}
      <div className="relative">
        <textarea
          rows={3}
          maxLength={1000}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Viết ý kiến trao đổi, giải trình hoặc thảo luận pháp lý... (Ctrl + Enter để gửi)"
          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-850 transition-all resize-none"
        />
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400">Ctrl + Enter để gửi</span>

        <div className="flex items-center gap-3">
          <span className={`text-[10px] ${commentText.length >= 900 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
            {commentText.length}/1000
          </span>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!commentText.trim() || commentText.length > 1000 || isSubmitting}
            isLoading={isSubmitting}
            className="text-xs h-7.5 px-3 gap-1.5"
          >
            <Send className="w-3 h-3" />
            <span>Gửi ý kiến</span>
          </Button>
        </div>
      </div>
    </form>
  );
};
