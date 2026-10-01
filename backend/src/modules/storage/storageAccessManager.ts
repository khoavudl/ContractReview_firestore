import type { UserRole } from '../../types/index.js';

export interface StorageUserContext {
  uid: string;
  role: UserRole;
}

export type StorageCategory = 'versions' | 'references' | 'approved';

export interface ParsedStoragePath {
  contractId: string;
  category: StorageCategory;
  fileName: string;
}

const VALID_CATEGORIES: readonly StorageCategory[] = [
  'versions',
  'references',
  'approved',
] as const;

/**
 * Parses and validates a contract storage path to prevent path traversal and structure tampering.
 * Format: contracts/{contractId}/{category}/{fileName}
 * Follows SRP with <= 25 lines of logic.
 */
export function parseContractStoragePath(storagePath: string): ParsedStoragePath | null {
  if (!storagePath || storagePath.includes('..') || storagePath.startsWith('/')) {
    return null;
  }

  const parts = storagePath.split('/');
  if (parts.length !== 4 || parts[0] !== 'contracts') {
    return null;
  }

  const [, contractId, category, fileName] = parts;
  if (!contractId?.trim() || !fileName?.trim()) {
    return null;
  }

  if (!VALID_CATEGORIES.includes(category as StorageCategory)) {
    return null;
  }

  return {
    contractId: contractId.trim(),
    category: category as StorageCategory,
    fileName: fileName.trim(),
  };
}

/**
 * Checks whether the user is authorized to read the document file.
 * LEGAL and HOL have company-wide read access.
 * USER is strictly restricted to their own contracts.
 * Follows SRP with <= 25 lines of logic.
 */
export function canAccessContractDocument(
  contractCreatedByUid: string,
  user: StorageUserContext
): boolean {
  if (!user || !user.uid) {
    return false;
  }

  if (user.role === 'LEGAL' || user.role === 'HOL') {
    return true;
  }

  if (user.role === 'USER') {
    return contractCreatedByUid === user.uid;
  }

  return false;
}
