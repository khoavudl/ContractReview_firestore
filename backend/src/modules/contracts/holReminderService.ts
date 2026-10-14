import { FieldValue } from 'firebase-admin/firestore';
import type {
  ActivityDocument,
  ContractDocument,
  NotificationItem,
  UserDocument,
} from '../../types/index.js';
import type { EmailDispatcher } from '../email/index.js';
import { dispatchContractEmail } from '../email/index.js';
import { isEligibleForHolReminder } from './businessDaysCalculator.js';

export interface HolReminderScanResult {
  scannedCount: number;
  remindedCount: number;
  remindedIds: string[];
}

/**
 * Resolves the reference date to check against overdue threshold.
 * Uses the last reminder date if exists, otherwise uses contract.updatedAt.
 */
export function resolveHolReminderReferenceDate(
  contract: Partial<Pick<ContractDocument, 'holReminderSentAt' | 'updatedAt'>>
): Date | FirebaseFirestore.Timestamp | undefined {
  return contract.holReminderSentAt || contract.updatedAt;
}

/**
 * Builds an audit activity record for reminder execution.
 */
export function buildHolReminderActivity(
  activityId: string,
  reminderCount: number
): ActivityDocument {
  return {
    activityId,
    action: 'HOL_REMINDER_SENT',
    performedBy: {
      uid: 'system',
      displayName: 'Hệ thống (Nhắc duyệt tự động)',
      role: 'SYSTEM',
    },
    details: `Đã tự động gửi email nhắc duyệt Trưởng phòng (lần ${reminderCount}) sau 2 ngày làm việc.`,
    timestamp: FieldValue.serverTimestamp(),
  };
}

/**
 * Builds an in-app notification item for HOL users.
 */
export function buildHolReminderNotification(
  notifId: string,
  contract: Pick<ContractDocument, 'contractId' | 'title'>,
  reminderCount: number
): NotificationItem {
  const contractLabel = contract.title
    ? `${contract.contractId} ("${contract.title}")`
    : contract.contractId;

  return {
    notifId,
    contractId: contract.contractId,
    title: 'Nhắc duyệt hồ sơ hợp đồng',
    message: `Hồ sơ ${contractLabel} đang chờ Trưởng phòng xem xét đã quá 2 ngày làm việc (lần ${reminderCount}).`,
    type: 'STATUS_CHANGE',
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  };
}

/**
 * Pushes in-app notifications to all active HOL users.
 * Follows SRP with <= 25 lines of logic.
 */
async function pushInAppNotificationToHol(
  db: FirebaseFirestore.Firestore,
  contract: ContractDocument,
  reminderCount: number
): Promise<void> {
  const holUsersSnap = await db
    .collection('users')
    .where('role', '==', 'HOL')
    .where('isActive', '==', true)
    .get();

  if (holUsersSnap.empty) return;

  const batch = db.batch();
  for (const docSnap of holUsersSnap.docs) {
    const user = docSnap.data() as UserDocument;
    const notifRef = db.collection('notifications').doc(user.uid).collection('items').doc();
    batch.set(notifRef, buildHolReminderNotification(notifRef.id, contract, reminderCount));
  }
  await batch.commit().catch(() => {});
}

/**
 * Dispatches reminder email, updates reminder state, and logs activity for a single contract.
 * Follows SRP with <= 25 lines of logic.
 */
async function processContractReminder(
  db: FirebaseFirestore.Firestore,
  dispatcher: EmailDispatcher,
  docRef: FirebaseFirestore.DocumentReference,
  contract: ContractDocument
): Promise<boolean> {
  const nextReminderCount = (contract.holReminderCount || 0) + 1;
  const emailResult = await dispatchContractEmail(
    db,
    dispatcher,
    contract,
    'HOL_REMINDER',
    'Hệ thống'
  );

  if (!emailResult.success) return false;

  await docRef.update({
    holReminderSentAt: FieldValue.serverTimestamp(),
    holReminderCount: nextReminderCount,
  });

  const actRef = docRef.collection('activities').doc();
  await actRef.set(buildHolReminderActivity(actRef.id, nextReminderCount)).catch(() => {});
  await pushInAppNotificationToHol(db, contract, nextReminderCount);

  return true;
}

/**
 * Scans PENDING_HOL contracts and sends reminder emails for those overdue by >= 2 business days.
 * Follows SRP with <= 25 lines of logic.
 */
export async function scanAndSendHolReminders(
  db: FirebaseFirestore.Firestore,
  dispatcher: EmailDispatcher,
  now: Date = new Date(),
  thresholdBusinessDays = 2
): Promise<HolReminderScanResult> {
  const snapshot = await db
    .collection('contracts')
    .where('status', '==', 'PENDING_HOL')
    .where('isArchived', '==', false)
    .get();

  const remindedIds: string[] = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as ContractDocument;
    const refDate = resolveHolReminderReferenceDate(data);

    if (isEligibleForHolReminder(refDate, now, thresholdBusinessDays)) {
      const success = await processContractReminder(db, dispatcher, docSnap.ref, data);
      if (success) remindedIds.push(docSnap.id);
    }
  }

  return {
    scannedCount: snapshot.size,
    remindedCount: remindedIds.length,
    remindedIds,
  };
}
