/**
 * Feature: Document Viewer
 * Component: DownloadButton — Button to download original docx
 */

import React from 'react';
import { Download } from 'lucide-react';

export interface DownloadButtonProps {
  readonly onDownloadDocx: () => void;
  readonly hasDocx: boolean;
}

export function DownloadButton({
  onDownloadDocx,
  hasDocx,
}: DownloadButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      disabled={!hasDocx}
      onClick={onDownloadDocx}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      title="Tải tệp tin Word (.docx) về máy"
    >
      <Download className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
      <span>Download</span>
    </button>
  );
}
