import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getDb, getStorageBucket } from '../../config/firebaseAdmin.js';
import {
  generateDocumentSignedUrl,
  type SignedUrlRequest,
  type StorageUserContext,
} from '../../modules/storage/index.js';
import type { UserRole } from '../../types/index.js';

/**
 * Callable Cloud Function: getSignedDocumentUrl
 * Generates a temporary 15-minute signed URL for viewing or downloading contract files.
 */
export const getSignedDocumentUrl = onCall<SignedUrlRequest>(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Yêu cầu đăng nhập trước khi tải tài liệu.');
    }

    const role = request.auth.token.role as UserRole | undefined;
    const isActive = request.auth.token.isActive as boolean | undefined;

    if (!role || isActive !== true) {
      throw new HttpsError(
        'permission-denied',
        'Tài khoản chưa được kích hoạt hoặc không có quyền truy cập hệ thống.'
      );
    }

    const { contractId, storagePath } = request.data || {};
    if (!contractId || !storagePath) {
      throw new HttpsError(
        'invalid-argument',
        'contractId và storagePath là các tham số bắt buộc.'
      );
    }

    const userContext: StorageUserContext = {
      uid: request.auth.uid,
      role,
    };

    try {
      return await generateDocumentSignedUrl(
        getDb(),
        getStorageBucket(),
        { contractId, storagePath },
        userContext
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes('INVALID_ARGUMENT') || msg.includes('INVALID_PATH')) {
        throw new HttpsError('invalid-argument', msg);
      }
      if (msg.includes('CONTRACT_NOT_FOUND') || msg.includes('FILE_NOT_FOUND')) {
        throw new HttpsError('not-found', msg);
      }
      if (msg.includes('PERMISSION_DENIED')) {
        throw new HttpsError('permission-denied', msg);
      }

      throw new HttpsError('internal', msg);
    }
  }
);
