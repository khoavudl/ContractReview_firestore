/**
 * Feature: Document Viewer
 * Service: storageService — Signed URL retrieval, 15-min caching, ArrayBuffer fetching, and mock dev support
 */

import { httpsCallable, type Functions } from 'firebase/functions';
import { ref, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import { getFirebaseFunctions, getFirebaseStorage, isMockDevEnvironment } from '@/shared';
import type { SignedUrlResult, SignedUrlCacheEntry } from '../types';

// In-memory cache for signed URLs: key = "contractId:storagePath"
const signedUrlCache = new Map<string, SignedUrlCacheEntry>();

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
  return {
    signedUrl: `https://mock-storage.local/contracts/${encodeURIComponent(storagePath)}?token=mock_15m_token`,
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

/**
 * Fetches binary ArrayBuffer from a signed URL.
 */
export async function fetchDocxArrayBuffer(signedUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(signedUrl);
  if (!response.ok) {
    throw new Error(`NETWORK_ERROR: Không thể tải tệp tin (${response.status} ${response.statusText}).`);
  }
  return response.arrayBuffer();
}
