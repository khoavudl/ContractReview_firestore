/**
 * Feature: Document Viewer
 * Service: storageService — Direct Firebase Storage getBytes() streaming, in-memory ArrayBuffer cache & perf logging
 */

import { ref, getBytes, type FirebaseStorage } from 'firebase/storage';
import { getFirebaseStorage, isMockDevEnvironment } from '@/shared';

// In-memory cache for document ArrayBuffers: key = "contractId:storagePath"
const documentBufferCache = new Map<string, ArrayBuffer>();

// In-flight active promises to deduplicate parallel/concurrent requests
const inFlightRequests = new Map<string, Promise<ArrayBuffer>>();

export function getCacheKey(contractId: string, storagePath: string): string {
  return `${contractId}:${storagePath}`;
}

export function clearDocumentArrayBufferCache(): void {
  documentBufferCache.clear();
  inFlightRequests.clear();
}

// Backward-compatibility alias
export const clearSignedUrlCache = clearDocumentArrayBufferCache;

/**
 * Check if ArrayBuffer exists in memory cache
 */
export function getCachedDocumentBuffer(contractId: string, storagePath: string): ArrayBuffer | null {
  const key = getCacheKey(contractId, storagePath);
  return documentBufferCache.get(key) || null;
}

// Backward-compatibility alias
export function getCachedSignedUrl(contractId: string, storagePath: string): string | null {
  const buf = getCachedDocumentBuffer(contractId, storagePath);
  return buf ? 'cached://array-buffer' : null;
}

/**
 * Creates a minimal valid mock ArrayBuffer for dev/test environments
 */
export function createMockArrayBuffer(): ArrayBuffer {
  const sampleText = 'Mock DOCX Content for Dev Environment';
  const encoder = new TextEncoder();
  const uint8 = encoder.encode(sampleText);
  const buffer = new ArrayBuffer(uint8.byteLength);
  new Uint8Array(buffer).set(uint8);
  return buffer;
}

/**
 * Direct Stream: Loads Word (.docx) document binary ArrayBuffer directly from Firebase Storage via getBytes()
 * Bypasses Cloud Functions, eliminating cold-starts and public URL exposure.
 * Features automatic In-Flight Deduplication for concurrent / React StrictMode requests.
 */
export async function fetchDocumentArrayBuffer(
  contractId: string,
  storagePath: string,
  storageInstance?: FirebaseStorage
): Promise<ArrayBuffer> {
  if (!contractId || !storagePath) {
    throw new Error('FILE_NOT_FOUND: Tệp tin chưa được cấu hình đường dẫn lưu trữ.');
  }

  const cacheKey = getCacheKey(contractId, storagePath);
  const t0 = performance.now();

  // 1. Check in-memory RAM cache first (0ms)
  const cached = documentBufferCache.get(cacheKey);
  if (cached) {
    const elapsed = performance.now() - t0;
    console.log(
      `%c⚡ [DocViewer PERF] Đọc từ RAM Cache trong ${elapsed.toFixed(1)}ms | Trạng thái: Cache HIT | File: ${storagePath}`,
      'color: #10b981; font-weight: bold;'
    );
    return cached;
  }

  // 2. Check if identical request is already in-flight (deduplicate parallel/StrictMode calls)
  const existingPromise = inFlightRequests.get(cacheKey);
  if (existingPromise) {
    return existingPromise;
  }

  // 3. Initiate fetch promise and track in inFlightRequests
  const fetchPromise = (async (): Promise<ArrayBuffer> => {
    try {
      if (isMockDevEnvironment()) {
        const mockBuffer = createMockArrayBuffer();
        documentBufferCache.set(cacheKey, mockBuffer);
        console.log(
          `%c⚡ [DocViewer PERF] Mock ArrayBuffer tạo trong ${(performance.now() - t0).toFixed(1)}ms | File: ${storagePath}`,
          'color: #f59e0b; font-weight: bold;'
        );
        return mockBuffer;
      }

      const storage = storageInstance ?? getFirebaseStorage();
      const fileRef = ref(storage, storagePath);
      const buffer = await getBytes(fileRef, 50 * 1024 * 1024);

      const elapsed = performance.now() - t0;
      const sizeKb = (buffer.byteLength / 1024).toFixed(1);

      console.log(
        `%c⚡ [DocViewer PERF] getBytes() trực tiếp từ Storage trong ${elapsed.toFixed(1)}ms | Dung lượng: ${sizeKb} KB | Trạng thái: Cache MISS | File: ${storagePath}`,
        'color: #0284c7; font-weight: bold;'
      );

      // Save to in-memory RAM cache
      documentBufferCache.set(cacheKey, buffer);
      return buffer;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('unauthorized') || errorMsg.includes('permission-denied')) {
        throw new Error('PERMISSION_DENIED: Bạn không có quyền truy cập tệp tin văn bản này.');
      }
      if (errorMsg.includes('object-not-found')) {
        throw new Error('FILE_NOT_FOUND: Tệp tin không tồn tại trên hệ thống lưu trữ.');
      }
      throw new Error(`NETWORK_ERROR: Lỗi khi tải tệp tin từ Storage: ${errorMsg}`);
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Backward-compatibility wrapper for fetchSignedDocumentUrl
 * Returns blob URL created directly from ArrayBuffer
 */
export async function fetchSignedDocumentUrl(
  contractId: string,
  storagePath: string,
  _functionsInstance?: unknown,
  storageInstance?: FirebaseStorage
): Promise<string> {
  const buffer = await fetchDocumentArrayBuffer(contractId, storagePath, storageInstance);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  return URL.createObjectURL(blob);
}

/**
 * Backward-compatibility helper for fetching ArrayBuffer from URL
 */
export async function fetchDocxArrayBuffer(urlOrPath: string): Promise<ArrayBuffer> {
  const res = await fetch(urlOrPath);
  if (!res.ok) {
    throw new Error(`NETWORK_ERROR: Không thể tải tệp tin (${res.status} ${res.statusText}).`);
  }
  return res.arrayBuffer();
}
