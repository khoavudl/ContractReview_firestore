import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getDb } from '../../config/firebaseAdmin.js';
import type { ContractDocument, UserRole } from '../../types/index.js';
import {
  dispatchContractEmail,
  createEmailDispatcher,
  type EmailTemplateType,
} from '../../modules/email/index.js';

export interface SendContractEmailRequest {
  contractId: string;
  templateType: EmailTemplateType;
  extraNote?: string;
}

/**
 * Callable Cloud Function: sendContractEmail
 * Triggers Outlook-ready automated notification emails for contract lifecycle events.
 */
export const sendContractEmail = onCall<SendContractEmailRequest>(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Yêu cầu đăng nhập trước khi gửi thông báo.');
    }

    const role = request.auth.token.role as UserRole | undefined;
    const isActive = request.auth.token.isActive as boolean | undefined;

    if (!role || isActive !== true) {
      throw new HttpsError(
        'permission-denied',
        'Tài khoản chưa được kích hoạt hoặc không có quyền gửi email.'
      );
    }

    const { contractId, templateType, extraNote } = request.data || {};
    if (!contractId || !templateType) {
      throw new HttpsError(
        'invalid-argument',
        'contractId và templateType là các tham số bắt buộc.'
      );
    }

    const db = getDb();
    const snap = await db.collection('contracts').doc(contractId).get();
    if (!snap.exists) {
      throw new HttpsError('not-found', `Không tìm thấy hợp đồng ${contractId}`);
    }

    const contract = snap.data() as ContractDocument;
    const actorName = (request.auth.token.name as string) || request.auth.token.email || 'Người dùng hệ thống';
    const dispatcher = createEmailDispatcher();

    const result = await dispatchContractEmail(
      db,
      dispatcher,
      contract,
      templateType,
      actorName,
      extraNote
    );

    if (!result.success) {
      throw new HttpsError('internal', `Gửi email không thành công: ${result.error}`);
    }

    return result;
  }
);
