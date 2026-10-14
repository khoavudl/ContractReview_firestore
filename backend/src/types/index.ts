/**
 * Domain Types for Backend Cloud Functions
 * Matching Cloud Firestore Data Schema in new_architecture.md
 */

export type UserRole = 'USER' | 'LEGAL' | 'HOL';

export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

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

export type CompanyRole = 'BUYER' | 'SELLER';

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
    approvedAt: FirebaseFirestore.Timestamp;
  };
  holReminderSentAt?: FirebaseFirestore.Timestamp;
  holReminderCount?: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
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
  uploadedAt: FirebaseFirestore.Timestamp;
}

export type TaskStatus = 'OPEN' | 'RESOLVED' | 'WAIVED';

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
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface CommentDocument {
  commentId: string;
  versionNo: number;
  commentText: string;
  type: 'USER_RESPONSE' | 'LEGAL_COMMENT' | 'HOL_COMMENT';
  author: {
    uid: string;
    displayName: string;
    email: string;
    role: UserRole;
  };
  createdAt: FirebaseFirestore.Timestamp;
}

export interface ActivityDocument {
  activityId: string;
  action: string;
  performedBy: {
    uid: string;
    displayName: string;
    role: UserRole | 'SYSTEM';
  };
  details: string;
  timestamp: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
}

export interface NotificationItem {
  notifId: string;
  contractId: string;
  title: string;
  message: string;
  type: 'STATUS_CHANGE' | 'NEW_COMMENT' | 'TASK_ASSIGNED';
  isRead: boolean;
  createdAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
}
