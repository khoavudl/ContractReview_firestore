import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getDb } from '../../config/firebaseAdmin.js';
import {
  executeContractTransition,
  type TransitionRequest,
  type TransitionUserContext,
} from '../../modules/contracts/index.js';
import type { UserRole } from '../../types/index.js';

/**
 * Callable Cloud Function: transitionContractStatus
 * Secure, server-side atomic state transitions for contracts.
 */
export const transitionContractStatus = onCall<TransitionRequest>(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Yêu cầu đăng nhập trước khi thực hiện.');
    }

    const role = request.auth.token.role as UserRole | undefined;
    const isActive = request.auth.token.isActive as boolean | undefined;

    if (!role || isActive !== true) {
      throw new HttpsError(
        'permission-denied',
        'Tài khoản của bạn chưa được cấp quyền (whitelist) hoặc đang bị vô hiệu hoá.'
      );
    }

    const { contractId, targetStatus, payload } = request.data || {};
    if (!contractId || !targetStatus) {
      throw new HttpsError(
        'invalid-argument',
        'contractId và targetStatus là các trường thông tin bắt buộc.'
      );
    }

    const userContext: TransitionUserContext = {
      uid: request.auth.uid,
      role,
      displayName: (request.auth.token.name as string) || request.auth.token.email || 'User',
      email: (request.auth.token.email as string) || '',
    };

    try {
      console.log(`[transitionContractStatus] Attempting transition for ${contractId} -> ${targetStatus} by ${userContext.uid} (${userContext.role})`);
      const result = await executeContractTransition(
        getDb(),
        { contractId, targetStatus, payload },
        userContext
      );
      console.log(`[transitionContractStatus] Successfully transitioned ${contractId} to ${targetStatus}`);
      return result;
    } catch (err: unknown) {
      console.error(`[transitionContractStatus] Error during transition for ${contractId}:`, err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('CONTRACT_NOT_FOUND')) {
        throw new HttpsError('not-found', msg);
      }
      if (msg.includes('TRANSITION_DENIED')) {
        throw new HttpsError('failed-precondition', msg);
      }
      throw new HttpsError('internal', msg);
    }
  }
);
