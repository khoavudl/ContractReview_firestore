import type { ContractStatus } from '../types/statusEnums';

export interface StatusMeta {
  label: string;
  variant: 'slate' | 'amber' | 'orange' | 'blue' | 'indigo' | 'emerald' | 'rose';
  description: string;
}

export const STATUS_CONFIG: Record<ContractStatus, StatusMeta> = {
  DRAFT: {
    label: 'Bản nháp',
    variant: 'slate',
    description: 'Hợp đồng mới tạo, đang hoàn thiện',
  },
  PENDING_LEGAL: {
    label: 'Chờ Pháp chế',
    variant: 'amber',
    description: 'Đã nộp, chờ chuyên viên pháp chế rà soát',
  },
  LEGAL_COMMENTED: {
    label: 'Pháp chế góp ý',
    variant: 'orange',
    description: 'Pháp chế đã tạo danh sách nhiệm vụ rà soát',
  },
  USER_REVISING: {
    label: 'Đang sửa đổi',
    variant: 'orange',
    description: 'Người phụ trách đang cập nhật theo ý kiến pháp chế',
  },
  LEGAL_APPROVED: {
    label: 'Pháp chế đã duyệt',
    variant: 'blue',
    description: 'Pháp chế thẩm định đạt, chuyển Trưởng phòng',
  },
  PENDING_HOL: {
    label: 'Chờ Trưởng phòng duyệt',
    variant: 'indigo',
    description: 'Hồ sơ đang chờ Head of Legal xem xét phê duyệt',
  },
  HOL_COMMENTED: {
    label: 'Trưởng phòng yêu cầu sửa',
    variant: 'rose',
    description: 'Head of Legal từ chối hoặc yêu cầu làm rõ',
  },
  HOL_APPROVED: {
    label: 'Đã phê duyệt',
    variant: 'emerald',
    description: 'Trưởng phòng đã ký duyệt chính thức',
  },
  COMPLETED: {
    label: 'Hoàn tất ký WeSign',
    variant: 'slate',
    description: 'Đã hoàn tất ký số và lưu trữ hồ sơ',
  },
};

export type MetricGroupId = 'draft' | 'legal' | 'head' | 'approved';

export const METRIC_GROUPS: Record<MetricGroupId, readonly ContractStatus[]> = {
  draft: ['DRAFT', 'USER_REVISING'],
  legal: ['PENDING_LEGAL', 'LEGAL_COMMENTED'],
  head: ['PENDING_HOL', 'HOL_COMMENTED', 'LEGAL_APPROVED'],
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
