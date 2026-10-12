/**
 * Feature: Document Viewer
 * Component: DocumentTabBar — Tab bar for switching between Main Contract and Annexes
 * Automatically hidden if only 1 document exists.
 */

import React from 'react';
import { Star, Paperclip } from 'lucide-react';
import type { DocumentTabItem } from '../types';

export interface DocumentTabBarProps {
  readonly documentTabs: readonly DocumentTabItem[];
  readonly activeDocumentId: string;
  readonly onSelectDocument: (id: string) => void;
  readonly currentVersionNo: number;
  readonly className?: string;
}

export function DocumentTabBar({
  documentTabs,
  activeDocumentId,
  onSelectDocument,
  currentVersionNo,
  className = '',
}: DocumentTabBarProps): React.ReactElement | null {
  // Progressive disclosure: hide tab bar completely if only 1 document exists
  if (!documentTabs || documentTabs.length <= 1) {
    return null;
  }

  return (
    <div
      role="tablist"
      aria-label="Danh sách tài liệu xét duyệt"
      className={`flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 overflow-x-auto select-none ${className}`}
    >
      {documentTabs.map((tab) => {
        const isActive = tab.id === activeDocumentId;
        const isInherited =
          typeof tab.sourceVersionNo === 'number' &&
          tab.sourceVersionNo < currentVersionNo;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onSelectDocument(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              isActive
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200 dark:border-slate-700 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            {tab.isMain ? (
              <Star className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500 fill-amber-500' : 'text-amber-500'}`} />
            ) : (
              <Paperclip className="w-3.5 h-3.5 text-purple-500" />
            )}

            <span>{tab.label}</span>

            {isInherited && (
              <span
                title={`Kế thừa không đổi từ phiên bản v${tab.sourceVersionNo}`}
                className="text-[10px] font-normal px-1 py-0.2 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
              >
                v{tab.sourceVersionNo}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
