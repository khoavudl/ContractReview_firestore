import type { ContractStatus } from '../types/statusEnums';

export interface StatusMeta {
  label: string;
  variant: 'slate' | 'amber' | 'orange' | 'blue' | 'indigo' | 'emerald' | 'rose';
  description: string;
}

export const STATUS_CONFIG: Record<ContractStatus, StatusMeta> = {
  DRAFT: {
    label: 'Draft',
    variant: 'slate',
    description: 'Hợp đồng mới tạo, đang hoàn thiện',
  },
  PENDING_LEGAL: {
    label: 'Legal Review',
    variant: 'amber',
    description: 'Đã nộp, chờ chuyên viên pháp chế rà soát',
  },
  LEGAL_COMMENTED: {
    label: 'User Revise',
    variant: 'orange',
    description: 'Pháp chế đã tạo danh sách nhiệm vụ rà soát',
  },
  USER_REVISING: {
    label: 'User Revise',
    variant: 'orange',
    description: 'Người phụ trách đang cập nhật theo ý kiến góp ý',
  },
  LEGAL_APPROVED: {
    label: 'Head Review',
    variant: 'blue',
    description: 'Pháp chế thẩm định đạt, chuyển Trưởng phòng',
  },
  PENDING_HOL: {
    label: 'Head Review',
    variant: 'indigo',
    description: 'Hồ sơ đang chờ Head of Legal xem xét phê duyệt',
  },
  HOL_COMMENTED: {
    label: 'User Revise',
    variant: 'rose',
    description: 'Head of Legal từ chối hoặc yêu cầu làm rõ',
  },
  HOL_APPROVED: {
    label: 'Approved',
    variant: 'emerald',
    description: 'Trưởng phòng đã ký duyệt chính thức',
  },
  COMPLETED: {
    label: 'Done WeSign',
    variant: 'slate',
    description: 'Đã hoàn tất ký số và lưu trữ hồ sơ',
  },
};

export type MetricGroupId = 'draft' | 'legal' | 'head' | 'approved';

export const METRIC_GROUPS: Record<MetricGroupId, readonly ContractStatus[]> = {
  draft: ['DRAFT', 'USER_REVISING', 'LEGAL_COMMENTED', 'HOL_COMMENTED'],
  legal: ['PENDING_LEGAL'],
  head: ['PENDING_HOL', 'LEGAL_APPROVED'],
  approved: ['HOL_APPROVED', 'COMPLETED'],
};

/**
 * Returns configuration metadata for a contract status.
 */
export function getStatusMeta(status: ContractStatus): StatusMeta {
  return STATUS_CONFIG[status] ?? {
    label: status,
    variant: 'slate',
    description: 'Không xác định',
  };
}

/**
 * Finds which metric card group a status belongs to.
 */
export function getMetricGroup(status: ContractStatus): MetricGroupId {
  if (METRIC_GROUPS.draft.includes(status)) return 'draft';
  if (METRIC_GROUPS.legal.includes(status)) return 'legal';
  if (METRIC_GROUPS.head.includes(status)) return 'head';
  return 'approved';
}
