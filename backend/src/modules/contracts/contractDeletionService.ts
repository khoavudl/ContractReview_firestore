import type * as admin from 'firebase-admin';
import type { ContractDocument, ContractStatus } from '../../types/index.js';

export interface DeletionUserContext {
  uid: string;
  role: string;
  displayName?: string;
  email?: string;
}

export interface DeletionResult {
  success: boolean;
  contractId: string;
  deletedAt: string;
}

const ALLOWED_DELETION_STATUSES: readonly ContractStatus[] = ['DRAFT', 'USER_REVISING'];
const SUBCOLLECTION_NAMES = [
  'versions',
  'tasks',
  'comments',
  'activities',
  'ai_analyses',
  'reference_files',
] as const;

/**
 * Validates that user is the owner and the contract is in an allowable status.
 */
export function validateDeletionEligibility(
  contract: ContractDocument,
  user: DeletionUserContext
): void {
  if (contract.createdBy.uid !== user.uid) {
    throw new Error('PERMISSION_DENIED: Chỉ người tạo hợp đồng mới có quyền xóa hồ sơ này.');
  }

  if (!ALLOWED_DELETION_STATUSES.includes(contract.status)) {
    throw new Error(
      `DELETION_DENIED: Không thể xóa hồ sơ ở trạng thái ${contract.status}. Chỉ cho phép xóa ở DRAFT hoặc USER_REVISING.`
    );
  }
}

/**
 * Deletes associated storage files under contracts/{contractId}/ prefix.
 */
async function deleteStorageAssets(
  bucket: ReturnType<admin.storage.Storage['bucket']> | null | undefined,
  contractId: string
): Promise<void> {
  if (!bucket || typeof bucket.deleteFiles !== 'function') {
    return;
  }
  try {
    await bucket.deleteFiles({ prefix: `contracts/${contractId}/` });
  } catch (err: unknown) {
    console.warn(`[contractDeletionService] Storage deletion warning for ${contractId}:`, err);
  }
}

/**
 * Fallback deletion for subcollections when recursiveDelete is not available.
 */
async function deleteSubcollectionsFallback(
  contractRef: FirebaseFirestore.DocumentReference
): Promise<void> {
  for (const subName of SUBCOLLECTION_NAMES) {
    const snap = await contractRef.collection(subName).get();
    for (const doc of snap.docs) {
      await doc.ref.delete();
    }
  }
  await contractRef.delete();
}

/**
 * Recursively deletes contract document and all related subcollections from Firestore.
 */
async function deleteFirestoreHierarchy(
  db: FirebaseFirestore.Firestore,
  contractRef: FirebaseFirestore.DocumentReference
): Promise<void> {
  if (typeof db.recursiveDelete === 'function') {
    await db.recursiveDelete(contractRef);
  } else {
    await deleteSubcollectionsFallback(contractRef);
  }
}

/**
 * Orchestrates full contract deletion across Firestore and Firebase Storage.
 */
export async function executeContractDeletion(
  db: FirebaseFirestore.Firestore,
  bucket: ReturnType<admin.storage.Storage['bucket']> | null | undefined,
  contractId: string,
  user: DeletionUserContext
): Promise<DeletionResult> {
  const contractRef = db.collection('contracts').doc(contractId);
  const snap = await contractRef.get();
  if (!snap.exists) {
    throw new Error(`CONTRACT_NOT_FOUND: Không tìm thấy hồ sơ hợp đồng ${contractId}.`);
  }

  const contract = snap.data() as ContractDocument;
  validateDeletionEligibility(contract, user);

  await deleteStorageAssets(bucket, contractId);
  await deleteFirestoreHierarchy(db, contractRef);

  return {
    success: true,
    contractId,
    deletedAt: new Date().toISOString(),
  };
}
