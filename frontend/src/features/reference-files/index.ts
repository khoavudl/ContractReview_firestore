/**
 * Feature: Reference Files & Attachments
 * Master Barrel Export — Public API for feature 'reference-files'
 */

// Types & Helpers
export * from './types';

// Services
export {
  subscribeToReferenceFiles,
  uploadReferenceFile,
  deleteReferenceFile,
  getReferenceFileViewUrl,
  clearReferenceBufferCache,
  DEV_SAMPLE_REF_FILES,
} from './services/refFileService';

// Hooks
export { useReferenceFiles } from './hooks/useReferenceFiles';
export type { UseReferenceFilesProps, UseReferenceFilesReturn } from './hooks/useReferenceFiles';

// Components
export { UploadRefDropzone } from './components/UploadRefDropzone';
export type { UploadRefDropzoneProps } from './components/UploadRefDropzone';
export { RefFileRow } from './components/RefFileRow';
export type { RefFileRowProps } from './components/RefFileRow';
export { RefFileList } from './components/RefFileList';
export type { RefFileListProps } from './components/RefFileList';
