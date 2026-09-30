/**
 * Feature: Reference Files & Attachments
 * Types & Helper Utilities
 */

export interface ReferenceFileDocument {
  fileId: string;
  fileName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: {
    uid: string;
    displayName: string;
  };
  uploadedAt: Date | { seconds: number; nanoseconds: number } | string;
}

export type FileCategory = 'pdf' | 'doc' | 'sheet' | 'image' | 'archive' | 'other';

/**
 * Categorizes file type for appropriate UI icon and color
 */
export function getFileCategory(mimeType: string, fileName: string): FileCategory {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (mimeType.includes('pdf') || ext === 'pdf') {
    return 'pdf';
  }
  if (
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    ext === 'doc' ||
    ext === 'docx'
  ) {
    return 'doc';
  }
  if (
    mimeType.includes('sheet') ||
    mimeType.includes('excel') ||
    ext === 'xls' ||
    ext === 'xlsx' ||
    ext === 'csv'
  ) {
    return 'sheet';
  }
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) {
    return 'image';
  }
  if (mimeType.includes('zip') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return 'archive';
  }
  return 'other';
}

/**
 * Formats byte size into human-readable string (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
