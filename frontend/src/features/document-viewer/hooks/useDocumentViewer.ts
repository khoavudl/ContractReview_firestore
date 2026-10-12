/**
 * Feature: Document Viewer
 * Hook: useDocumentViewer — Document viewer state, zoom, signed URLs, DOCX ArrayBuffer, tabs, and download
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { computeApprovedFileName, type ContractDocument } from '@/shared';
import type {
  ContractVersionItem,
  DocumentTabItem,
  ViewerZoomLevel,
  ViewerErrorType,
  DocumentViewerState,
} from '../types';
import {
  fetchDocumentArrayBuffer,
  invalidateCachedDocumentBuffer,
} from '../services/storageService';

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
  readonly downloadDocument: (docId?: string) => Promise<void>;
  readonly downloadAllDocuments: () => Promise<void>;
  readonly isDownloadingAll: boolean;
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
  const [isDownloadingAll, setIsDownloadingAll] = useState<boolean>(false);

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
      if (force) {
        invalidateCachedDocumentBuffer(contractId, docxPath);
      }
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

  const downloadDocument = useCallback(
    async (docId?: string) => {
      if (!contractId) return;

      const targetDoc = docId
        ? documentTabs.find((t) => t.id === docId)
        : activeDocument;
      if (!targetDoc || !targetDoc.storagePath) return;

      const vNo = targetDoc.sourceVersionNo ?? selectedVersion?.versionNo ?? 1;
      const isApprovedStatus =
        contract?.status === 'HOL_APPROVED' || contract?.status === 'COMPLETED';
      const isApprovedVer =
        isApprovedStatus &&
        selectedVersion?.versionNo === (contract?.currentVersion || 1);

      const fileName = isApprovedVer
        ? computeApprovedFileName(contractId, targetDoc.id, targetDoc.isMain)
        : targetDoc.isMain
        ? `${contractId}_v${vNo}.docx`
        : `${contractId}_${targetDoc.id}_v${vNo}.docx`;

      let buffer: ArrayBuffer | null = null;
      if (targetDoc.id === activeDocumentId && docxBuffer) {
        buffer = docxBuffer;
      } else {
        buffer = await fetchDocumentArrayBuffer(contractId, targetDoc.storagePath);
      }

      if (buffer) {
        const blob = new Blob([buffer], {
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
      } else if (docxUrl && targetDoc.id === activeDocumentId) {
        try {
          const res = await fetch(docxUrl);
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch {
          const link = document.createElement('a');
          link.href = docxUrl;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    },
    [contractId, documentTabs, activeDocument, activeDocumentId, docxBuffer, docxUrl, selectedVersion, contract]
  );

  const downloadAllDocuments = useCallback(async () => {
    if (!contractId || documentTabs.length === 0) return;
    setIsDownloadingAll(true);
    try {
      for (let i = 0; i < documentTabs.length; i++) {
        const tab = documentTabs[i];
        await downloadDocument(tab.id);
        if (i < documentTabs.length - 1) {
          // Delay nhỏ 400ms giữa các file để trình duyệt không chặn pop-up multi-download
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }
    } finally {
      setIsDownloadingAll(false);
    }
  }, [contractId, documentTabs, downloadDocument]);

  const downloadFile = useCallback(() => {
    void downloadDocument();
  }, [downloadDocument]);

  const refreshUrls = useCallback(async () => {
    await loadDocument(true);
  }, [loadDocument]);

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
    refreshUrls,
    downloadFile,
    downloadDocument,
    downloadAllDocuments,
    isDownloadingAll,
  };
}
