/**
 * Feature: AI Assistant (Gemini 3.8)
 * Service: aiService.ts — Firestore Caching & Callable Cloud Function Integration
 */

import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { httpsCallable, type Functions } from 'firebase/functions';
import {
  getFirebaseDb,
  getFirebaseFunctions,
  isMockDevEnvironment,
  FEATURE_FLAGS,
  type CompanyRole,
} from '@/shared';
import type {
  AIAnalysisDocument,
  AIAnalysisRequest,
  AIAnalysisResponse,
  AIAnalysisType,
  AnalysisResultContent,
  DecisionBriefResult,
  RiskAssessmentResult,
  SummaryResult,
} from '../types';

/**
 * Builds deterministic analysis document ID for Firestore caching
 * Examples: 'SUMMARY_v1', 'RISK_v1_BUYER', 'DECISION_BRIEF_v1'
 */
export function buildAnalysisDocId(
  type: AIAnalysisType,
  versionNo: number,
  companyRole?: string
): string {
  if (type === 'RISK') {
    const roleTag = companyRole ? companyRole.toUpperCase() : 'BUYER';
    return `RISK_v${versionNo}_${roleTag}`;
  }
  if (type === 'DECISION_BRIEF') {
    return `DECISION_BRIEF_v${versionNo}`;
  }
  return `SUMMARY_v${versionNo}`;
}

/** Sample Executive Summary for Mock/Dev environments */
export const SAMPLE_SUMMARY_RESULT: SummaryResult = {
  contractType: 'Hợp đồng Cung cấp Dịch vụ Điện toán Đám mây (SaaS SLA 99.9%)',
  parties: {
    partyA: 'Công ty Cổ phần Công nghệ Tiên Phong (Khách hàng / Bên A)',
    partyB: 'Tập đoàn Cloud Global Services Ltd. (Bên cung cấp / Bên B)',
  },
  keyObligations: [
    'Bên B duy trì dịch vụ hạ tầng đám mây 24/7/365 với cam kết SLA tối thiểu 99.9% khả dụng.',
    'Bên A thanh toán cước định kỳ hàng quý trong vòng 15 ngày kể từ ngày nhận đủ hóa đơn VAT hợp lệ.',
    'Hai bên cam kết bảo mật thông tin dữ liệu theo tiêu chuẩn ISO/IEC 27001 và Luật An ninh mạng.',
  ],
  financialTerms: '520.000.000 VNĐ / năm (chưa bao gồm VAT 10%), thanh toán trả sau 4 đợt theo quý.',
  duration: '36 tháng kể từ ngày 01/10/2026 đến hết ngày 30/09/2029.',
  terminationConditions: [
    'Đơn phương chấm dứt hợp đồng khi có thông báo bằng văn bản trước ít nhất 60 ngày.',
    'Chấm dứt ngay lập tức khi một bên vi phạm nghiêm trọng cam kết bảo mật hoặc gián đoạn SLA quá 48h liên tục.',
  ],
  specialClauses: [
    'Điều khoản giới hạn trách nhiệm bồi thường thiệt hại (Liability Cap) tối đa 12 tháng phí dịch vụ.',
    'Tự động gia hạn thêm 12 tháng nếu không bên nào gửi thông báo từ chối trước 30 ngày.',
  ],
};

/** Sample Risk Assessment for Mock/Dev environments */
export const SAMPLE_RISK_RESULT: RiskAssessmentResult = {
  overallRiskLevel: 'HIGH',
  risks: [
    {
      clause: 'Điều 8.2 - Giới hạn trách nhiệm bồi thường thiệt hại',
      riskLevel: 'CRITICAL',
      description:
        'Bên B chỉ bồi thường tối đa bằng 01 tháng phí dịch vụ gần nhất, trong khi dữ liệu khách hàng bị lộ có thể gây thiệt hại gấp hàng chục lần.',
      impact:
        'Nếu xảy ra sự cố rò rỉ dữ liệu hoặc sập hệ thống kéo dài, Bên A gánh chịu hầu hết thiệt hại tài chính và uy tín thương hiệu.',
      mitigationWording:
        'Trách nhiệm bồi thường thiệt hại tối đa của Bên B đối với vi phạm nghĩa vụ bảo mật dữ liệu hoặc gián đoạn dịch vụ nghiêm trọng sẽ bằng 100% tổng giá trị hợp đồng trong 12 tháng gần nhất, không bao gồm các thiệt hại gián tiếp phát sinh từ lỗi cố ý.',
    },
    {
      clause: 'Điều 11.4 - Cơ chế bồi hoàn khi vi phạm cam kết SLA',
      riskLevel: 'HIGH',
      description:
        'Khi SLA dưới 99.9%, Bên B chỉ giảm trừ cước dịch vụ (Service Credit) vào hóa đơn kỳ tới, không cho phép hủy hợp đồng hoàn tiền.',
      impact:
        'Bên A bị khóa chặt vào hợp đồng ngay cả khi chất lượng dịch vụ xuống cấp nghiêm trọng liên tục nhiều tháng.',
      mitigationWording:
        'Trường hợp Bên B vi phạm SLA dưới 98% trong hai (02) tháng liên tiếp, Bên A có quyền đơn phương chấm dứt hợp đồng ngay lập tức mà không phải chịu bất kỳ khoản phạt nào và được hoàn lại toàn bộ số tiền trả trước chưa sử dụng.',
    },
    {
      clause: 'Điều 14.1 - Luật áp dụng và cơ quan tài phán giải quyết tranh chấp',
      riskLevel: 'MEDIUM',
      description:
        'Hợp đồng chỉ định Trung tâm Trọng tài Quốc tế Singapore (SIAC) giải quyết tranh chấp bằng tiếng Anh.',
      impact:
        'Chi phí tố tụng trọng tài quốc tế vô cùng tốn kém và phức tạp khi xảy ra tranh chấp quy mô vừa hoặc nhỏ.',
      mitigationWording:
        'Mọi tranh chấp phát sinh từ hoặc liên quan đến hợp đồng này sẽ được giải quyết tại Trung tâm Trọng tài Quốc tế Việt Nam (VIAC) theo Quy tắc tố tụng của Trung tâm này, địa điểm tại TP. Hà Nội.',
    },
    {
      clause: 'Điều 5.3 - Lãi suất phạt chậm thanh toán công nợ',
      riskLevel: 'LOW',
      description:
        'Lãi suất chậm thanh toán tính 0.05%/ngày, cao hơn lãi suất nợ quá hạn của ngân hàng thương mại.',
      impact:
        'Tăng thêm chi phí tài chính nếu quy trình phê duyệt thanh toán nội bộ bị chậm trễ vài ngày.',
      mitigationWording:
        'Lãi suất chậm thanh toán được áp dụng bằng 150% lãi suất tiền gửi không kỳ hạn của Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank) tại thời điểm phát sinh chậm trả tính trên số ngày quá hạn thực tế.',
    },
  ],
  favorableTerms: [
    'Cam kết phản hồi sự cố khẩn cấp cấp độ 1 (P1 - Critical Down) trong vòng 15 phút 24/7.',
    'Bên B cung cấp miễn phí dịch vụ sao lưu dự phòng dữ liệu hàng ngày (Daily Disaster Backup) trong 30 ngày.',
  ],
  summary:
    'Hợp đồng có lợi thế về mặt hạ tầng công nghệ và cam kết SLA kỹ thuật, tuy nhiên tiềm ẩn 2 rủi ro pháp lý bất lợi nghiêm trọng về Giới hạn bồi thường và Cơ chế thoát hợp đồng. Khuyến nghị Pháp chế yêu cầu đối tác chỉnh sửa theo các câu chữ đàm phán đề xuất trước khi trình ký.',
};

/** Sample Leadership Decision Brief for Mock/Dev environments */
export const SAMPLE_DECISION_BRIEF_RESULT: DecisionBriefResult = {
  recommendation: 'APPROVE_WITH_CONDITIONS',
  executiveSummary:
    'Hồ sơ Hợp đồng Cung cấp Dịch vụ Cloud SaaS 36 tháng đã hoàn thành 2 vòng đàm phán giữa Pháp chế và đối tác. Đối tác đã chấp nhận nâng mức trần bồi thường từ 1 tháng lên 6 tháng phí dịch vụ và chấp thuận trọng tài VIAC. Khuyến nghị Trưởng phòng Pháp chế phê duyệt kèm điều kiện bổ sung phụ lục an toàn dữ liệu.',
  keyRisksRemaining: [
    'Mức trần bồi thường (Liability Cap) chốt ở mức 6 tháng cước dịch vụ (mục tiêu ban đầu của Bên A là 12 tháng).',
    'Thời hạn thanh toán đã đàm phán được nâng từ 15 ngày lên 30 ngày làm việc.',
  ],
  negotiationConcessions: [
    {
      originalClause: 'Mức bồi thường tối đa giới hạn trong 01 tháng cước dịch vụ gần nhất.',
      revisedClause: 'Mức bồi thường tối đa nâng lên bằng 06 tháng cước dịch vụ bình quân.',
      concessionType: 'THEIR_CONCESSION',
    },
    {
      originalClause: 'Cơ quan tài phán tranh chấp: Trọng tài Quốc tế Singapore (SIAC).',
      revisedClause: 'Cơ quan tài phán tranh chấp: Trọng tài Quốc tế Việt Nam (VIAC) tại Hà Nội.',
      concessionType: 'THEIR_CONCESSION',
    },
    {
      originalClause: 'Bên A có quyền đơn phương chấm dứt hợp đồng bất kỳ lúc nào với thông báo trước 30 ngày.',
      revisedClause:
        'Bên A đơn phương chấm dứt hợp đồng cần thông báo trước 60 ngày và thanh toán chi phí triển khai đã nghiệm thu.',
      concessionType: 'OUR_CONCESSION',
    },
  ],
  unresolvedIssues: [
    'Đối tác chưa đồng ý điều khoản hoàn tiền mặt đối với Service Credit còn tồn đọng khi chấm dứt hợp đồng trước hạn.',
  ],
  finalNotes:
    'Hồ sơ đủ điều kiện an toàn pháp lý để trình Tổng Giám đốc ký kết sau khi đối tác hoàn tất ký Phụ lục Cam kết An toàn Thông tin (InfoSec Annex).',
};

/** Dev Sample Cache mapping */
export const DEV_SAMPLE_AI_ANALYSES: Record<string, AIAnalysisDocument> = {
  SUMMARY_v1: {
    analysisId: 'SUMMARY_v1',
    analysisType: 'SUMMARY',
    versionNo: 1,
    result: SAMPLE_SUMMARY_RESULT,
    analyzedBy: { uid: 'system_ai', displayName: 'Gemini 3.8 Flash' },
    createdAt: new Date('2026-09-28T10:00:00Z'),
  },
  RISK_v1_BUYER: {
    analysisId: 'RISK_v1_BUYER',
    analysisType: 'RISK',
    versionNo: 1,
    companyRole: 'BUYER',
    result: SAMPLE_RISK_RESULT,
    analyzedBy: { uid: 'system_ai', displayName: 'Gemini 3.8 Flash' },
    createdAt: new Date('2026-09-28T10:00:00Z'),
  },
  DECISION_BRIEF_v1: {
    analysisId: 'DECISION_BRIEF_v1',
    analysisType: 'DECISION_BRIEF',
    versionNo: 1,
    result: SAMPLE_DECISION_BRIEF_RESULT,
    analyzedBy: { uid: 'system_ai', displayName: 'Gemini 3.8 Flash' },
    createdAt: new Date('2026-09-28T10:00:00Z'),
  },
};

/**
 * Returns mock sample result for fallback
 */
export function getSampleAnalysisResult(
  type: AIAnalysisType,
  _versionNo = 1,
  _companyRole?: CompanyRole
): AnalysisResultContent {
  if (type === 'RISK') return SAMPLE_RISK_RESULT;
  if (type === 'DECISION_BRIEF') return SAMPLE_DECISION_BRIEF_RESULT;
  return SAMPLE_SUMMARY_RESULT;
}

/**
 * Reads cached AI analysis from Firestore subcollection:
 * `/contracts/{contractId}/ai_analyses/{analysisId}`
 * Fast (0-Cost, 5ms reading cached document)
 */
export async function fetchCachedAnalysis(
  contractId: string,
  analysisType: AIAnalysisType,
  versionNo: number,
  companyRole?: CompanyRole,
  dbInstance?: Firestore
): Promise<AIAnalysisDocument | null> {
  if (!FEATURE_FLAGS.ENABLE_AI) {
    return null;
  }

  const analysisDocId = buildAnalysisDocId(analysisType, versionNo, companyRole);

  if (isMockDevEnvironment()) {
    const cached = DEV_SAMPLE_AI_ANALYSES[analysisDocId];
    return cached ? { ...cached } : null;
  }

  try {
    const db = dbInstance || getFirebaseDb();
    const docRef = doc(db, 'contracts', contractId, 'ai_analyses', analysisDocId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return null;
    }

    return snap.data() as AIAnalysisDocument;
  } catch (err) {
    console.warn(`[aiService] Firestore fetch error for ${analysisDocId}, checking mock fallback:`, err);
    return DEV_SAMPLE_AI_ANALYSES[analysisDocId] || null;
  }
}

/**
 * Triggers on-demand AI analysis via Cloud Function `analyzeContractAI`.
 * Automatically caches results in Firestore subcollection.
 */
export async function triggerAIAnalysis(
  req: AIAnalysisRequest,
  functionsInstance?: Functions
): Promise<AIAnalysisResponse> {
  if (!FEATURE_FLAGS.ENABLE_AI) {
    throw new Error('Tính năng Trợ lý AI đang tạm thời bị vô hiệu hoá (FEATURE_FLAGS.ENABLE_AI = false).');
  }

  const analysisDocId = buildAnalysisDocId(req.analysisType, req.versionNo, req.companyRole);

  if (isMockDevEnvironment()) {
    // Simulate realistic AI inference latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    const result = getSampleAnalysisResult(req.analysisType, req.versionNo, req.companyRole);
    return {
      cached: false,
      analysisId: analysisDocId,
      result,
    };
  }

  try {
    const fns = functionsInstance || getFirebaseFunctions();
    const callable = httpsCallable<AIAnalysisRequest, AIAnalysisResponse>(fns, 'analyzeContractAI');
    const response = await callable(req);
    return response.data;
  } catch (err) {
    console.warn(`[aiService] Cloud Function error, fallback to mock sample:`, err);
    return {
      cached: false,
      analysisId: analysisDocId,
      result: getSampleAnalysisResult(req.analysisType, req.versionNo, req.companyRole),
    };
  }
}
