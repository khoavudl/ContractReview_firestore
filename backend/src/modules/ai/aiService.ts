import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import mammoth from 'mammoth';
import type { CompanyRole, ContractDocument, TaskDocument, UserRole } from '../../types/index.js';
import type {
  AIAnalysisDocument,
  AIAnalysisType,
  AnalysisPromptInput,
  AnalysisResultContent,
  GeminiClient,
} from './aiTypes.js';
import {
  SUMMARY_SCHEMA,
  RISK_SCHEMA,
  DECISION_BRIEF_SCHEMA,
} from './aiSchemas.js';
import {
  buildSummaryPrompt,
  buildRiskPrompt,
  buildDecisionBriefPrompt,
} from './promptBuilder.js';
import {
  canPerformAIAnalysis,
  buildAnalysisId,
  canTriggerAIInStage,
} from './aiPermissionManager.js';

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

export interface AIUserContext {
  uid: string;
  role: UserRole;
  displayName: string;
}

/**
 * Resolves prompt input and structured schema according to analysis type.
 */
function resolvePromptAndSchema(
  analysisType: AIAnalysisType,
  contract: ContractDocument,
  companyRole?: CompanyRole,
  contractText?: string,
  taskListText?: string
): { input: AnalysisPromptInput; schema: Record<string, unknown> } {
  if (analysisType === 'RISK') {
    const role = companyRole || contract.companyRole || 'BUYER';
    return {
      input: buildRiskPrompt(contract.title, contract.supplier, role, contractText),
      schema: RISK_SCHEMA,
    };
  }

  if (analysisType === 'DECISION_BRIEF') {
    return {
      input: buildDecisionBriefPrompt(contract.title, contract.supplier, contractText, taskListText),
      schema: DECISION_BRIEF_SCHEMA,
    };
  }

  return {
    input: buildSummaryPrompt(contract.title, contract.supplier, contractText),
    schema: SUMMARY_SCHEMA,
  };
}

/**
 * Extracts raw text from a DOCX buffer using mammoth.
 */
export async function extractDocxText(docxBuffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: docxBuffer });
    return result.value || '';
  } catch (err) {
    console.warn('[extractDocxText] Failed to extract text from docx:', err);
    return '';
  }
}

/**
 * Reads contract DOCX file from storage and extracts text. Does not throw if missing.
 */
async function fetchContractText(
  bucket: ReturnType<admin.storage.Storage['bucket']>,
  path?: string
): Promise<string | undefined> {
  if (!path) return undefined;
  try {
    const file = bucket.file(path);
    const [exists] = await file.exists();
    if (!exists) return undefined;
    const [buffer] = await file.download();
    return await extractDocxText(buffer);
  } catch {
    return undefined;
  }
}

/**
 * Records AI analysis completion activity.
 */
async function recordAIActivity(
  contractRef: FirebaseFirestore.DocumentReference,
  analysisType: string,
  versionNo: number,
  user: AIUserContext
): Promise<void> {
  const actRef = contractRef.collection('activities').doc();
  await actRef.set({
    activityId: actRef.id,
    action: 'AI_ANALYSIS_COMPLETED',
    performedBy: { uid: user.uid, displayName: user.displayName, role: user.role },
    details: `Hoàn tất phân tích AI (${analysisType}) cho phiên bản v${versionNo}`,
    timestamp: FieldValue.serverTimestamp(),
  });
}

/**
 * Formats task list into concise text for AI context.
 * Follows SRP with <= 25 lines of logic.
 */
export function formatTasksText(tasks: TaskDocument[]): string {
  if (tasks.length === 0) {
    return 'Không có nhiệm vụ rà soát nào được ghi nhận.';
  }
  return tasks
    .map((t, idx) => {
      const parts = [
        `Nhiệm vụ #${idx + 1} (${t.category || 'OTHER'}):`,
        `- Điều khoản: ${t.clauses || 'Chưa xác định'}`,
        `- Vấn đề: ${t.issueSummary || 'Không ghi nhận'}`,
        `- Khuyến nghị Pháp chế: ${t.legalRecommendation || 'Không có'}`,
        `- Trạng thái: ${t.status} (${t.status === 'RESOLVED' ? 'Đã sửa' : t.status === 'WAIVED' ? 'Bỏ qua/Nhượng bộ' : 'Chưa xử lý'})`,
        `- Giải trình của Phụ trách: ${t.userNotes || 'Chưa phản hồi'}`,
      ];
      return parts.join('\n');
    })
    .join('\n\n');
}

/**
 * Reads tasks from Firestore subcollection /contracts/{id}/tasks and formats text.
 * Follows SRP with <= 25 lines of logic.
 */
async function fetchContractTasksText(
  contractRef: FirebaseFirestore.DocumentReference
): Promise<string> {
  try {
    const snap = await contractRef.collection('tasks').orderBy('order', 'asc').get();
    if (snap.empty) {
      return 'Không có nhiệm vụ rà soát nào được ghi nhận.';
    }
    const tasks = snap.docs.map((doc) => doc.data() as TaskDocument);
    return formatTasksText(tasks);
  } catch (err) {
    console.warn('[fetchContractTasksText] Lỗi truy vấn subcollection tasks:', err);
    return 'Không thể trích xuất danh sách nhiệm vụ rà soát.';
  }
}

/**
 * Validates eligibility to trigger new AI analysis against contract stage and locking.
 * Follows SRP with <= 25 lines of logic.
 */
function assertAIGenerationEligibility(
  contract: ContractDocument,
  user: AIUserContext
): void {
  const isOwner = contract.createdBy.uid === user.uid;
  const isApproved = contract.status === 'HOL_APPROVED' || contract.status === 'COMPLETED';
  if (isApproved) {
    throw new Error('CONTRACT_APPROVED_AI_LOCKED: Hồ sơ đã được phê duyệt chính thức. Không thể thực hiện phân tích AI mới.');
  }
  if (!canTriggerAIInStage(contract.status, user.role, isOwner)) {
    throw new Error('PERMISSION_DENIED: Bạn không có quyền chạy phân tích AI ở giai đoạn hồ sơ hiện tại.');
  }
}

/**
 * Persists AI analysis result and audit log.
 * Follows SRP with <= 25 lines of logic.
 */
async function persistAnalysisResult(
  contractRef: FirebaseFirestore.DocumentReference,
  analysisRef: FirebaseFirestore.DocumentReference,
  analysisId: string,
  request: AIAnalysisRequest,
  result: AnalysisResultContent,
  user: AIUserContext
): Promise<void> {
  await analysisRef.set({
    analysisId,
    analysisType: request.analysisType,
    versionNo: request.versionNo,
    companyRole: request.companyRole,
    result,
    analyzedBy: { uid: user.uid, displayName: user.displayName },
    createdAt: FieldValue.serverTimestamp(),
  });
  await recordAIActivity(contractRef, request.analysisType, request.versionNo, user);
}

/**
 * Executes AI contract analysis with Firestore caching and RBAC checks.
 * Follows SRP with <= 25 lines of logic.
 */
export async function executeAIAnalysis(
  db: FirebaseFirestore.Firestore,
  bucket: ReturnType<admin.storage.Storage['bucket']>,
  geminiClient: GeminiClient,
  request: AIAnalysisRequest,
  user: AIUserContext
): Promise<AIAnalysisResponse> {
  const contractRef = db.collection('contracts').doc(request.contractId);
  const snap = await contractRef.get();
  if (!snap.exists) {
    throw new Error(`CONTRACT_NOT_FOUND: Không tìm thấy hợp đồng ${request.contractId}`);
  }
  const contract = snap.data() as ContractDocument;
  const isOwner = contract.createdBy.uid === user.uid;
  if (!canPerformAIAnalysis(request.analysisType, user.role, isOwner)) {
    throw new Error('PERMISSION_DENIED: Bạn không có quyền sử dụng tính năng phân tích AI này.');
  }

  const analysisId = buildAnalysisId(request.analysisType, request.versionNo, request.companyRole);
  const analysisRef = contractRef.collection('ai_analyses').doc(analysisId);
  if (!request.forceRefresh) {
    const cachedSnap = await analysisRef.get();
    if (cachedSnap.exists) {
      return { cached: true, analysisId, result: (cachedSnap.data() as AIAnalysisDocument).result };
    }
  }

  assertAIGenerationEligibility(contract, user);
  const contractText = await fetchContractText(bucket, contract.currentVersionFile?.storagePath);
  const taskListText = request.analysisType === 'DECISION_BRIEF' ? await fetchContractTasksText(contractRef) : undefined;
  const { input, schema } = resolvePromptAndSchema(request.analysisType, contract, request.companyRole, contractText, taskListText);
  const result = await geminiClient.generateAnalysis<AnalysisResultContent>(input, schema);

  await persistAnalysisResult(contractRef, analysisRef, analysisId, request, result, user);
  return { cached: false, analysisId, result };
}
