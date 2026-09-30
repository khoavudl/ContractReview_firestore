/**
 * Feature: Document Viewer
 * Domain Types & Interfaces
 */

export interface ContractVersionItem {
  readonly versionNo: number;
  readonly versionId: string;
  readonly originalFileName: string;
  readonly storagePath: string;
  readonly previewPdfPath: string;
  readonly uploadedBy: {
    readonly uid: string;
    readonly email: string;
    readonly displayName: string;
  };
  readonly changeSummary?: string;
  readonly uploadedAt: Date;
}

export interface SignedUrlResult {
  readonly signedUrl: string;
  readonly expiresAt: string; // ISO 8601 string from backend
}

export interface SignedUrlCacheEntry {
  readonly signedUrl: string;
  readonly expiresAtMs: number;
}

export type ViewerZoomLevel = 75 | 100 | 125 | 150 | 200;

export type ViewerErrorType =
  | 'FILE_NOT_FOUND'
  | 'CONVERTING'
  | 'PERMISSION_DENIED'
  | 'NETWORK_ERROR';

export interface DocumentViewerState {
  readonly pdfUrl: string | null;
  readonly docxUrl: string | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly errorType: ViewerErrorType | null;
  readonly zoomLevel: ViewerZoomLevel;
  readonly isFullscreen: boolean;
}
