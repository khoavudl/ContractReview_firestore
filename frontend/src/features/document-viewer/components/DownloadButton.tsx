/**
 * Feature: Document Viewer
 * Component: DownloadButton — Button to download original docx with multi-document bundle support
 */

import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Star, Paperclip, Loader2 } from 'lucide-react';
import type { DocumentTabItem } from '../types';

export interface DownloadButtonProps {
  readonly onDownloadDocx: () => void;
  readonly onDownloadSpecificDoc?: (docId: string) => void;
  readonly onDownloadAll?: () => void;
  readonly hasDocx: boolean;
  readonly documentTabs?: readonly DocumentTabItem[];
  readonly activeDocument?: DocumentTabItem | null;
  readonly isDownloadingAll?: boolean;
}

export function DownloadButton({
  onDownloadDocx,
  onDownloadSpecificDoc,
  onDownloadAll,
  hasDocx,
  documentTabs,
  isDownloadingAll = false,
}: DownloadButtonProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const hasMultipleDocs = Boolean(documentTabs && documentTabs.length > 1);

  if (!hasMultipleDocs) {
    return (
      <button
        type="button"
        disabled={!hasDocx || isDownloadingAll}
        onClick={onDownloadDocx}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        title="Tải tệp tin Word (.docx) về máy"
      >
        <Download className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
        <span>Download</span>
      </button>
    );
  }

  return (
    <div className="relative inline-flex items-stretch rounded-lg shadow-sm" ref={containerRef}>
      {/* Primary Action Button: Download all documents in bundle */}
      <button
        type="button"
        disabled={!hasDocx || isDownloadingAll}
        onClick={onDownloadAll ?? onDownloadDocx}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-l-lg border border-r-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Tải toàn bộ tài liệu trong hồ sơ (.docx)"
      >
        {isDownloadingAll ? (
          <Loader2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
        )}
        <span>Download</span>
      </button>

      {/* Chevron dropdown toggle */}
      <button
        type="button"
        disabled={!hasDocx || isDownloadingAll}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Tùy chọn tải về"
        className="inline-flex items-center px-1.5 py-1.5 rounded-r-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-60 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-50 text-xs">
          <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Tải từng tài liệu
          </div>

          {documentTabs?.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setIsOpen(false);
                onDownloadSpecificDoc?.(tab.id);
              }}
              title={tab.originalFileName}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {tab.isMain ? (
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              ) : (
                <Paperclip className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              )}
              <span className="truncate flex-1">{tab.label}</span>
              {tab.sourceVersionNo && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  v{tab.sourceVersionNo}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
