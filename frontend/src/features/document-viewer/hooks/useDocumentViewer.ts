/**
 * Feature: Document Viewer
 * Hook: useDocumentViewer — Document viewer state, zoom, signed URLs, and downloads
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ContractVersionItem,
  ViewerZoomLevel,
  ViewerErrorType,
  DocumentViewerState,
} from '../types';
import { fetchSignedDocumentUrl } from '../services/storageService';

export interface UseDocumentViewerReturn extends DocumentViewerState {
  readonly selectedVersion: ContractVersionItem | null;
  readonly selectVersion: (versionNo: number) => void;
  readonly setZoomLevel: (zoom: ViewerZoomLevel) => void;
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  readonly toggleFullscreen: () => void;
  readonly refreshUrls: () => Promise<void>;
  readonly downloadFile: (type: 'pdf' | 'docx') => void;
}

const ZOOM_STEPS: readonly ViewerZoomLevel[] = [75, 100, 125, 150, 200];

export function useDocumentViewer(
  contractId: string,
  versions: readonly ContractVersionItem[],
  initialVersionNo?: number
): UseDocumentViewerReturn {
  const [selectedVersionNo, setSelectedVersionNo] = useState<number>(
    initialVersionNo || (versions.length > 0 ? versions[versions.length - 1].versionNo : 1)
  );

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [docxUrl, setDocxUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ViewerErrorType | null>(null);
  const [zoomLevel, setZoomLevel] = useState<ViewerZoomLevel>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sync selected version when versions list loads or changes
  useEffect(() => {
    if (versions.length > 0) {
      const match = versions.find((v) => v.versionNo === selectedVersionNo);
      if (!match) {
        setSelectedVersionNo(versions[versions.length - 1].versionNo);
      }
    }
  }, [versions, selectedVersionNo]);

  const selectedVersion = useMemo(() => {
    return versions.find((v) => v.versionNo === selectedVersionNo) || null;
  }, [versions, selectedVersionNo]);

  const loadUrls = useCallback(async () => {
    if (!contractId || !selectedVersion) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorType(null);

    const pdfPath = selectedVersion.previewPdfPath;
    const docxPath = selectedVersion.storagePath;

    if (!pdfPath && !docxPath) {
      setError('Tệp tin phiên bản này chưa sẵn sàng để hiển thị.');
      setErrorType('FILE_NOT_FOUND');
      setIsLoading(false);
      return;
    }

    try {
      const promises: [Promise<string | null>, Promise<string | null>] = [
        pdfPath ? fetchSignedDocumentUrl(contractId, pdfPath).catch(() => null) : Promise.resolve(null),
        docxPath ? fetchSignedDocumentUrl(contractId, docxPath).catch(() => null) : Promise.resolve(null),
      ];

      const [pUrl, dUrl] = await Promise.all(promises);

      setPdfUrl(pUrl);
      setDocxUrl(dUrl);

      if (!pUrl && !dUrl) {
        setError('Không thể kết nối đến máy chủ lưu trữ tệp tin.');
        setErrorType('NETWORK_ERROR');
      } else if (!pUrl) {
        setError('Bản PDF đang được xử lý hoặc chưa sẵn sàng. Bạn có thể tải file Word (.docx) về xem.');
        setErrorType('CONVERTING');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải tài liệu.';
      setError(msg);
      setErrorType('NETWORK_ERROR');
    } finally {
      setIsLoading(false);
    }
  }, [contractId, selectedVersion]);

  useEffect(() => {
    loadUrls();
  }, [loadUrls]);

  const selectVersion = useCallback((versionNo: number) => {
    setSelectedVersionNo(versionNo);
  }, []);

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => {
      const idx = ZOOM_STEPS.indexOf(prev);
      if (idx < ZOOM_STEPS.length - 1) return ZOOM_STEPS[idx + 1];
      return prev;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const idx = ZOOM_STEPS.indexOf(prev);
      if (idx > 0) return ZOOM_STEPS[idx - 1];
      return prev;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const downloadFile = useCallback(
    (type: 'pdf' | 'docx') => {
      const targetUrl = type === 'pdf' ? pdfUrl : docxUrl;
      if (!targetUrl) return;

      const link = document.createElement('a');
      link.href = targetUrl;
      const baseName = selectedVersion?.originalFileName?.replace(/\.[^/.]+$/, '') || `contract_${contractId}`;
      link.download = type === 'pdf' ? `${baseName}_preview.pdf` : `${baseName}.docx`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [pdfUrl, docxUrl, selectedVersion, contractId]
  );

  return {
    pdfUrl,
    docxUrl,
    isLoading,
    error,
    errorType,
    zoomLevel,
    isFullscreen,
    selectedVersion,
    selectVersion,
    setZoomLevel,
    zoomIn,
    zoomOut,
    toggleFullscreen,
    refreshUrls: loadUrls,
    downloadFile,
  };
}
