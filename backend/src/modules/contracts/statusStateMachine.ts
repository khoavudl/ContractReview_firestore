import type { ContractDocument, ContractStatus, UserRole } from '../../types/index.js';

export interface TransitionUserContext {
  uid: string;
  role: UserRole;
  displayName: string;
  email: string;
}

export interface TransitionPayload {
  changeSummary?: string;
  taskListComplete?: boolean;
  rejectReason?: string;
  versionNo?: number;
}

export interface TransitionRequest {
  contractId: string;
  targetStatus: ContractStatus;
  payload?: TransitionPayload;
}

export interface TransitionRule {
  from: ContractStatus;
  to: ContractStatus;
  allowedRoles: readonly UserRole[];
  requireOwner?: boolean;
}

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
}

export const TRANSITION_RULES: readonly TransitionRule[] = [
  { from: 'DRAFT', to: 'PENDING_LEGAL', allowedRoles: ['USER'], requireOwner: true },
  { from: 'PENDING_LEGAL', to: 'LEGAL_COMMENTED', allowedRoles: ['LEGAL', 'HOL'] },
  { from: 'PENDING_LEGAL', to: 'LEGAL_APPROVED', allowedRoles: ['LEGAL', 'HOL'] },
  { from: 'PENDING_LEGAL', to: 'PENDING_HOL', allowedRoles: ['LEGAL', 'HOL'] },
  { from: 'LEGAL_COMMENTED', to: 'USER_REVISING', allowedRoles: ['USER', 'LEGAL', 'HOL'] },
  { from: 'USER_REVISING', to: 'PENDING_LEGAL', allowedRoles: ['USER'], requireOwner: true },
  { from: 'LEGAL_APPROVED', to: 'PENDING_HOL', allowedRoles: ['LEGAL', 'HOL'] },
  { from: 'PENDING_HOL', to: 'HOL_COMMENTED', allowedRoles: ['HOL'] },
  { from: 'HOL_COMMENTED', to: 'USER_REVISING', allowedRoles: ['USER', 'HOL'] },
  { from: 'PENDING_HOL', to: 'HOL_APPROVED', allowedRoles: ['HOL'] },
  { from: 'HOL_APPROVED', to: 'COMPLETED', allowedRoles: ['USER'], requireOwner: true },
] as const;

/**
 * Validates whether a state transition is allowed based on the RBAC matrix and ownership.
 * Follows SRP with <= 25 lines of logic.
 */
export function validateTransition(
  currentStatus: ContractStatus,
  targetStatus: ContractStatus,
  createdByUid: string,
  user: TransitionUserContext
): ValidationResult {
  const rule = TRANSITION_RULES.find(
    (r) => r.from === currentStatus && r.to === targetStatus
  );

  if (!rule) {
    return {
      allowed: false,
      reason: `Chuyển đổi từ ${currentStatus} sang ${targetStatus} không hợp lệ trong State Machine.`,
    };
  }

  if (!rule.allowedRoles.includes(user.role)) {
    return {
      allowed: false,
      reason: `Vai trò ${user.role} không được phép thực hiện chuyển sang ${targetStatus}.`,
    };
  }

  if (rule.requireOwner && createdByUid !== user.uid) {
    return {
      allowed: false,
      reason: 'Chỉ người phụ trách tạo hợp đồng mới có quyền thực hiện hành động này.',
    };
  }

  return { allowed: true };
}

export interface ContractStateUpdates {
  status: ContractStatus;
  rejectCount?: number;
  isArchived?: boolean;
}

/**
 * Computes status-driven field updates such as rejectCount and isArchived.
 * Follows SRP with <= 25 lines of logic.
 */
export function computeStatusUpdates(
  currentContract: Pick<ContractDocument, 'status' | 'rejectCount' | 'isArchived'>,
  targetStatus: ContractStatus
): ContractStateUpdates {
  const updates: ContractStateUpdates = { status: targetStatus };

  if (currentContract.status === 'USER_REVISING' && targetStatus === 'PENDING_LEGAL') {
    updates.rejectCount = (currentContract.rejectCount || 0) + 1;
  }

  if (targetStatus === 'COMPLETED') {
    updates.isArchived = true;
  }

  return updates;
}
