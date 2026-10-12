/**
 * Shared Core Layer
 * Service: documentStorageCache — In-memory ArrayBuffer cache for document viewer and optimistic pre-caching
 */

// In-memory cache for document ArrayBuffers: key = "contractId:storagePath"
export const documentBufferCache = new Map<string, ArrayBuffer>();

// In-flight active promises to deduplicate parallel/concurrent requests
export const inFlightRequests = new Map<string, Promise<ArrayBuffer>>();

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

/**
 * Manually set an ArrayBuffer into memory cache (e.g. for optimistic pre-caching upon upload)
 */
export function setCachedDocumentBuffer(
  contractId: string,
  storagePath: string,
  buffer: ArrayBuffer
): void {
  if (!contractId || !storagePath || !buffer) return;
  const key = getCacheKey(contractId, storagePath);
  documentBufferCache.set(key, buffer);
}

/**
 * Invalidate/delete a specific cached document buffer (e.g. when encountering corrupted stream)
 */
export function invalidateCachedDocumentBuffer(
  contractId: string,
  storagePath: string
): void {
  if (!contractId || !storagePath) return;
  const key = getCacheKey(contractId, storagePath);
  documentBufferCache.delete(key);
  inFlightRequests.delete(key);
}

/**
 * Reads a File/Blob as an ArrayBuffer safely across browser and test environments
 */
export async function readFileAsArrayBuffer(file: Blob | File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Pre-caches an uploaded File directly into RAM cache as an ArrayBuffer
 */
export async function cacheUploadedFile(
  contractId: string,
  storagePath: string,
  file: File
): Promise<void> {
  if (!contractId || !storagePath || !file) return;
  try {
    const buffer = await readFileAsArrayBuffer(file);
    setCachedDocumentBuffer(contractId, storagePath, buffer);
  } catch (err) {
    console.warn('[DocViewer] Không thể pre-cache tệp vừa upload:', err);
  }
}
