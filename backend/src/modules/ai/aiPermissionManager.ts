import type { ContractStatus, UserRole } from '../../types/index.js';
import type { AIAnalysisType } from './aiTypes.js';

/**
 * Checks if user is the active role for triggering AI in the current contract stage.
 * Follows SRP with <= 25 lines of logic.
 */
export function canTriggerAIInStage(
  status: ContractStatus,
  userRole: UserRole,
  isOwner: boolean
): boolean {
  if (status === 'HOL_APPROVED' || status === 'COMPLETED') {
    return false;
  }
  if (status === 'DRAFT' || status === 'USER_REVISING') {
    return userRole === 'USER' && isOwner;
  }
  if (status === 'PENDING_LEGAL') {
    return userRole === 'LEGAL';
  }
  if (status === 'PENDING_HOL') {
    return userRole === 'HOL';
  }
  return false;
}

/**
 * Checks RBAC permissions for AI analysis features.
 * - USER: only SUMMARY on their own contracts.
 * - LEGAL: SUMMARY and RISK on any contract.
 * - HOL: SUMMARY, RISK, and DECISION_BRIEF on any contract.
 * Follows SRP with <= 25 lines of logic.
 */
export function canPerformAIAnalysis(
  analysisType: AIAnalysisType,
  userRole: UserRole,
  isOwner: boolean
): boolean {
  if (userRole === 'USER') {
    return analysisType === 'SUMMARY' && isOwner;
  }

  if (userRole === 'LEGAL') {
    return analysisType === 'SUMMARY' || analysisType === 'RISK';
  }

  if (userRole === 'HOL') {
    return true;
  }

  return false;
}

/**
 * Generates deterministic analysisId for idempotent caching in Firestore.
 * Follows SRP with <= 25 lines of logic.
 */
export function buildAnalysisId(
  analysisType: AIAnalysisType,
  versionNo: number,
  companyRole?: string
): string {
  if (analysisType === 'RISK') {
    const roleTag = companyRole ? companyRole.toUpperCase() : 'GENERAL';
    return `RISK_v${versionNo}_${roleTag}`;
  }

  if (analysisType === 'DECISION_BRIEF') {
    return `DECISION_BRIEF_v${versionNo}`;
  }

  return `SUMMARY_v${versionNo}`;
}
