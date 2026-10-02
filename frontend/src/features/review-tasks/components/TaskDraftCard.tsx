/**
 * Feature: Review Tasks & Workflow Action Engine
 * Component: TaskDraftCard.tsx — Inline editable yellow card matching live contract review layout
 */

import React from 'react';
import { AlertTriangle, Scale, MessageSquare, Trash2 } from 'lucide-react';
import { Badge } from '@/shared';
import type { TaskCategory } from '../types';
import { TASK_CATEGORY_CONFIG } from '../types';

export interface TaskDraftCardProps {
  readonly order: number;
  readonly clauses: string;
  readonly category: TaskCategory;
  readonly issueSummary: string;
  readonly legalRecommendation: string;
  readonly authorName?: string;
  readonly isExistingTask?: boolean;
  readonly onChangeClauses: (val: string) => void;
  readonly onChangeCategory: (val: TaskCategory) => void;
  readonly onChangeIssueSummary: (val: string) => void;
  readonly onChangeLegalRecommendation: (val: string) => void;
  readonly onRemove: () => void;
}

export function TaskDraftCard({
  order,
  clauses,
  category,
  issueSummary,
  legalRecommendation,
  authorName = 'Pháp chế',
  isExistingTask = false,
  onChangeClauses,
  onChangeCategory,
  onChangeIssueSummary,
  onChangeLegalRecommendation,
  onRemove,
}: TaskDraftCardProps): React.ReactElement {
  return (
    <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/25 dark:bg-amber-950/15 p-3.5 sm:p-4 shadow-sm space-y-3 transition-all">
      {/* Header bar: #order, Category dropdown, Status badge, Trash button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-xs text-slate-400">
            #{order}
          </span>

          <select
            value={category}
            onChange={(e) => onChangeCategory(e.target.value as TaskCategory)}
            className="text-xs font-semibold px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            aria-label="Chọn phân loại rủi ro"
          >
            {(Object.keys(TASK_CATEGORY_CONFIG) as TaskCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {TASK_CATEGORY_CONFIG[cat].label}
              </option>
            ))}
          </select>

          <Badge variant="amber">Cần giải trình</Badge>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          title={isExistingTask ? 'Hủy chỉnh sửa điều khoản này' : 'Xóa khung điều khoản này'}
          aria-label={isExistingTask ? 'Hủy chỉnh sửa' : 'Xóa khung'}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Clauses input */}
      <div>
        <input
          type="text"
          value={clauses}
          onChange={(e) => onChangeClauses(e.target.value)}
          placeholder="Nhập tên điều khoản tham chiếu (ví dụ: Điều 4.2 - Thời hạn thanh toán)..."
          className="w-full text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Tên điều khoản tham chiếu"
        />
      </div>

      {/* Red box: Vấn đề / Rủi ro phát hiện */}
      <div className="rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Vấn đề / Rủi ro phát hiện:</span>
        </div>
        <textarea
          rows={2}
          value={issueSummary}
          onChange={(e) => onChangeIssueSummary(e.target.value)}
          placeholder="Mô tả cụ thể nội dung điều khoản hiện tại tiềm ẩn rủi ro gì đối với công ty..."
          className="w-full text-xs p-2.5 rounded-lg border border-rose-200/80 dark:border-rose-900/60 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
          aria-label="Vấn đề và rủi ro phát hiện"
        />
      </div>

      {/* Purple box: Khuyến nghị của Pháp chế */}
      <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
          <Scale className="w-4 h-4 flex-shrink-0" />
          <span>Khuyến nghị của Pháp chế ({authorName}):</span>
        </div>
        <textarea
          rows={2}
          value={legalRecommendation}
          onChange={(e) => onChangeLegalRecommendation(e.target.value)}
          placeholder="Hướng dẫn người phụ trách cần đàm phán hoặc chỉnh sửa câu chữ như thế nào..."
          className="w-full text-xs p-2.5 rounded-lg border border-indigo-200/80 dark:border-indigo-900/60 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Khuyến nghị của Pháp chế"
        />
      </div>

      {/* Grey box: Giải trình của Người phụ trách */}
      <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <MessageSquare className="w-4 h-4 flex-shrink-0 text-slate-400" />
          <span>Giải trình của Người phụ trách:</span>
        </div>
        <p className="text-xs text-slate-400 italic pl-5">
          Chưa có ý kiến phản hồi.
        </p>
      </div>
    </div>
  );
}
