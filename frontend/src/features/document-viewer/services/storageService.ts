/**
 * Feature: Document Viewer
 * Service: storageService — Signed URL retrieval, 15-min caching, and mock dev support
 */

import { httpsCallable, type Functions } from 'firebase/functions';
import { ref, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import { getFirebaseFunctions, getFirebaseStorage, isMockDevEnvironment } from '@/shared';
import type { SignedUrlResult, SignedUrlCacheEntry } from '../types';

// In-memory cache for signed URLs: key = "contractId:storagePath"
const signedUrlCache = new Map<string, SignedUrlCacheEntry>();

// Sample minimal base64 PDF for mock dev testing
export const MOCK_DEV_PDF_DATA_URI =
  'data:application/pdf;base64,JVBERi0xLjMKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeAErVAhUKC4pysxLV8hJLMpTSC/KTElVCM8s0VAvKUrMS08tqjTUM9Az0TPVM9cz1TMFAGi2DRgKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjQzCmVuZG9iagoyIDAgb2JqCjw8IC9UeXBlIC9QYWdlIC9QYXJlbnQgMyAwIFIgL1Jlc291cmNlcyA2IDAgUiAvQ29udGVudHMgNCAwIFIgPj4KZW5kb2JqCjYgMCBvYmoKPDwgL1Byb2NTZXQgWyAvUERGIC9UZXh0IF0gPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFsgMiAwIFIgXSAvQ291bnQgMSA+PgplbmRvYmoKMSAwIG9iajw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAzIDAgUiA+PgplbmRvYmoKMDczNwplbmRvYmoKeHJlZgowIDgKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMzkzIDAwMDAwIG4gCjAwMDAwMDAxNDIgMDAwMDAgbiAKMDAwMDAwMDMzNiAwMDAwMCBuIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAxMjMgMDAwMDAgbiAKMDAwMDAwMDIyOCAwMDAwMCBuIAowMDAwMDAwMjc1IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgOCAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKNDQyCiUlRU9G';

export function getCacheKey(contractId: string, storagePath: string): string {
  return `${contractId}:${storagePath}`;
}

export function clearSignedUrlCache(): void {
  signedUrlCache.clear();
}

/**
 * Check if a valid, unexpired signed URL exists in memory cache (TTL margin: 2 minutes)
 */
export function getCachedSignedUrl(contractId: string, storagePath: string): string | null {
  const key = getCacheKey(contractId, storagePath);
  const entry = signedUrlCache.get(key);
  if (!entry) return null;

  // Refresh 2 minutes before the 15-minute token expires
  const marginMs = 2 * 60 * 1000;
  if (Date.now() >= entry.expiresAtMs - marginMs) {
    signedUrlCache.delete(key);
    return null;
  }

  return entry.signedUrl;
}

function createMockSignedUrlResult(storagePath: string): SignedUrlResult {
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  if (storagePath.toLowerCase().endsWith('.docx')) {
    return {
      signedUrl: `https://mock-storage.local/contracts/${encodeURIComponent(storagePath)}?token=mock_15m_token`,
      expiresAt,
    };
  }
  return {
    signedUrl: MOCK_DEV_PDF_DATA_URI,
    expiresAt,
  };
}

/**
 * Fetch a fresh signed URL from Cloud Function getSignedDocumentUrl (or local mock fallback)
 */
export async function getSignedDocumentUrlFromCloud(
  contractId: string,
  storagePath: string,
  functionsInstance?: Functions,
  storageInstance?: FirebaseStorage
): Promise<SignedUrlResult> {
  if (!contractId || !storagePath) {
    throw new Error('FILE_NOT_FOUND: Tệp tin chưa được cấu hình đường dẫn lưu trữ.');
  }

  if (isMockDevEnvironment()) {
    return createMockSignedUrlResult(storagePath);
  }

  try {
    const fns = functionsInstance ?? getFirebaseFunctions();
    const callable = httpsCallable<{ contractId: string; storagePath: string }, SignedUrlResult>(
      fns,
      'getSignedDocumentUrl'
    );

    const response = await callable({ contractId, storagePath });
    return response.data;
  } catch (callableErr) {
    try {
      const storage = storageInstance ?? getFirebaseStorage();
      const fileRef = ref(storage, storagePath);
      const directUrl = await getDownloadURL(fileRef);
      return {
        signedUrl: directUrl,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
    } catch {
      throw callableErr;
    }
  }
}

/**
 * Primary API: Retrieve signed URL with automatic memory caching
 */
export async function fetchSignedDocumentUrl(
  contractId: string,
  storagePath: string,
  functionsInstance?: Functions,
  storageInstance?: FirebaseStorage
): Promise<string> {
  const cached = getCachedSignedUrl(contractId, storagePath);
  if (cached) {
    return cached;
  }

  const result = await getSignedDocumentUrlFromCloud(
    contractId,
    storagePath,
    functionsInstance,
    storageInstance
  );
  const expiresAtMs = new Date(result.expiresAt).getTime();

  signedUrlCache.set(getCacheKey(contractId, storagePath), {
    signedUrl: result.signedUrl,
    expiresAtMs: Number.isNaN(expiresAtMs) ? Date.now() + 15 * 60 * 1000 : expiresAtMs,
  });

  return result.signedUrl;
}
