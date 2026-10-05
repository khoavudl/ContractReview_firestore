import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getDb } from '../../config/firebaseAdmin.js';
import { FEATURES } from '../../config/features.js';
import type { ContractDocument, ContractStatus } from '../../types/index.js';
import {
  dispatchContractEmail,
  createEmailDispatcher,
  type EmailTemplateType,
} from '../../modules/email/index.js';

/**
 * Maps a contract status transition to the corresponding email template type.
 * Follows SRP with <= 25 lines of logic.
 */
export function resolveStatusChangeEmailTemplate(
  fromStatus?: ContractStatus,
  toStatus?: ContractStatus
): EmailTemplateType | null {
  if (!fromStatus || !toStatus || fromStatus === toStatus) return null;

  if (fromStatus === 'DRAFT' && toStatus === 'PENDING_LEGAL') {
    return 'NEW_SUBMISSION';
  }
  if (
    fromStatus === 'PENDING_LEGAL' &&
    (toStatus === 'USER_REVISING' || toStatus === 'LEGAL_COMMENTED')
  ) {
    return 'TASK_LIST_ASSIGNED';
  }
  if (
    (fromStatus === 'USER_REVISING' || fromStatus === 'LEGAL_COMMENTED' || fromStatus === 'HOL_COMMENTED') &&
    toStatus === 'PENDING_LEGAL'
  ) {
    return 'RESUBMISSION';
  }
  if (fromStatus === 'PENDING_LEGAL' && (toStatus === 'PENDING_HOL' || toStatus === 'LEGAL_APPROVED')) {
    return 'LEGAL_APPROVED';
  }
  if (
    fromStatus === 'PENDING_HOL' &&
    (toStatus === 'USER_REVISING' || toStatus === 'HOL_COMMENTED')
  ) {
    return 'HOL_COMMENTED';
  }
  if (fromStatus === 'PENDING_HOL' && toStatus === 'HOL_APPROVED') {
    return 'HOL_APPROVED';
  }

  return null;
}

/**
 * Extracts actor display name and extra notes from the most recent system comment.
 * Follows SRP with <= 25 lines of logic.
 */
export async function extractTransitionMetadata(
  contractRef: FirebaseFirestore.DocumentReference
): Promise<{ actorName: string; extraNote?: string }> {
  try {
    const commentsSnap = await contractRef
      .collection('comments')
      .where('type', '==', 'SYSTEM_STATUS_CHANGE')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!commentsSnap.empty) {
      const data = commentsSnap.docs[0].data();
      const author = data.author;
      const actorName = author?.displayName || author?.email || 'Người dùng hệ thống';
      const extraNote = (data.rejectReason || data.changeSummary || '') as string;
      return { actorName, extraNote: extraNote ? extraNote.trim() : undefined };
    }
  } catch (err) {
    console.warn('[onContractStatusChanged] Failed to fetch transition comment metadata:', err);
  }

  return { actorName: 'Người dùng hệ thống' };
}

/**
 * Cloud Function v2 Firestore Trigger:
 * Listens to updates on `/contracts/{contractId}` and sends email notifications on status transitions.
 */
export const onContractStatusChanged = onDocumentUpdated(
  { document: 'contracts/{contractId}', region: 'asia-southeast1' },
  async (event) => {
    if (!FEATURES.ENABLE_EMAIL || !event.data) {
      return;
    }

    const beforeSnap = event.data.before;
    const afterSnap = event.data.after;

    if (!beforeSnap.exists || !afterSnap.exists) {
      return;
    }

    const beforeData = beforeSnap.data() as ContractDocument;
    const afterData = afterSnap.data() as ContractDocument;

    const templateType = resolveStatusChangeEmailTemplate(
      beforeData.status,
      afterData.status
    );

    if (!templateType) {
      return;
    }

    const { actorName, extraNote } = await extractTransitionMetadata(afterSnap.ref);
    const db = getDb();
    const dispatcher = createEmailDispatcher();

    const result = await dispatchContractEmail(
      db,
      dispatcher,
      afterData,
      templateType,
      actorName,
      extraNote
    );

    if (!result.success) {
      console.warn(
        `[onContractStatusChanged] Failed to dispatch email [${templateType}] for ${afterData.contractId}:`,
        result.error
      );
    } else {
      console.log(
        `[onContractStatusChanged] Dispatched email [${templateType}] for ${afterData.contractId}`
      );
    }
  }
);
