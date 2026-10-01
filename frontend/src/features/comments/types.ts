import type { UserRole } from '@/shared';

export type CommentType =
  | 'USER_RESPONSE'
  | 'LEGAL_COMMENT'
  | 'HOL_COMMENT'
  | 'SYSTEM_VERSION_UPLOAD'
  | 'SYSTEM_STATUS_CHANGE';

export interface CommentAuthor {
  uid: string;
  displayName: string;
  email?: string;
  role: UserRole | 'SYSTEM';
}

export interface CommentDocument {
  commentId: string;
  versionNo: number;
  commentText: string;
  type: CommentType;
  author: CommentAuthor;
  createdAt: Date | { seconds: number; nanoseconds: number } | string;
  changeSummary?: string;
  rejectReason?: string;
  statusLabel?: string;
  statusIcon?: string;
}

export interface CreateCommentPayload {
  versionNo: number;
  commentText: string;
}

export interface CreateSystemEventPayload {
  eventType: 'SYSTEM_VERSION_UPLOAD' | 'SYSTEM_STATUS_CHANGE';
  versionNo: number;
  changeSummary?: string;
  rejectReason?: string;
  statusLabel?: string;
  statusIcon?: string;
  commentText?: string;
}

export const COMMENT_TYPE_CONFIG: Record<
  CommentType,
  { label: string; badgeClass: string; roleLabel: string }
> = {
  USER_RESPONSE: {
    label: 'Người phụ trách',
    roleLabel: 'User',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
  LEGAL_COMMENT: {
    label: 'Chuyên viên Pháp chế',
    roleLabel: 'Legal',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  },
  HOL_COMMENT: {
    label: 'Trưởng phòng Pháp chế',
    roleLabel: 'Head of Legal',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  SYSTEM_VERSION_UPLOAD: {
    label: 'Hệ thống - Phiên bản',
    roleLabel: 'System',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  },
  SYSTEM_STATUS_CHANGE: {
    label: 'Hệ thống - Trạng thái',
    roleLabel: 'System',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
};

export function resolveCommentType(role: UserRole): CommentType {
  switch (role) {
    case 'HOL':
      return 'HOL_COMMENT';
    case 'LEGAL':
      return 'LEGAL_COMMENT';
    default:
      return 'USER_RESPONSE';
  }
}
