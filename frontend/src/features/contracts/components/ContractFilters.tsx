/**
 * Feature: Contracts Management & Dashboard
 * Component: ContractFilters — Search Bar & Active Filter Pills
 */

import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import type { ContractFilterGroup } from '../types';

export interface ContractFiltersProps {
  readonly keyword: string;
  readonly onKeywordChange: (kw: string) => void;
  readonly activeGroup: ContractFilterGroup;
  readonly onResetGroup: () => void;
  readonly totalCount: number;
  readonly filteredCount: number;
}

const GROUP_LABELS: Record<string, string> = {
  draft: 'Bản nháp & Chờ sửa',
  legal: 'Pháp chế thẩm định',
  head: 'Trưởng ban xét duyệt',
  approved: 'Hoàn tất / Đã duyệt',
};

export function ContractFilters({
  keyword,
  onKeywordChange,
  activeGroup,
  onResetGroup,
  totalCount,
  filteredCount,
}: ContractFiltersProps): React.ReactElement {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
      <div className="flex-1 flex items-center gap-2 max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="Tìm theo mã hợp đồng, tiêu đề, đối tác..."
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
        />
        {keyword && (
          <button
            type="button"
            onClick={() => onKeywordChange('')}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            aria-label="Xóa từ khóa tìm kiếm"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 justify-between sm:justify-end text-xs text-slate-500 dark:text-slate-400">
        {activeGroup !== 'ALL' && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 font-medium">
            <Filter className="w-3 h-3" />
            <span>Nhóm: {GROUP_LABELS[activeGroup] ?? activeGroup}</span>
            <button
              type="button"
              onClick={onResetGroup}
              className="text-brand-500 hover:text-brand-700 ml-0.5"
              aria-label="Xóa lọc nhóm"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <span className="font-medium">
          {filteredCount === totalCount
            ? `Tổng số: ${totalCount} hồ sơ`
            : `Đang hiển thị ${filteredCount} / ${totalCount} hồ sơ`}
        </span>
      </div>
    </div>
  );
}
