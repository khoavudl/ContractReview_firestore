/**
 * Contract Review System v2.0 - Core Status Enums
 * Source of Truth: new_architecture.md (Section 3 & Section 6)
 */

export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_LEGAL'
  | 'LEGAL_COMMENTED'
  | 'USER_REVISING'
  | 'LEGAL_APPROVED'
  | 'PENDING_HOL'
  | 'HOL_COMMENTED'
  | 'HOL_APPROVED'
  | 'COMPLETED';

export type UserRole = 'USER' | 'LEGAL' | 'HOL';

export type CompanyRole = 'BUYER' | 'SELLER';

export type TaskStatus = 'OPEN' | 'RESOLVED' | 'WAIVED';

export type CommentType = 'USER_RESPONSE' | 'LEGAL_COMMENT' | 'HOL_COMMENT';

export type NotificationType = 'STATUS_CHANGE' | 'NEW_COMMENT' | 'TASK_ASSIGNED';
