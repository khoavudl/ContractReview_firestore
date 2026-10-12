/**
 * Feature: Document Viewer
 * Hook: useDocumentViewer — Document viewer state, zoom, signed URLs, DOCX ArrayBuffer, tabs, and download
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ContractDocument } from '@/shared';
import type {
  ContractVersionItem,
  DocumentTabItem,
  ViewerZoomLevel,
  ViewerErrorType,
  DocumentViewerState,
} from '../types';
import { fetchDocumentArrayBuffer } from '../services/storageService';

export interface UseDocumentViewerReturn extends DocumentViewerState {
  readonly selectedVersion: ContractVersionItem | null;
  readonly selectVersion: (versionNo: number) => void;
  readonly documentTabs: readonly DocumentTabItem[];
  readonly activeDocumentId: string;
  readonly selectDocument: (documentId: string) => void;
  readonly activeDocument: DocumentTabItem | null;
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

  const [activeDocumentId, setActiveDocumentId] = useState<string>('MAIN');
  const [docxUrl, setDocxUrl] = useState<string | null>(null);
  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ViewerErrorType | null>(null);
  const [zoomLevel, setZoomLevel] = useState<ViewerZoomLevel>(initialZoom);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Track currently loaded path to prevent duplicate / StrictMode redundant fetches
  const loadedPathRef = useRef<string | null>(null);

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

  // Build document tabs for the currently selected version snapshot
  const documentTabs = useMemo<readonly DocumentTabItem[]>(() => {
    if (!selectedVersion) return [];

    const mainTab: DocumentTabItem = {
      id: 'MAIN',
      label: 'HĐ Chính',
      originalFileName: selectedVersion.originalFileName,
      storagePath: selectedVersion.storagePath,
      isMain: true,
      sourceVersionNo: selectedVersion.versionNo,
    };

    const annexList =
      Array.isArray(selectedVersion.annexFiles)
        ? selectedVersion.annexFiles
        : selectedVersion.versionNo === contract?.currentVersion && Array.isArray(contract?.annexFiles)
        ? contract.annexFiles
        : [];

    const annexTabs: DocumentTabItem[] = annexList.map((af) => ({
      id: af.annexId,
      label: af.label,
      originalFileName: af.originalFileName,
      storagePath: af.storagePath,
      isMain: false,
      sourceVersionNo: af.sourceVersionNo,
    }));

    return [mainTab, ...annexTabs];
  }, [selectedVersion, contract]);

  // Keep activeDocumentId in sync when tabs change
  useEffect(() => {
    if (documentTabs.length > 0) {
      const exists = documentTabs.some((t) => t.id === activeDocumentId);
      if (!exists) {
        setActiveDocumentId('MAIN');
      }
    }
  }, [documentTabs, activeDocumentId]);

  const activeDocument = useMemo(() => {
    return documentTabs.find((t) => t.id === activeDocumentId) || documentTabs[0] || null;
  }, [documentTabs, activeDocumentId]);

  const loadDocument = useCallback(async (force = false) => {
    if (!contractId || !activeDocument) {
      setIsLoading(false);
      return;
    }

    const docxPath = activeDocument.storagePath;
    if (!docxPath) {
      setError('Tệp tin phiên bản này chưa sẵn sàng để hiển thị.');
      setErrorType('FILE_NOT_FOUND');
      setIsLoading(false);
      return;
    }

    // Skip redundant fetch if this exact storage path is already active in viewer
    if (!force && docxPath === loadedPathRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorType(null);

    try {
      const buffer = await fetchDocumentArrayBuffer(contractId, docxPath);
      loadedPathRef.current = docxPath;
      setDocxBuffer(buffer);
      setDocxUrl('direct://array-buffer');
    } catch (err) {
      loadedPathRef.current = null;
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
  }, [contractId, activeDocument]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const selectVersion = useCallback((versionNo: number) => {
    setSelectedVersionNo(versionNo);
  }, []);

  const selectDocument = useCallback((documentId: string) => {
    setActiveDocumentId(documentId);
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
    if (!docxUrl || !activeDocument) return;

    const vNo = activeDocument.sourceVersionNo ?? selectedVersion?.versionNo ?? 1;
    const isApprovedStatus = contract?.status === 'HOL_APPROVED' || contract?.status === 'COMPLETED';
    const isApprovedVer = isApprovedStatus && (selectedVersion?.versionNo === (contract?.currentVersion || 1));

    let fileName: string;
    if (isApprovedVer) {
      fileName = activeDocument.isMain
        ? `${contractId}_HD_Chinh_approved.docx`
        : `${contractId}_${activeDocument.id}_approved.docx`;
    } else {
      fileName = activeDocument.isMain
        ? `${contractId}_v${vNo}.docx`
        : `${contractId}_${activeDocument.id}_v${vNo}.docx`;
    }

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
  }, [docxUrl, docxBuffer, activeDocument, selectedVersion, contractId, contract]);

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
    documentTabs,
    activeDocumentId,
    selectDocument,
    activeDocument,
    setZoomLevel,
    zoomIn,
    zoomOut,
    toggleFullscreen,
    refreshUrls: () => loadDocument(true),
    downloadFile,
  };
}
