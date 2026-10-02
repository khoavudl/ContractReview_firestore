/**
 * Unit Tests for document-viewer storageService (Direct getBytes & In-Memory Cache)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBytes } from 'firebase/storage';
import * as shared from '@/shared';
import {
  getCacheKey,
  clearDocumentArrayBufferCache,
  clearSignedUrlCache,
  getCachedDocumentBuffer,
  getCachedSignedUrl,
  fetchDocumentArrayBuffer,
  fetchSignedDocumentUrl,
  fetchDocxArrayBuffer,
  createMockArrayBuffer,
} from './storageService';

vi.mock('firebase/storage', () => ({
  ref: vi.fn((_storage, path) => ({ fullPath: path })),
  getBytes: vi.fn(),
}));

vi.mock('@/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared')>();
  return {
    ...actual,
    getFirebaseStorage: vi.fn(() => ({})),
    isMockDevEnvironment: vi.fn(() => false),
  };
});

describe('storageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDocumentArrayBufferCache();
  });

  describe('getCacheKey', () => {
    it('creates key in format contractId:storagePath', () => {
      expect(getCacheKey('CTR-2609-0001', 'contracts/v1.docx')).toBe(
        'CTR-2609-0001:contracts/v1.docx'
      );
    });
  });

  describe('cache operations', () => {
    it('returns null when buffer is not cached', () => {
      expect(getCachedDocumentBuffer('CTR-2609-0001', 'contracts/v1.docx')).toBeNull();
      expect(getCachedSignedUrl('CTR-2609-0001', 'contracts/v1.docx')).toBeNull();
    });

    it('clears all cached entries on clearDocumentArrayBufferCache / clearSignedUrlCache', async () => {
      vi.mocked(shared.isMockDevEnvironment).mockReturnValue(true);
      await fetchDocumentArrayBuffer('CTR-2609-0001', 'contracts/v1.docx');
      expect(getCachedDocumentBuffer('CTR-2609-0001', 'contracts/v1.docx')).toBeTruthy();
      expect(getCachedSignedUrl('CTR-2609-0001', 'contracts/v1.docx')).toBeTruthy();

      clearSignedUrlCache();
      expect(getCachedDocumentBuffer('CTR-2609-0001', 'contracts/v1.docx')).toBeNull();
    });
  });

  describe('fetchDocumentArrayBuffer', () => {
    it('throws error when contractId or storagePath is empty', async () => {
      await expect(fetchDocumentArrayBuffer('', 'path/file.docx')).rejects.toThrow(
        /chưa được cấu hình/
      );
      await expect(fetchDocumentArrayBuffer('CTR-1', '')).rejects.toThrow(
        /chưa được cấu hình/
      );
    });

    it('returns mock ArrayBuffer in mock dev environment', async () => {
      vi.mocked(shared.isMockDevEnvironment).mockReturnValue(true);

      const buffer = await fetchDocumentArrayBuffer(
        'CTR-2609-0001',
        'contracts/CTR-2609-0001/versions/v1.docx'
      );

      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('calls getBytes directly in real environment and caches the result', async () => {
      vi.mocked(shared.isMockDevEnvironment).mockReturnValue(false);

      const sampleBuffer = new ArrayBuffer(16);
      vi.mocked(getBytes).mockResolvedValue(sampleBuffer);

      const buf1 = await fetchDocumentArrayBuffer(
        'CTR-2609-0001',
        'contracts/CTR-2609-0001/versions/v1.docx'
      );
      const buf2 = await fetchDocumentArrayBuffer(
        'CTR-2609-0001',
        'contracts/CTR-2609-0001/versions/v1.docx'
      );

      expect(buf1).toBe(sampleBuffer);
      expect(buf2).toBe(sampleBuffer);
      expect(getBytes).toHaveBeenCalledTimes(1); // Cached on second call!
    });

    it('throws PERMISSION_DENIED on unauthorized error', async () => {
      vi.mocked(shared.isMockDevEnvironment).mockReturnValue(false);
      vi.mocked(getBytes).mockRejectedValue(new Error('Firebase Storage: unauthorized (storage/unauthorized)'));

      await expect(
        fetchDocumentArrayBuffer('CTR-2609-0001', 'contracts/v1.docx')
      ).rejects.toThrow(/PERMISSION_DENIED/);
    });

    it('throws FILE_NOT_FOUND on object-not-found error', async () => {
      vi.mocked(shared.isMockDevEnvironment).mockReturnValue(false);
      vi.mocked(getBytes).mockRejectedValue(new Error('Firebase Storage: object-not-found (storage/object-not-found)'));

      await expect(
        fetchDocumentArrayBuffer('CTR-2609-0001', 'contracts/v1.docx')
      ).rejects.toThrow(/FILE_NOT_FOUND/);
    });
  });

  describe('fetchSignedDocumentUrl wrapper', () => {
    it('creates object URL from ArrayBuffer', async () => {
      vi.mocked(shared.isMockDevEnvironment).mockReturnValue(true);

      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-uuid');

      const url = await fetchSignedDocumentUrl('CTR-2609-0001', 'contracts/v1.docx');
      expect(url).toBe('blob:http://localhost/test-uuid');

      URL.createObjectURL = originalCreateObjectURL;
    });
  });

  describe('fetchDocxArrayBuffer', () => {
    it('fetches arrayBuffer successfully from url', async () => {
      const mockBuffer = new ArrayBuffer(8);
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockBuffer),
      } as unknown as Response);

      const buffer = await fetchDocxArrayBuffer('https://example.com/file.docx');
      expect(buffer).toBe(mockBuffer);
    });

    it('throws error when fetch response is not ok', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as unknown as Response);

      await expect(fetchDocxArrayBuffer('https://example.com/file.docx')).rejects.toThrow(
        /NETWORK_ERROR/
      );
    });
  });

  describe('createMockArrayBuffer', () => {
    it('generates a non-empty arrayBuffer', () => {
      const buf = createMockArrayBuffer();
      expect(buf.byteLength).toBeGreaterThan(0);
    });
  });
});
