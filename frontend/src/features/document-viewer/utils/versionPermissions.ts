/**
 * Feature: Document Viewer
 * Utility: versionPermissions.ts — Evaluates version upload permissions based on contract stage & user role
 */

import type { AuthUser, ContractDocument } from '@/shared';

/**
 * Checks whether the current user is allowed to upload a new Word (.docx) version
 * for the given contract, strictly following the Stage-based RBAC matrix:
 *
 * - DRAFT: Only the contract creator (USER owner)
 * - USER_REVISING: Only the contract creator (USER owner)
 * - PENDING_LEGAL: LEGAL personnel or Head of Legal (HOL)
 * - PENDING_HOL: Head of Legal (HOL)
 * - All other stages (COMPLETED, etc.): Disabled (read-only)
 */
export function canUploadVersion(
  contract: ContractDocument | null,
  user: AuthUser | null
): boolean {
  if (!contract || !user) return false;

  const isOwner = user.uid === contract.createdBy.uid;
  const isLegal = user.role === 'LEGAL';
  const isHOL = user.role === 'HOL';

  switch (contract.status) {
    case 'DRAFT':
    case 'USER_REVISING':
    case 'LEGAL_COMMENTED':
    case 'HOL_COMMENTED':
      return isOwner;

    case 'PENDING_LEGAL':
      return isLegal;

    case 'PENDING_HOL':
      return isHOL;

    default:
      return false;
  }
}
