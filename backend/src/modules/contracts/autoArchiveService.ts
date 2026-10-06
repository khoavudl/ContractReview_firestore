import { FieldValue } from 'firebase-admin/firestore';
import type { ActivityDocument } from '../../types/index.js';

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Checks whether an approved contract has exceeded the threshold days without completion.
 * Follows SRP with <= 25 lines of logic.
 */
export function isExpiredApprovedContract(
  updatedAt: Date | FirebaseFirestore.Timestamp | undefined,
  now: Date = new Date(),
  thresholdDays = 45
): boolean {
  if (!updatedAt) return false;
  const date = updatedAt instanceof Date
    ? updatedAt
    : typeof (updatedAt as FirebaseFirestore.Timestamp).toDate === 'function'
    ? (updatedAt as FirebaseFirestore.Timestamp).toDate()
    : new Date();

  const diffDays = (now.getTime() - date.getTime()) / MS_PER_DAY;
  return diffDays >= thresholdDays;
}

/**
 * Builds an audit activity record for auto-archive execution.
 */
export function buildAutoArchiveActivity(activityId: string): ActivityDocument {
  return {
    activityId,
    action: 'STATUS_CHANGE',
    performedBy: {
      uid: 'system',
      displayName: 'Hệ thống (Auto-Archive)',
      role: 'SYSTEM',
    },
    details: 'Hệ thống tự động lưu trữ sau 45 ngày được phê duyệt.',
    timestamp: FieldValue.serverTimestamp(),
  };
}

export interface AutoArchiveResult {
  scannedCount: number;
  archivedCount: number;
  archivedIds: string[];
}

/**
 * Scans HOL_APPROVED contracts older than thresholdDays and atomically archives them.
 * Follows SRP with <= 25 lines of logic.
 */
export async function autoArchiveExpiredContracts(
  db: FirebaseFirestore.Firestore,
  now = new Date(),
  thresholdDays = 45
): Promise<AutoArchiveResult> {
  const snapshot = await db
    .collection('contracts')
    .where('status', '==', 'HOL_APPROVED')
    .where('isArchived', '==', false)
    .get();

  const expiredDocs = snapshot.docs.filter((docSnap) =>
    isExpiredApprovedContract(docSnap.data().updatedAt, now, thresholdDays)
  );

  if (expiredDocs.length === 0) {
    return { scannedCount: snapshot.size, archivedCount: 0, archivedIds: [] };
  }

  const batch = db.batch();
  const archivedIds: string[] = [];

  for (const docSnap of expiredDocs) {
    archivedIds.push(docSnap.id);
    batch.update(docSnap.ref, {
      status: 'COMPLETED',
      isArchived: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const actRef = docSnap.ref.collection('activities').doc();
    batch.set(actRef, buildAutoArchiveActivity(actRef.id));
  }

  await batch.commit();
  return { scannedCount: snapshot.size, archivedCount: archivedIds.length, archivedIds };
}
