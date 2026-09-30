/**
 * Feature: Review Tasks & Workflow Action Engine
 * Module: types.ts — Domain Type Definitions & Status Configurations
 */

import type { ContractStatus } from '@/shared';

export type TaskCategory =
  | 'LEGAL'
  | 'COMMERCIAL'
  | 'SLA'
  | 'PENALTY'
  | 'CONFIDENTIALITY'
  | 'TERMINATION'
  | 'OTHER';

export type TaskStatus = 'OPEN' | 'RESOLVED' | 'WAIVED';

export interface TaskItem {
  readonly taskId: string;
  readonly order: number;
  readonly clauses: string;
  readonly category: TaskCategory;
  readonly issueSummary: string;
  readonly legalRecommendation: string;
  readonly status: TaskStatus;
  readonly userNotes: string;
  readonly legalDecision?: string;
  readonly createdBy: {
    readonly uid: string;
    readonly displayName: string;
  };
  readonly updatedAt: Date;
}

export interface CreateTaskPayload {
  readonly clauses: string;
  readonly category: TaskCategory;
  readonly issueSummary: string;
  readonly legalRecommendation: string;
}

export interface UpdateTaskPayload {
  readonly clauses?: string;
  readonly category?: TaskCategory;
  readonly issueSummary?: string;
  readonly legalRecommendation?: string;
  readonly status?: TaskStatus;
  readonly userNotes?: string;
  readonly legalDecision?: string;
}

export interface TaskCategoryMeta {
  readonly label: string;
  readonly colorScheme: 'blue' | 'indigo' | 'amber' | 'rose' | 'emerald' | 'orange' | 'slate';
}

export const TASK_CATEGORY_CONFIG: Record<TaskCategory, TaskCategoryMeta> = {
  LEGAL: { label: 'Pháp lý', colorScheme: 'indigo' },
  COMMERCIAL: { label: 'Thương mại & Giá', colorScheme: 'blue' },
  PENALTY: { label: 'Phạt & Bồi thường', colorScheme: 'rose' },
  SLA: { label: 'Tiến độ & SLA', colorScheme: 'orange' },
  CONFIDENTIALITY: { label: 'Bảo mật', colorScheme: 'amber' },
  TERMINATION: { label: 'Chấm dứt HĐ', colorScheme: 'rose' },
  OTHER: { label: 'Khác', colorScheme: 'slate' },
};

export interface TaskStatusMeta {
  readonly label: string;
  readonly variant: 'amber' | 'emerald' | 'slate';
  readonly description: string;
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, TaskStatusMeta> = {
  OPEN: {
    label: 'Cần giải trình',
    variant: 'amber',
    description: 'Chuyên viên pháp chế yêu cầu sửa đổi hoặc làm rõ',
  },
  RESOLVED: {
    label: 'Đã giải trình / Đã sửa',
    variant: 'emerald',
    description: 'Người phụ trách đã chỉnh lý và cập nhật giải trình',
  },
  WAIVED: {
    label: 'Bỏ qua / Miễn áp dụng',
    variant: 'slate',
    description: 'Hai bên thống nhất giữ nguyên hoặc không áp dụng',
  },
};

export type WorkflowActionType =
  | 'SUBMIT_TO_LEGAL'
  | 'SEND_LEGAL_TASKS'
  | 'START_REVISING'
  | 'RESUBMIT_REVISION'
  | 'APPROVE_LEGAL'
  | 'HOL_REJECT_TO_USER'
  | 'APPROVE_FINAL'
  | 'CONFIRM_WESIGN';

export interface WorkflowActionConfig {
  readonly actionType: WorkflowActionType;
  readonly label: string;
  readonly targetStatus: ContractStatus;
  readonly variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  readonly iconName: 'send' | 'check' | 'edit' | 'upload' | 'arrow-right' | 'alert-circle' | 'file-signature';
  readonly requireConfirmation?: boolean;
  readonly confirmationTitle?: string;
  readonly confirmationMessage?: string;
  readonly promptRevisionModal?: boolean;
}
