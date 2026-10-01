/**
 * Feature: Document Viewer
 * Hook: useDocumentViewer — Document viewer state, zoom, signed URLs, DOCX ArrayBuffer, and download
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ContractVersionItem,
  ViewerZoomLevel,
  ViewerErrorType,
  DocumentViewerState,
} from '../types';
import { fetchSignedDocumentUrl, fetchDocxArrayBuffer } from '../services/storageService';

export interface UseDocumentViewerReturn extends DocumentViewerState {
  readonly selectedVersion: ContractVersionItem | null;
  readonly selectVersion: (versionNo: number) => void;
  readonly setZoomLevel: (zoom: ViewerZoomLevel) => void;
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  readonly toggleFullscreen: () => void;
  readonly refreshUrls: () => Promise<void>;
  readonly downloadFile: () => void;
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

  const [docxUrl, setDocxUrl] = useState<string | null>(null);
  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer | null>(null);
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

  const loadDocument = useCallback(async () => {
    if (!contractId || !selectedVersion) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorType(null);

    const docxPath = selectedVersion.storagePath;
    if (!docxPath) {
      setError('Tệp tin phiên bản này chưa sẵn sàng để hiển thị.');
      setErrorType('FILE_NOT_FOUND');
      setIsLoading(false);
      return;
    }

    try {
      const url = await fetchSignedDocumentUrl(contractId, docxPath);
      setDocxUrl(url);

      const buffer = await fetchDocxArrayBuffer(url);
      setDocxBuffer(buffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải tài liệu Word.';
      setError(msg);
      setErrorType(msg.includes('PERMISSION') ? 'PERMISSION_DENIED' : 'NETWORK_ERROR');
    } finally {
      setIsLoading(false);
    }
  }, [contractId, selectedVersion]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

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

  const downloadFile = useCallback(() => {
    if (!docxUrl) return;

    const link = document.createElement('a');
    link.href = docxUrl;
    const baseName = selectedVersion?.originalFileName || `contract_${contractId}.docx`;
    link.download = baseName.endsWith('.docx') ? baseName : `${baseName}.docx`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [docxUrl, selectedVersion, contractId]);

  return {
    docxUrl,
    docxBuffer,
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
    refreshUrls: loadDocument,
    downloadFile,
  };
}
