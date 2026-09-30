import type { CompanyRole, UserRole } from '@/shared';

export type AIAnalysisType = 'SUMMARY' | 'RISK' | 'DECISION_BRIEF';

/** Summary of contract content for USER / general review */
export interface SummaryResult {
  contractType: string;
  parties: {
    partyA: string;
    partyB: string;
  };
  keyObligations: string[];
  financialTerms: string;
  duration: string;
  terminationConditions: string[];
  specialClauses: string[];
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ContractRiskItem {
  clause: string;
  riskLevel: RiskLevel;
  description: string;
  impact: string;
  mitigationWording: string;
}

/** In-depth risk evaluation for LEGAL based on BUYER/SELLER position */
export interface RiskAssessmentResult {
  overallRiskLevel: RiskLevel;
  risks: ContractRiskItem[];
  favorableTerms: string[];
  summary: string;
}

export type DecisionRecommendation = 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'REJECT';

export interface ConcessionItem {
  originalClause: string;
  revisedClause: string;
  concessionType: 'OUR_CONCESSION' | 'THEIR_CONCESSION' | 'MUTUAL';
}

/** Executive decision brief for Head of Legal prior to final sign-off */
export interface DecisionBriefResult {
  recommendation: DecisionRecommendation;
  executiveSummary: string;
  keyRisksRemaining: string[];
  negotiationConcessions: ConcessionItem[];
  unresolvedIssues: string[];
  finalNotes: string;
}

export type AnalysisResultContent =
  | SummaryResult
  | RiskAssessmentResult
  | DecisionBriefResult;

export interface AIAnalysisDocument {
  analysisId: string;
  analysisType: AIAnalysisType;
  versionNo: number;
  companyRole?: CompanyRole;
  result: AnalysisResultContent;
  analyzedBy: {
    uid: string;
    displayName: string;
  };
  createdAt: { seconds: number; nanoseconds: number } | string | Date;
}

export interface AIAnalysisRequest {
  contractId: string;
  analysisType: AIAnalysisType;
  versionNo: number;
  companyRole?: CompanyRole;
  forceRefresh?: boolean;
}

export interface AIAnalysisResponse {
  cached: boolean;
  analysisId: string;
  result: AnalysisResultContent;
}

export interface TabConfigItem {
  id: AIAnalysisType;
  label: string;
  shortLabel: string;
  description: string;
  allowedRoles: UserRole[];
}

export const AI_TABS_CONFIG: readonly TabConfigItem[] = [
  {
    id: 'SUMMARY',
    label: 'Tóm Tắt Điều Hành',
    shortLabel: 'Tóm tắt',
    description: 'Các điều khoản cốt lõi, bên tham gia, nghĩa vụ tài chính và thời hạn',
    allowedRoles: ['USER', 'LEGAL', 'HOL'],
  },
  {
    id: 'RISK',
    label: 'Radar Đánh Giá Rủi Ro',
    shortLabel: 'Rủi ro & Đề xuất',
    description: 'Phân loại rủi ro theo vị thế và câu chữ đàm phán đề xuất chỉnh sửa',
    allowedRoles: ['LEGAL', 'HOL'],
  },
  {
    id: 'DECISION_BRIEF',
    label: 'Bản Tóm Lược Quyết Định',
    shortLabel: 'Bản quyết định',
    description: 'Bản khuyến nghị duyệt ký, nhượng bộ đàm phán và lưu ý của Trưởng phòng',
    allowedRoles: ['HOL'],
  },
] as const;

export const RISK_LEVEL_CONFIG: Record<
  RiskLevel,
  { label: string; badgeClass: string; dotClass: string; borderClass: string }
> = {
  CRITICAL: {
    label: 'Nghiêm trọng',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
    dotClass: 'bg-rose-500',
    borderClass: 'border-l-rose-500',
  },
  HIGH: {
    label: 'Rủi ro cao',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    dotClass: 'bg-amber-500',
    borderClass: 'border-l-amber-500',
  },
  MEDIUM: {
    label: 'Trung bình',
    badgeClass: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900',
    dotClass: 'bg-yellow-500',
    borderClass: 'border-l-yellow-500',
  },
  LOW: {
    label: 'Thấp',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
    dotClass: 'bg-blue-500',
    borderClass: 'border-l-blue-500',
  },
};

export const DECISION_RECOMMENDATION_CONFIG: Record<
  DecisionRecommendation,
  { label: string; badgeClass: string; description: string }
> = {
  APPROVE: {
    label: 'Chấp Thuận Ký Duyệt',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    description: 'Hồ sơ đã đạt chuẩn an toàn pháp lý, không còn rủi ro nghiêm trọng tồn đọng.',
  },
  APPROVE_WITH_CONDITIONS: {
    label: 'Duyệt Kèm Điều Kiện',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    description: 'Cần xác nhận văn bản giải trình các điều khoản thỏa hiệp trước khi ký kết chính thức.',
  },
  REJECT: {
    label: 'Từ Chối Ký / Yêu Cầu Đàm Phán Lại',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    description: 'Các điều khoản bất lợi nghiêm trọng chưa đạt được thỏa thuận nhượng bộ từ đối tác.',
  },
};

/** Type guard for SummaryResult */
export function isSummaryResult(res: AnalysisResultContent): res is SummaryResult {
  return 'contractType' in res && 'parties' in res;
}

/** Type guard for RiskAssessmentResult */
export function isRiskAssessmentResult(res: AnalysisResultContent): res is RiskAssessmentResult {
  return 'overallRiskLevel' in res && 'risks' in res;
}

/** Type guard for DecisionBriefResult */
export function isDecisionBriefResult(res: AnalysisResultContent): res is DecisionBriefResult {
  return 'recommendation' in res && 'negotiationConcessions' in res;
}
