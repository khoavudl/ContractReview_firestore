/**
 * Feature: Contracts Management & Dashboard
 * Component: ContractFilters — Search Bar & Active Filter Pills
 */

import React from 'react';
import { Search, X, Plus } from 'lucide-react';
import { Button } from '@/shared';
import type { ContractFilterGroup } from '../types';

export interface ContractFiltersProps {
  readonly keyword: string;
  readonly onKeywordChange: (kw: string) => void;
  readonly activeGroup?: ContractFilterGroup;
  readonly onResetGroup?: () => void;
  readonly totalCount?: number;
  readonly filteredCount?: number;
  readonly canCreate?: boolean;
  readonly onCreateNew?: () => void;
}

export function ContractFilters({
  keyword,
  onKeywordChange,
  canCreate,
  onCreateNew,
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

      {canCreate && onCreateNew && (
        <div className="flex items-center justify-end">
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={onCreateNew}
          >
            Tạo Hồ Sơ Mới
          </Button>
        </div>
      )}
    </div>
  );
}
