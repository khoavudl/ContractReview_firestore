/**
 * Feature: Document Viewer
 * Hook: useDocumentViewer — Document viewer state, zoom, signed URLs, DOCX ArrayBuffer, and download
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ContractDocument } from '@/shared';
import type {
  ContractVersionItem,
  ViewerZoomLevel,
  ViewerErrorType,
  DocumentViewerState,
} from '../types';
import { fetchDocumentArrayBuffer } from '../services/storageService';

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
  initialVersionNo?: number,
  contract?: ContractDocument,
  initialZoom: ViewerZoomLevel = 75
): UseDocumentViewerReturn {
  const [selectedVersionNo, setSelectedVersionNo] = useState<number>(
    initialVersionNo || (versions.length > 0 ? versions[versions.length - 1].versionNo : 1)
  );

  const [docxUrl, setDocxUrl] = useState<string | null>(null);
  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ViewerErrorType | null>(null);
  const [zoomLevel, setZoomLevel] = useState<ViewerZoomLevel>(initialZoom);
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
      const buffer = await fetchDocumentArrayBuffer(contractId, docxPath);
      setDocxBuffer(buffer);
      setDocxUrl('direct://array-buffer');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải tài liệu Word.';
      setError(msg);
      setErrorType(
        msg.includes('PERMISSION')
          ? 'PERMISSION_DENIED'
          : msg.includes('FILE_NOT_FOUND')
          ? 'FILE_NOT_FOUND'
          : 'NETWORK_ERROR'
      );
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

    const vNo = selectedVersion?.versionNo ?? 1;
    const isApprovedStatus = contract?.status === 'HOL_APPROVED' || contract?.status === 'COMPLETED';
    const isApprovedVer = isApprovedStatus && vNo === (contract?.currentVersion || 1);

    const baseName = isApprovedVer
      ? `${contractId}_approved`
      : `${contractId}_v${vNo}`;

    const fileName = `${baseName}.docx`;

    if (docxBuffer) {
      const blob = new Blob([docxBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } else {
      fetch(docxUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        })
        .catch(() => {
          const link = document.createElement('a');
          link.href = docxUrl;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    }
  }, [docxUrl, docxBuffer, selectedVersion, contractId, contract]);

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
