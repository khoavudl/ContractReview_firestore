/**
 * Feature: Document Viewer
 * Component: DownloadButton — Dropdown to download original docx or preview pdf
 */

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileCode, ChevronDown } from 'lucide-react';

export interface DownloadButtonProps {
  readonly onDownloadDocx: () => void;
  readonly onDownloadPdf: () => void;
  readonly hasDocx: boolean;
  readonly hasPdf: boolean;
}

export function DownloadButton({
  onDownloadDocx,
  onDownloadPdf,
  hasDocx,
  hasPdf,
}: DownloadButtonProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isDisabled = !hasDocx && !hasPdf;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        title="Tải tệp tin về máy"
      >
        <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
        <span>Tải về</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 z-30 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs divide-y divide-slate-100 dark:divide-slate-700/60 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 font-semibold text-slate-500 dark:text-slate-400 text-[10px] uppercase">
            Tùy chọn tải về
          </div>

          <div className="p-1 space-y-0.5">
            <button
              type="button"
              disabled={!hasDocx}
              onClick={() => {
                onDownloadDocx();
                setIsOpen(false);
              }}
              className="w-full px-2.5 py-2 text-left rounded-lg flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="font-semibold">Tải file Word (.docx)</div>
                <div className="text-[10px] text-slate-400">Bản gốc có Track Changes</div>
              </div>
            </button>

            <button
              type="button"
              disabled={!hasPdf}
              onClick={() => {
                onDownloadPdf();
                setIsOpen(false);
              }}
              className="w-full px-2.5 py-2 text-left rounded-lg flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <div>
                <div className="font-semibold">Tải bản PDF (.pdf)</div>
                <div className="text-[10px] text-slate-400">Bản xem trước tiêu chuẩn</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
