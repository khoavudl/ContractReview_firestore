/**
 * Feature: Document Viewer
 * Component: DocxViewer — In-App DOCX Viewer using docx-preview with Toolbar, Zoom, and Fullscreen
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  AlertCircle,
  FileQuestion,
  Download,
  UploadCloud,
} from 'lucide-react';
import { renderAsync } from 'docx-preview';
import { Button } from '@/shared';
import type { AuthUser, ContractDocument } from '@/shared';
import type { ContractVersionItem, ViewerZoomLevel } from '../types';
import { useDocumentViewer } from '../hooks/useDocumentViewer';
import { VersionDropdown } from './VersionDropdown';
import { DownloadButton } from './DownloadButton';
import { UploadVersionModal } from './UploadVersionModal';
import { DownloadUnapprovedWarningModal } from './DownloadUnapprovedWarningModal';
import { DocumentTabBar } from './DocumentTabBar';
import { canUploadVersion } from '../utils/versionPermissions';
import { invalidateCachedDocumentBuffer } from '../services/storageService';

/**
 * Checks if the rendering error was caused by a truncated or missing ZIP EOCD header
 */
export function isZipEocdError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('end of central directory') ||
    msg.includes('Corrupted zip') ||
    msg.includes('Can\'t find end of central directory')
  );
}

export interface DocxViewerProps {
  readonly contractId: string;
  readonly title: string;
  readonly versions: readonly ContractVersionItem[];
  readonly initialVersionNo?: number;
  readonly className?: string;
  readonly contract?: ContractDocument;
  readonly currentUser?: AuthUser | null;
  readonly onVersionUploaded?: () => void;
  readonly initialZoom?: ViewerZoomLevel;
}

export function DocxViewer({
  contractId,
  title: _title,
  versions,
  initialVersionNo,
  className = '',
  contract,
  currentUser,
  onVersionUploaded,
  initialZoom = 75,
}: DocxViewerProps): React.ReactElement {
  const {
    docxUrl,
    docxBuffer,
    isLoading,
    error,
    errorType,
    zoomLevel,
    isFullscreen,
    selectedVersion,
    selectVersion,
    documentTabs,
    activeDocumentId,
    selectDocument,
    activeDocument,
    zoomIn,
    zoomOut,
    toggleFullscreen,
    refreshUrls,
    downloadFile,
    downloadDocument,
    downloadAllDocuments,
    isDownloadingAll,
  } = useDocumentViewer(contractId, versions, initialVersionNo, contract, initialZoom);

  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const retryAttemptsRef = useRef(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [pendingDownloadDocId, setPendingDownloadDocId] = useState<string | null | undefined>(undefined);
  const [pendingDownloadIsAll, setPendingDownloadIsAll] = useState<boolean>(false);

  // Reset retry attempts when document tab or version changes
  useEffect(() => {
    retryAttemptsRef.current = 0;
    setRetryAttempts(0);
  }, [activeDocumentId, selectedVersion?.versionNo]);

  const isUploadAllowed = canUploadVersion(contract || null, currentUser || null);

  const isApprovedStage = contract?.status === 'HOL_APPROVED' || contract?.status === 'COMPLETED';
  const approvedVersionNo = contract?.currentVersion || 1;
  const isCurrentViewingUnapproved =
    isApprovedStage && (selectedVersion?.versionNo ?? 1) < approvedVersionNo;

  const handleDownloadClick = (): void => {
    if (isCurrentViewingUnapproved) {
      setPendingDownloadDocId(undefined);
      setPendingDownloadIsAll(false);
      setIsWarningModalOpen(true);
    } else {
      downloadFile();
    }
  };

  const handleDownloadSpecificDoc = (docId: string): void => {
    if (isCurrentViewingUnapproved) {
      setPendingDownloadDocId(docId);
      setPendingDownloadIsAll(false);
      setIsWarningModalOpen(true);
    } else {
      void downloadDocument(docId);
    }
  };

  const handleDownloadAllClick = (): void => {
    if (isCurrentViewingUnapproved) {
      setPendingDownloadDocId(undefined);
      setPendingDownloadIsAll(true);
      setIsWarningModalOpen(true);
    } else {
      void downloadAllDocuments();
    }
  };

  const handleConfirmDownloadWarning = (): void => {
    setIsWarningModalOpen(false);
    if (pendingDownloadIsAll) {
      setPendingDownloadIsAll(false);
      void downloadAllDocuments();
    } else if (pendingDownloadDocId) {
      const id = pendingDownloadDocId;
      setPendingDownloadDocId(undefined);
      void downloadDocument(id);
    } else {
      downloadFile();
    }
  };

  const handleUploaded = (newVersionNo: number): void => {
    onVersionUploaded?.();
    selectVersion(newVersionNo);
  };

  const refreshUrlsRef = useRef(refreshUrls);
  refreshUrlsRef.current = refreshUrls;
  const activeDocStoragePathRef = useRef(activeDocument?.storagePath);
  activeDocStoragePathRef.current = activeDocument?.storagePath;
  const contractIdRef = useRef(contractId);
  contractIdRef.current = contractId;

  useEffect(() => {
    let isCancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    if (!docxBuffer || !viewerContainerRef.current) {
      setIsRendering(false);
      return;
    }

    setIsRendering(true);
    setRenderError(null);
    viewerContainerRef.current.innerHTML = '';

    renderAsync(docxBuffer, viewerContainerRef.current, undefined, {
      inWrapper: true,
      ignoreWidth: false,
      breakPages: true,
      className: 'docx-preview',
    })
      .then(() => {
        if (!isCancelled) {
          setIsRendering(false);
          retryAttemptsRef.current = 0;
          setRetryAttempts(0);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('[DocxViewer] Rendering error:', err);
          const currentStoragePath = activeDocStoragePathRef.current;
          const currentContractId = contractIdRef.current;
          if (isZipEocdError(err) && retryAttemptsRef.current < 2 && currentStoragePath) {
            retryAttemptsRef.current += 1;
            setRetryAttempts(retryAttemptsRef.current);
            invalidateCachedDocumentBuffer(currentContractId, currentStoragePath);
            setIsRendering(true);
            retryTimer = setTimeout(() => {
              if (!isCancelled) {
                void refreshUrlsRef.current();
              }
            }, 1200);
            return;
          }

          setRenderError(
            err instanceof Error ? err.message : 'Không thể kết xuất văn bản Word trên trình duyệt.'
          );
          setIsRendering(false);
        }
      });

    return () => {
      isCancelled = true;
      if (retryTimer !== undefined) {
        clearTimeout(retryTimer);
      }
    };
  }, [docxBuffer]);

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col p-4'
    : `flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-sm overflow-hidden ${className}`;

  const isBusy = isLoading || isRendering;

  return (
    <div className={containerClasses} data-testid="docx-viewer">
      {/* Viewer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80">
        <div className="flex items-center gap-2">
          {versions.length > 0 && (
            <VersionDropdown
              versions={versions}
              selectedVersionNo={selectedVersion?.versionNo || 1}
              onSelectVersion={selectVersion}
              isApproved={isApprovedStage}
              approvedVersionNo={approvedVersionNo}
            />
          )}

          <DownloadButton
            onDownloadDocx={handleDownloadClick}
            onDownloadSpecificDoc={handleDownloadSpecificDoc}
            onDownloadAll={handleDownloadAllClick}
            hasDocx={Boolean(docxUrl)}
            documentTabs={documentTabs}
            activeDocument={activeDocument}
            isDownloadingAll={isDownloadingAll}
          />
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
          {isUploadAllowed && (
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-brand-500/30 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 text-xs font-semibold transition-colors"
              title="Tải lên phiên bản Word mới"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          )}

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

      {/* Document Tab Bar (Progressive disclosure: auto-hidden if only 1 document exists) */}
      <DocumentTabBar
        documentTabs={documentTabs}
        activeDocumentId={activeDocumentId}
        onSelectDocument={selectDocument}
        currentVersionNo={contract?.currentVersion || selectedVersion?.versionNo || 1}
      />

      {/* Viewer Main Viewport */}
      <div className="flex-1 min-h-0 w-full bg-slate-100 dark:bg-slate-900/90 flex flex-col items-center justify-start p-2 sm:p-4 overflow-auto relative">
        {retryAttempts > 0 && isBusy && (
          <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2 animate-pulse">
            <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
            <span>Đang hoàn tất đồng bộ tệp tin xem trước từ hệ thống lưu trữ (lần {retryAttempts}/2)...</span>
          </div>
        )}

        {isBusy && (
          <div className="w-full max-w-3xl h-[550px] bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 flex flex-col gap-4 animate-pulse">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
            <div className="h-36 bg-slate-100 dark:bg-slate-700/50 rounded-lg mt-6" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mt-4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          </div>
        )}

        {!isBusy && errorType === 'FILE_NOT_FOUND' && (
          <div className="max-w-md w-full bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center my-auto">
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

        {!isBusy && (error || renderError) && errorType !== 'FILE_NOT_FOUND' && (
          <div className="max-w-md w-full bg-white dark:bg-slate-800 p-6 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-sm text-center my-auto">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 inline-flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Không thể hiển thị văn bản xem trước
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-5 leading-relaxed">
              {renderError || error || 'Đã xảy ra lỗi khi đọc tệp tin Word. Bạn có thể tải file về máy để xem trực tiếp.'}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                icon={<RotateCw className="w-4 h-4" />}
                onClick={() => refreshUrls()}
              >
                Thử lại
              </Button>
              {docxUrl && (
                <Button
                  variant="primary"
                  icon={<Download className="w-4 h-4" />}
                  onClick={handleDownloadClick}
                >
                  Tải file Word (.docx)
                </Button>
              )}
            </div>
          </div>
        )}

        {/* DOCX Render Container */}
        <div
          data-testid="docx-render-container"
          style={{
            zoom: `${zoomLevel}%`,
            display: !isBusy && !error && !renderError && docxBuffer ? 'block' : 'none',
          }}
          className="w-full flex justify-center pb-8"
        >
          <div
            ref={viewerContainerRef}
            className="docx-preview-root max-w-4xl w-full shadow-lg rounded-sm overflow-hidden bg-white text-slate-900"
          />
        </div>
      </div>

      {/* Upload New Version Modal */}
      {isUploadModalOpen && contract && currentUser && (
        <UploadVersionModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          contract={contract}
          currentUser={currentUser}
          onUploaded={handleUploaded}
        />
      )}

      {/* Download Unapproved Version Warning Modal */}
      {isWarningModalOpen && (
        <DownloadUnapprovedWarningModal
          isOpen={isWarningModalOpen}
          onClose={() => {
            setIsWarningModalOpen(false);
            setPendingDownloadDocId(undefined);
            setPendingDownloadIsAll(false);
          }}
          onConfirmDownload={handleConfirmDownloadWarning}
          selectedVersionNo={selectedVersion?.versionNo || 1}
          approvedVersionNo={approvedVersionNo}
        />
      )}
    </div>
  );
}

// Backward-compatibility alias
export { DocxViewer as PdfViewer, type DocxViewerProps as PdfViewerProps };
