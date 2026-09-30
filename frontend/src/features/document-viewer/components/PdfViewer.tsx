/**
 * Feature: Document Viewer
 * Component: PdfViewer — In-App PDF Viewer with Toolbar, Zoom, Fullscreen, and Fallbacks
 */

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ExternalLink,
  RotateCw,
  AlertCircle,
  FileQuestion,
  Download,
} from 'lucide-react';
import { Button } from '@/shared';
import type { ContractVersionItem } from '../types';
import { useDocumentViewer } from '../hooks/useDocumentViewer';
import { VersionDropdown } from './VersionDropdown';
import { DownloadButton } from './DownloadButton';

export interface PdfViewerProps {
  readonly contractId: string;
  readonly title: string;
  readonly versions: readonly ContractVersionItem[];
  readonly initialVersionNo?: number;
  readonly className?: string;
}

export function PdfViewer({
  contractId,
  title,
  versions,
  initialVersionNo,
  className = '',
}: PdfViewerProps): React.ReactElement {
  const {
    pdfUrl,
    docxUrl,
    isLoading,
    error,
    errorType,
    zoomLevel,
    isFullscreen,
    selectedVersion,
    selectVersion,
    zoomIn,
    zoomOut,
    toggleFullscreen,
    refreshUrls,
    downloadFile,
  } = useDocumentViewer(contractId, versions, initialVersionNo);

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col p-4'
    : `flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-sm overflow-hidden ${className}`;

  return (
    <div className={containerClasses}>
      {/* Viewer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80">
        <div className="flex items-center gap-2">
          {versions.length > 0 && (
            <VersionDropdown
              versions={versions}
              selectedVersionNo={selectedVersion?.versionNo || 1}
              onSelectVersion={selectVersion}
            />
          )}
          <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={title}>
            {selectedVersion?.originalFileName || title}
          </span>
        </div>

        {/* Zoom & Navigation Controls */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-700/60 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoomLevel <= 75}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 font-medium text-slate-700 dark:text-slate-200 min-w-[42px] text-center select-none">
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoomLevel >= 200}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Phóng to"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => refreshUrls()}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Tải lại tệp tin"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
          </button>

          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Mở tab mới"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <DownloadButton
            onDownloadDocx={() => downloadFile('docx')}
            onDownloadPdf={() => downloadFile('pdf')}
            hasDocx={Boolean(docxUrl)}
            hasPdf={Boolean(pdfUrl)}
          />

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Viewer Main Viewport */}
      <div className="flex-1 w-full bg-slate-100 dark:bg-slate-900/90 flex flex-col items-center justify-center p-2 sm:p-4 min-h-[550px] overflow-auto">
        {isLoading && (
          <div className="w-full max-w-2xl h-[500px] bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 flex flex-col gap-4 animate-pulse">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
            <div className="h-32 bg-slate-100 dark:bg-slate-700/50 rounded-lg mt-6" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mt-4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          </div>
        )}

        {!isLoading && errorType === 'CONVERTING' && (
          <div className="max-w-md w-full bg-white dark:bg-slate-800 p-6 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 inline-flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Bản xem trước PDF đang được xử lý
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-5 leading-relaxed">
              {error || 'Hệ thống đang chuyển đổi văn bản sang định dạng PDF hoặc chưa sẵn sàng. Bạn có thể tải file Word (.docx) về máy để xem ngay.'}
            </p>
            {docxUrl && (
              <Button
                variant="primary"
                icon={<Download className="w-4 h-4" />}
                onClick={() => downloadFile('docx')}
              >
                Tải file Word (.docx)
              </Button>
            )}
          </div>
        )}

        {!isLoading && errorType === 'FILE_NOT_FOUND' && (
          <div className="max-w-md w-full bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 inline-flex items-center justify-center mb-3">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Chưa có tệp tin văn bản
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Hồ sơ này chưa được tải lên file hợp đồng nào. Vui lòng upload phiên bản đầu tiên để bắt đầu thẩm định.
            </p>
          </div>
        )}

        {!isLoading && !errorType && pdfUrl && (
          <div
            style={{ width: `${zoomLevel}%`, transition: 'width 0.15s ease' }}
            className="h-full min-h-[580px] max-w-full flex-1 flex flex-col"
          >
            <iframe
              data-testid="pdf-iframe"
              src={`${pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
              title={`Trình đọc PDF: ${title}`}
              className="w-full h-full min-h-[580px] flex-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}
