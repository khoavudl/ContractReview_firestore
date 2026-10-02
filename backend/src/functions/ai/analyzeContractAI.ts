import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getDb, getStorageBucket } from '../../config/firebaseAdmin.js';
import { FEATURES } from '../../config/features.js';
import {
  executeAIAnalysis,
  GoogleGenAIClient,
  type AIAnalysisRequest,
  type AIUserContext,
} from '../../modules/ai/index.js';
import type { UserRole } from '../../types/index.js';

/**
 * Callable Cloud Function: analyzeContractAI
 * Performs contract summary, risk evaluation, or decision brief via Gemini AI.
 * Results are cached in Firestore for instantaneous and zero-cost repeat views.
 */
export const analyzeContractAI = onCall<AIAnalysisRequest>(
  { cors: true, timeoutSeconds: 120, memory: '1GiB' },
  async (request) => {
    if (!FEATURES.ENABLE_AI) {
      throw new HttpsError(
        'failed-precondition',
        'Tính năng Trợ lý AI hiện đang tạm tắt theo cấu hình hệ thống.'
      );
    }

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Yêu cầu đăng nhập trước khi sử dụng AI.');
    }

    const role = request.auth.token.role as UserRole | undefined;
    const isActive = request.auth.token.isActive as boolean | undefined;

    if (!role || isActive !== true) {
      throw new HttpsError(
        'permission-denied',
        'Tài khoản chưa được kích hoạt hoặc không có quyền sử dụng tính năng này.'
      );
    }

    const { contractId, analysisType, versionNo, companyRole, forceRefresh } = request.data || {};
    if (!contractId || !analysisType || typeof versionNo !== 'number') {
      throw new HttpsError(
        'invalid-argument',
        'contractId, analysisType và versionNo là các tham số bắt buộc.'
      );
    }

    const userContext: AIUserContext = {
      uid: request.auth.uid,
      role,
      displayName: (request.auth.token.name as string) || request.auth.token.email || 'User',
    };

    try {
      const geminiClient = new GoogleGenAIClient();
      return await executeAIAnalysis(
        getDb(),
        getStorageBucket(),
        geminiClient,
        { contractId, analysisType, versionNo, companyRole, forceRefresh },
        userContext
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes('CONTRACT_NOT_FOUND')) {
        throw new HttpsError('not-found', msg);
      }
      if (msg.includes('CONTRACT_APPROVED_AI_LOCKED')) {
        throw new HttpsError('failed-precondition', msg);
      }
      if (msg.includes('PERMISSION_DENIED')) {
        throw new HttpsError('permission-denied', msg);
      }
      if (msg.includes('INVALID_ARGUMENT')) {
        throw new HttpsError('invalid-argument', msg);
      }

      throw new HttpsError('internal', `Lỗi phân tích AI: ${msg}`);
    }
  }
);
