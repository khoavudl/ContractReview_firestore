/**
 * Unit Tests for document-viewer storageService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpsCallable, type Functions } from 'firebase/functions';
import * as shared from '@/shared';
import {
  getCacheKey,
  clearSignedUrlCache,
  getCachedSignedUrl,
  getSignedDocumentUrlFromCloud,
  fetchSignedDocumentUrl,
  fetchDocxArrayBuffer,
} from './storageService';

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
}));

vi.mock('@/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared')>();
  return {
    ...actual,
    getFirebaseFunctions: vi.fn(() => ({} as Functions)),
    isMockDevEnvironment: vi.fn(() => false),
  };
});

describe('storageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSignedUrlCache();
  });

  describe('getCacheKey', () => {
    it('creates key in format contractId:storagePath', () => {
      expect(getCacheKey('CTR-2609-0001', 'contracts/v1.docx')).toBe(
        'CTR-2609-0001:contracts/v1.docx'
      );
    });
  });

  describe('cache operations', () => {
    it('returns null when key is not cached', () => {
      expect(getCachedSignedUrl('CTR-2609-0001', 'contracts/v1.docx')).toBeNull();
    });

    it('clears all cached entries on clearSignedUrlCache', async () => {
      vi.mocked(shared.isMockDevEnvironment).mockReturnValue(true);
      await fetchSignedDocumentUrl('CTR-2609-0001', 'contracts/v1.docx');
      expect(getCachedSignedUrl('CTR-2609-0001', 'contracts/v1.docx')).toBeTruthy();

      clearSignedUrlCache();
      expect(getCachedSignedUrl('CTR-2609-0001', 'contracts/v1.docx')).toBeNull();
    });
  });

  describe('getSignedDocumentUrlFromCloud', () => {
    it('throws error when contractId or storagePath is empty', async () => {
      await expect(getSignedDocumentUrlFromCloud('', 'path/file.docx')).rejects.toThrow(
        /chưa được cấu hình/
      );
      await expect(getSignedDocumentUrlFromCloud('CTR-1', '')).rejects.toThrow(
        /chưa được cấu hình/
      );
    });

    it('returns mock download link for docx in mock dev environment', async () => {
      vi.mocked(shared.isMockDevEnvironment).mockReturnValue(true);

      const res = await getSignedDocumentUrlFromCloud(
        'CTR-2609-0001',
        'contracts/CTR-2609-0001/versions/v1.docx'
      );

      expect(res.signedUrl).toContain('mock-storage.local');
      expect(res.signedUrl).toContain('.docx');
    });

    it('calls httpsCallable in production environment', async () => {
      vi.mocked(shared.isMockDevEnvironment).mockReturnValue(false);

      const mockCallableFn = vi.fn().mockResolvedValue({
        data: {
          signedUrl: 'https://storage.googleapis.com/real-signed-url',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      });
      vi.mocked(httpsCallable).mockReturnValue(mockCallableFn as unknown as ReturnType<typeof httpsCallable>);

      const res = await getSignedDocumentUrlFromCloud(
        'CTR-2609-0001',
        'contracts/CTR-2609-0001/versions/v1.docx'
      );

      expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'getSignedDocumentUrl');
      expect(mockCallableFn).toHaveBeenCalledWith({
        contractId: 'CTR-2609-0001',
        storagePath: 'contracts/CTR-2609-0001/versions/v1.docx',
      });
      expect(res.signedUrl).toBe('https://storage.googleapis.com/real-signed-url');
    });
  });

  describe('fetchSignedDocumentUrl with caching', () => {
    it('caches signed URL and avoids redundant network calls', async () => {
      vi.mocked(shared.isMockDevEnvironment).mockReturnValue(false);

      const mockCallableFn = vi.fn().mockResolvedValue({
        data: {
          signedUrl: 'https://storage.googleapis.com/cached-url',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      });
      vi.mocked(httpsCallable).mockReturnValue(mockCallableFn as unknown as ReturnType<typeof httpsCallable>);

      const url1 = await fetchSignedDocumentUrl(
        'CTR-2609-0001',
        'contracts/CTR-2609-0001/versions/v1.docx'
      );
      const url2 = await fetchSignedDocumentUrl(
        'CTR-2609-0001',
        'contracts/CTR-2609-0001/versions/v1.docx'
      );

      expect(url1).toBe('https://storage.googleapis.com/cached-url');
      expect(url2).toBe('https://storage.googleapis.com/cached-url');
      expect(mockCallableFn).toHaveBeenCalledTimes(1);
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
});
