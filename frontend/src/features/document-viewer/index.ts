/**
 * Feature: Document Viewer
 * Public API Barrel Export
 */

// Types
export type {
  ContractVersionItem,
  SignedUrlResult,
  SignedUrlCacheEntry,
  ViewerZoomLevel,
  ViewerErrorType,
  DocumentViewerState,
} from './types';

// Services
export {
  fetchSignedDocumentUrl,
  getCachedSignedUrl,
  clearSignedUrlCache,
  getSignedDocumentUrlFromCloud,
  MOCK_DEV_PDF_DATA_URI,
} from './services/storageService';

// Hooks
export {
  useDocumentViewer,
  type UseDocumentViewerReturn,
} from './hooks/useDocumentViewer';

// Components
export { PdfViewer, type PdfViewerProps } from './components/PdfViewer';
export { VersionDropdown, type VersionDropdownProps } from './components/VersionDropdown';
export { DownloadButton, type DownloadButtonProps } from './components/DownloadButton';
