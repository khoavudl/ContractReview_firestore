import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getDb, getStorageBucket } from '../../config/firebaseAdmin.js';
import {
  executeContractDeletion,
  type DeletionUserContext,
} from '../../modules/contracts/index.js';
import type { UserRole } from '../../types/index.js';

interface DeleteContractRequest {
  contractId: string;
}

/**
 * Callable Cloud Function: deleteContract
 * Allows contract owner to permanently delete a contract when in DRAFT or USER_REVISING.
 */
export const deleteContract = onCall<DeleteContractRequest>(
  { cors: true, region: 'asia-southeast1' },
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

    const { contractId } = request.data || {};
    if (!contractId) {
      throw new HttpsError('invalid-argument', 'contractId là trường thông tin bắt buộc.');
    }

    const userContext: DeletionUserContext = {
      uid: request.auth.uid,
      role,
      displayName: (request.auth.token.name as string) || request.auth.token.email || 'User',
      email: (request.auth.token.email as string) || '',
    };

    try {
      console.log(`[deleteContract] Attempting deletion for ${contractId} by ${userContext.uid} (${userContext.role})`);
      const result = await executeContractDeletion(
        getDb(),
        getStorageBucket(),
        contractId,
        userContext
      );
      console.log(`[deleteContract] Successfully deleted contract ${contractId}`);
      return result;
    } catch (err: unknown) {
      console.error(`[deleteContract] Error deleting contract ${contractId}:`, err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('CONTRACT_NOT_FOUND')) {
        throw new HttpsError('not-found', msg);
      }
      if (msg.includes('PERMISSION_DENIED')) {
        throw new HttpsError('permission-denied', msg);
      }
      if (msg.includes('DELETION_DENIED')) {
        throw new HttpsError('failed-precondition', msg);
      }
      throw new HttpsError('internal', msg);
    }
  }
);
