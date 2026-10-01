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
  fetchDocxArrayBuffer,
} from './services/storageService';

// Hooks
export {
  useDocumentViewer,
  type UseDocumentViewerReturn,
} from './hooks/useDocumentViewer';

// Components
export {
  DocxViewer,
  type DocxViewerProps,
  PdfViewer,
  type PdfViewerProps,
} from './components/DocxViewer';
export { VersionDropdown, type VersionDropdownProps } from './components/VersionDropdown';
export { DownloadButton, type DownloadButtonProps } from './components/DownloadButton';
export { UploadVersionModal, type UploadVersionModalProps } from './components/UploadVersionModal';
export {
  DownloadUnapprovedWarningModal,
  type DownloadUnapprovedWarningModalProps,
} from './components/DownloadUnapprovedWarningModal';

// Utilities
export { canUploadVersion } from './utils/versionPermissions';
