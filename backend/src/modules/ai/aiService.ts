import * as admin from 'firebase-admin';
import type { CompanyRole, ContractDocument, UserRole } from '../../types/index.js';
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
  pdfBuffer?: Buffer
): { input: AnalysisPromptInput; schema: Record<string, unknown> } {
  if (analysisType === 'RISK') {
    const role = companyRole || contract.companyRole || 'BUYER';
    return {
      input: buildRiskPrompt(contract.title, contract.supplier, role, pdfBuffer),
      schema: RISK_SCHEMA,
    };
  }

  if (analysisType === 'DECISION_BRIEF') {
    return {
      input: buildDecisionBriefPrompt(contract.title, contract.supplier, pdfBuffer),
      schema: DECISION_BRIEF_SCHEMA,
    };
  }

  return {
    input: buildSummaryPrompt(contract.title, contract.supplier, pdfBuffer),
    schema: SUMMARY_SCHEMA,
  };
}

/**
 * Reads preview PDF from storage if available. Does not throw if missing.
 */
async function fetchPreviewBuffer(
  bucket: ReturnType<admin.storage.Storage['bucket']>,
  path?: string
): Promise<Buffer | undefined> {
  if (!path) return undefined;
  try {
    const file = bucket.file(path);
    const [exists] = await file.exists();
    if (!exists) return undefined;
    const [buffer] = await file.download();
    return buffer;
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
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
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

  const pdfBuffer = await fetchPreviewBuffer(bucket, contract.currentVersionFile?.previewPdfPath);
  const { input, schema } = resolvePromptAndSchema(request.analysisType, contract, request.companyRole, pdfBuffer);
  const result = await geminiClient.generateAnalysis<AnalysisResultContent>(input, schema);

  await analysisRef.set({
    analysisId,
    analysisType: request.analysisType,
    versionNo: request.versionNo,
    companyRole: request.companyRole,
    result,
    analyzedBy: { uid: user.uid, displayName: user.displayName },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await recordAIActivity(contractRef, request.analysisType, request.versionNo, user);
  return { cached: false, analysisId, result };
}
