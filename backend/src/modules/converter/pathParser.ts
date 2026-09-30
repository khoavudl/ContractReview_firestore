import type { ParsedVersionPath } from './converterTypes.js';

const VERSION_PATH_REGEX = /^contracts\/([^/]+)\/versions\/(([^/]+)\.docx)$/i;

/**
 * Validates and parses the storage path of an uploaded version file.
 * Only accepts paths matching contracts/{contractId}/versions/{fileName}.docx.
 * Follows SRP with <= 25 lines of logic.
 */
export function parseVersionUploadPath(filePath: string): ParsedVersionPath | null {
  if (!filePath || filePath.includes('..') || filePath.startsWith('/')) {
    return null;
  }

  const match = filePath.match(VERSION_PATH_REGEX);
  if (!match) {
    return null;
  }

  const [, contractId, fullFileName, baseName] = match;
  if (!contractId?.trim() || !baseName?.trim()) {
    return null;
  }

  return {
    contractId: contractId.trim(),
    versionFileName: fullFileName.trim(),
    versionId: baseName.trim(),
  };
}

/**
 * Constructs the target preview PDF path for a converted document.
 * Example: contracts/{contractId}/previews/v1.pdf
 * Follows SRP with <= 25 lines of logic.
 */
export function buildPreviewPdfPath(contractId: string, versionFileName: string): string {
  const baseName = versionFileName.replace(/\.docx$/i, '');
  return `contracts/${contractId}/previews/${baseName}.pdf`;
}
