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

interface NotificationTarget {
  targetUid: string;
  title: string;
  message: string;
}

/**
 * Queries active staff UIDs by role from Firestore /users collection.
 */
async function fetchStaffUidsByRole(
  db: FirebaseFirestore.Firestore,
  role: 'LEGAL' | 'HOL'
): Promise<string[]> {
  const snap = await db
    .collection('users')
    .where('role', '==', role)
    .where('isActive', '==', true)
    .get();

  return snap.docs.map((d) => d.id);
}

/**
 * Resolves notification targets based on the new contract status and context.
 */
function resolveNotificationTargets(
  contract: ContractDocument,
  toStatus: string,
  staffUids: string[],
  payload?: TransitionPayload
): NotificationTarget[] {
  if (toStatus === 'PENDING_LEGAL') {
    const isResubmit = contract.status === 'USER_REVISING';
    const title = isResubmit ? 'Hồ sơ đã nộp lại sau chỉnh sửa' : 'Hồ sơ hợp đồng mới cần rà soát';
    const message = isResubmit
      ? `Hồ sơ "${contract.title}" đã được người tạo cập nhật và gửi lại.`
      : `Hồ sơ "${contract.title}" vừa được gửi đến bộ phận Pháp chế.`;
    return staffUids.map((targetUid) => ({ targetUid, title, message }));
  }

  if (toStatus === 'PENDING_HOL') {
    return staffUids.map((targetUid) => ({
      targetUid,
      title: 'Hồ sơ cần Trưởng phòng phê duyệt',
      message: `Hồ sơ "${contract.title}" đã được Pháp chế duyệt và đang chờ bạn phê duyệt.`,
    }));
  }

  if (toStatus === 'LEGAL_COMMENTED') {
    return [{
      targetUid: contract.createdBy.uid,
      title: 'Có góp ý mới từ Pháp chế',
      message: `Hồ sơ "${contract.title}" cần bạn kiểm tra Task List và chỉnh sửa.`,
    }];
  }

  if (toStatus === 'HOL_COMMENTED') {
    const reasonSuffix = payload?.rejectReason ? ` (Lý do: ${payload.rejectReason})` : '';
    return [{
      targetUid: contract.createdBy.uid,
      title: 'Ý kiến từ Trưởng phòng Pháp chế',
      message: `Hồ sơ "${contract.title}" có ý kiến chỉ đạo từ Trưởng phòng.${reasonSuffix}`,
    }];
  }

  if (toStatus === 'HOL_APPROVED') {
    return [{
      targetUid: contract.createdBy.uid,
      title: 'Hợp đồng đã được phê duyệt',
      message: `Hồ sơ "${contract.title}" đã được duyệt. Bạn có thể nộp ký WeSign.`,
    }];
  }

  return [];
}

/**
 * Queues in-app notification within the atomic transaction.
 */
function queueNotification(
  transaction: FirebaseFirestore.Transaction,
  db: FirebaseFirestore.Firestore,
  notifInfo: NotificationTarget,
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
 * Resolves active staff UIDs required for notification before entering the transaction.
 */
async function resolveStaffUids(
  db: FirebaseFirestore.Firestore,
  targetStatus: string
): Promise<string[]> {
  if (targetStatus === 'PENDING_LEGAL') {
    return fetchStaffUidsByRole(db, 'LEGAL');
  }
  if (targetStatus === 'PENDING_HOL') {
    return fetchStaffUidsByRole(db, 'HOL');
  }
  return [];
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
  const staffUids = await resolveStaffUids(db, request.targetStatus);
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

    const notifs = resolveNotificationTargets(contract, request.targetStatus, staffUids, request.payload);
    for (const notif of notifs) {
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
