import * as admin from 'firebase-admin';
import type {
  ActivityDocument,
  ContractDocument,
  NotificationItem,
} from '../../types/index.js';
import {
  validateTransition,
  computeStatusUpdates,
  type TransitionRequest,
  type TransitionUserContext,
  type TransitionPayload,
} from './statusStateMachine.js';

export interface TransitionExecutionResult {
  success: boolean;
  contractId: string;
  previousStatus: string;
  newStatus: string;
  rejectCount?: number;
}

/**
 * Builds an immutable activity log record for audit trail.
 */
function buildActivityRecord(
  activityId: string,
  fromStatus: string,
  toStatus: string,
  user: TransitionUserContext,
  payload?: TransitionPayload
): ActivityDocument {
  const detailSuffix = payload?.changeSummary
    ? ` - Ghi chú: ${payload.changeSummary}`
    : payload?.rejectReason
    ? ` - Lý do: ${payload.rejectReason}`
    : '';

  return {
    activityId,
    action: 'STATUS_CHANGE',
    performedBy: {
      uid: user.uid,
      displayName: user.displayName,
      role: user.role,
    },
    details: `Chuyển trạng thái từ ${fromStatus} sang ${toStatus}${detailSuffix}`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };
}

/**
 * Resolves notification payload and target recipient based on the new status.
 */
function resolveNotification(
  contract: ContractDocument,
  toStatus: string
): { targetUid: string; title: string; message: string } | null {
  if (toStatus === 'LEGAL_COMMENTED') {
    return {
      targetUid: contract.createdBy.uid,
      title: 'Có góp ý mới từ Pháp chế',
      message: `Hồ sơ "${contract.title}" cần bạn kiểm tra Task List và chỉnh sửa.`,
    };
  }
  if (toStatus === 'HOL_COMMENTED') {
    return {
      targetUid: contract.createdBy.uid,
      title: 'Ý kiến từ Trưởng phòng Pháp chế',
      message: `Hồ sơ "${contract.title}" có ý kiến chỉ đạo từ Trưởng phòng.`,
    };
  }
  if (toStatus === 'HOL_APPROVED') {
    return {
      targetUid: contract.createdBy.uid,
      title: 'Hợp đồng đã được phê duyệt',
      message: `Hồ sơ "${contract.title}" đã được duyệt. Bạn có thể nộp ký WeSign.`,
    };
  }
  return null;
}

/**
 * Queues in-app notification within the atomic transaction.
 */
function queueNotification(
  transaction: FirebaseFirestore.Transaction,
  db: FirebaseFirestore.Firestore,
  notifInfo: { targetUid: string; title: string; message: string },
  contractId: string
): void {
  const notifRef = db
    .collection('notifications')
    .doc(notifInfo.targetUid)
    .collection('items')
    .doc();

  const item: NotificationItem = {
    notifId: notifRef.id,
    contractId,
    title: notifInfo.title,
    message: notifInfo.message,
    type: 'STATUS_CHANGE',
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  transaction.set(notifRef, item);
}

/**
 * Executes a contract state transition inside a Firestore atomic transaction.
 * Follows SRP with <= 25 lines of logic.
 */
export async function executeContractTransition(
  db: FirebaseFirestore.Firestore,
  request: TransitionRequest,
  user: TransitionUserContext
): Promise<TransitionExecutionResult> {
  const contractRef = db.collection('contracts').doc(request.contractId);

  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(contractRef);
    if (!snap.exists) {
      throw new Error(`CONTRACT_NOT_FOUND: Không tìm thấy hợp đồng ${request.contractId}`);
    }

    const contract = snap.data() as ContractDocument;
    const validation = validateTransition(
      contract.status,
      request.targetStatus,
      contract.createdBy.uid,
      user
    );

    if (!validation.allowed) {
      throw new Error(`TRANSITION_DENIED: ${validation.reason}`);
    }

    const updates = computeStatusUpdates(contract, request.targetStatus);
    transaction.update(contractRef, {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const actRef = contractRef.collection('activities').doc();
    const actDoc = buildActivityRecord(actRef.id, contract.status, request.targetStatus, user, request.payload);
    transaction.set(actRef, actDoc);

    const notif = resolveNotification(contract, request.targetStatus);
    if (notif) {
      queueNotification(transaction, db, notif, request.contractId);
    }

    return {
      success: true,
      contractId: request.contractId,
      previousStatus: contract.status,
      newStatus: request.targetStatus,
      rejectCount: updates.rejectCount ?? contract.rejectCount,
    };
  });
}
