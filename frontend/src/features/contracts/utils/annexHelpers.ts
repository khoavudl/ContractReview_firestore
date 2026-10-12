/**
 * Feature: Contracts Management
 * Utility: annexHelpers.ts — Pure helper functions for multi-document bundle & inheritance
 */

import type { AnnexFile } from '@/shared';

export interface UpdatedAnnexPayload {
  readonly storagePath: string;
  readonly originalFileName: string;
  readonly label?: string;
}

export interface NewAnnexPayload {
  readonly annexId: string;
  readonly label: string;
  readonly originalFileName: string;
  readonly storagePath: string;
}

export interface ResolveInheritedAnnexParams {
  readonly previousAnnexFiles?: readonly AnnexFile[];
  readonly updatedAnnexMap?: Record<string, UpdatedAnnexPayload>;
  readonly newAnnexes?: readonly NewAnnexPayload[];
  readonly removedAnnexIds?: readonly string[];
  readonly nextVersionNo: number;
}

/**
 * Generates standardized annexId (e.g. 1 -> 'PL01', 2 -> 'PL02')
 */
export function generateAnnexId(index: number): string {
  const safeIndex = Math.max(1, Math.floor(index));
  const padded = String(safeIndex).padStart(2, '0');
  return `PL${padded}`;
}

/**
 * Formats user-facing label for an annex
 */
export function formatAnnexLabel(annexId: string, customTitle?: string): string {
  if (customTitle && customTitle.trim().length > 0) {
    return `${annexId}: ${customTitle.trim()}`;
  }
  const numericPart = annexId.replace(/^PL0?/, '');
  return `Phụ lục ${numericPart || '01'}`;
}

/**
 * Builds standardized Cloud Storage path for annex documents.
 * Kept strictly 1 level deep under versions/ to comply with storage.rules.
 */
export function buildAnnexStoragePath(
  contractId: string,
  versionNo: number,
  annexId: string
): string {
  return `contracts/${contractId}/versions/v${versionNo}_${annexId}.docx`;
}

/**
 * Computes approved file name upon download without mutating database records.
 * Complies with firestore.rules immutability.
 */
export { computeApprovedFileName } from '@/shared';

/**
 * Resolves inherited annex files snapshot when a new version (vN) is created.
 * Preserves pointer and sourceVersionNo for unchanged files, applies updates,
 * and handles newly added or removed annexes.
 */
export function resolveInheritedAnnexFiles({
  previousAnnexFiles = [],
  updatedAnnexMap = {},
  newAnnexes = [],
  removedAnnexIds = [],
  nextVersionNo,
}: ResolveInheritedAnnexParams): AnnexFile[] {
  const removedSet = new Set(removedAnnexIds);
  const result: AnnexFile[] = [];

  for (const prev of previousAnnexFiles) {
    if (removedSet.has(prev.annexId)) {
      continue;
    }

    const updated = updatedAnnexMap[prev.annexId];
    if (updated) {
      result.push({
        annexId: prev.annexId,
        label: updated.label?.trim() || prev.label,
        originalFileName: updated.originalFileName,
        storagePath: updated.storagePath,
        sourceVersionNo: nextVersionNo,
        order: prev.order,
      });
    } else {
      result.push({
        ...prev,
        sourceVersionNo: prev.sourceVersionNo || 1,
      });
    }
  }

  for (const added of newAnnexes) {
    result.push({
      annexId: added.annexId,
      label: added.label,
      originalFileName: added.originalFileName,
      storagePath: added.storagePath,
      sourceVersionNo: nextVersionNo,
      order: result.length + 1,
    });
  }

  return result.map((item, idx) => ({
    ...item,
    order: idx + 1,
  }));
}
