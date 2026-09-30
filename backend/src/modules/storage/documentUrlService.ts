import type * as admin from 'firebase-admin';
import type { ContractDocument } from '../../types/index.js';
import {
  parseContractStoragePath,
  canAccessContractDocument,
  type StorageUserContext,
} from './storageAccessManager.js';

export interface SignedUrlRequest {
  contractId: string;
  storagePath: string;
}

export interface SignedUrlResponse {
  signedUrl: string;
  expiresAt: string;
}

/**
 * Validates storage path syntax and ensures it matches the requested contractId.
 */
function validatePathIntegrity(contractId: string, storagePath: string): void {
  const parsed = parseContractStoragePath(storagePath);
  if (!parsed || parsed.contractId !== contractId) {
    throw new Error('INVALID_PATH: Đường dẫn tệp tin không hợp lệ hoặc không khớp với hợp đồng.');
  }
}

/**
 * Reads contract document from Firestore and verifies RBAC permissions.
 */
async function verifyContractOwnership(
  db: FirebaseFirestore.Firestore,
  contractId: string,
  user: StorageUserContext
): Promise<void> {
  const snap = await db.collection('contracts').doc(contractId).get();
  if (!snap.exists) {
    throw new Error(`CONTRACT_NOT_FOUND: Không tìm thấy hồ sơ hợp đồng ${contractId}.`);
  }

  const contract = snap.data() as ContractDocument;
  const isAllowed = canAccessContractDocument(contract.createdBy.uid, user);
  if (!isAllowed) {
    throw new Error('PERMISSION_DENIED: Bạn không có quyền truy cập tệp tin này.');
  }
}

/**
 * Generates Google Cloud Storage v4 signed URL with limited lifespan (15 minutes).
 */
async function signFileUrl(
  bucket: ReturnType<admin.storage.Storage['bucket']>,
  storagePath: string,
  expiresInMinutes: number
): Promise<SignedUrlResponse> {
  const file = bucket.file(storagePath);
  const [exists] = await file.exists();
  if (!exists) {
    throw new Error(`FILE_NOT_FOUND: Tệp tin ${storagePath} không tồn tại trên hệ thống lưu trữ.`);
  }

  const expiresMs = Date.now() + expiresInMinutes * 60 * 1000;
  const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST || process.env.STORAGE_EMULATOR_HOST;
  if (emulatorHost) {
    const bucketName = bucket.name || 'contractreview-v2.firebasestorage.app';
    const signedUrl = `http://${emulatorHost}/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media`;
    return {
      signedUrl,
      expiresAt: new Date(expiresMs).toISOString(),
    };
  }

  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: expiresMs,
  });

  return {
    signedUrl,
    expiresAt: new Date(expiresMs).toISOString(),
  };
}

/**
 * Generates a secure, temporary Signed URL for reading contract files.
 * Follows SRP with <= 25 lines of logic.
 */
export async function generateDocumentSignedUrl(
  db: FirebaseFirestore.Firestore,
  bucket: ReturnType<admin.storage.Storage['bucket']>,
  request: SignedUrlRequest,
  user: StorageUserContext,
  expiresInMinutes = 15
): Promise<SignedUrlResponse> {
  if (!request.contractId || !request.storagePath) {
    throw new Error('INVALID_ARGUMENT: contractId và storagePath là bắt buộc.');
  }

  validatePathIntegrity(request.contractId, request.storagePath);
  await verifyContractOwnership(db, request.contractId, user);
  return signFileUrl(bucket, request.storagePath, expiresInMinutes);
}
