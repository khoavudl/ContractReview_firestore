import type {
  ContractStatus,
  CompanyRole,
  TaskStatus,
  CommentType,
  UserRole,
  NotificationType,
} from './statusEnums';

export interface AnnexFile {
  annexId: string;             // Ví dụ: 'PL01', 'PL02'
  label: string;               // Ví dụ: 'Phụ lục 01: Báo giá & Phạm vi'
  originalFileName: string;    // Tên file gốc: 'Phu_Luc_01.docx'
  storagePath: string;         // 'contracts/{contractId}/versions/v1_PL01.docx'
  sourceVersionNo: number;     // Version mà file này thực sự được tải lên/chỉnh sửa
  order: number;               // Thứ tự hiển thị (1, 2, 3...)
  isApprovedVersion?: boolean; // Đánh dấu true nếu là phiên bản đã duyệt
}

export interface ContractDocument {
  contractId: string;
  title: string;
  supplier: string;
  description: string;
  status: ContractStatus;
  currentVersion: number;
  createdBy: {
    uid: string;
    email: string;
    displayName: string;
  };
  rejectCount: number;
  isArchived: boolean;
  companyRole: CompanyRole;
  currentVersionFile: {
    versionNo: number;
    originalFileName: string;
    storagePath: string;
  };
  annexFiles?: AnnexFile[];
  approvedFile?: {
    storagePath: string;
    approvedAt: { seconds: number; nanoseconds: number } | Date;
  };
  holReminderSentAt?: { seconds: number; nanoseconds: number } | Date;
  holReminderCount?: number;
  createdAt: { seconds: number; nanoseconds: number } | Date;
  updatedAt: { seconds: number; nanoseconds: number } | Date;
}

export interface VersionDocument {
  versionId: string;
  versionNo: number;
  fileName: string;
  storagePath: string;
  action: 'INITIAL_UPLOAD' | 'USER_REVISION';
  changeSummary: string;
  negoNotes: string;
  annexFiles?: AnnexFile[];
  uploadedBy: {
    uid: string;
    displayName: string;
    email: string;
  };
  uploadedAt: { seconds: number; nanoseconds: number } | Date;
}

export interface TaskDocument {
  taskId: string;
  order: number;
  clauses: string;
  issueSummary: string;
  category: string;
  legalRecommendation: string;
  status: TaskStatus;
  userNotes: string;
  legalDecision: string;
  createdBy: {
    uid: string;
    displayName: string;
  };
  updatedAt: { seconds: number; nanoseconds: number } | Date;
}

export interface CommentDocument {
  commentId: string;
  versionNo: number;
  clauseRef?: string;
  commentText: string;
  type: CommentType;
  author: {
    uid: string;
    displayName: string;
    email: string;
    role: UserRole;
  };
  createdAt: { seconds: number; nanoseconds: number } | Date;
}

export interface NotificationItem {
  notifId: string;
  contractId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: { seconds: number; nanoseconds: number } | Date;
}
