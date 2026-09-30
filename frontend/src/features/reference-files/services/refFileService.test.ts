import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  subscribeToReferenceFiles,
  uploadReferenceFile,
  deleteReferenceFile,
  resetMockReferenceFilesForTesting,
  DEV_SAMPLE_REF_FILES,
} from './refFileService';

vi.mock('@/shared', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/shared');
  return {
    ...actual,
    isMockDevEnvironment: vi.fn(() => false),
    getFirebaseDb: vi.fn(),
    getFirebaseStorage: vi.fn(),
    toValidDate: vi.fn((val) => (val instanceof Date ? val : new Date(val))),
  };
});

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => ({ type: 'SERVER_TIMESTAMP' })),
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  deleteObject: vi.fn(),
}));

import { isMockDevEnvironment } from '@/shared';
import { setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { uploadBytes, deleteObject } from 'firebase/storage';

describe('refFileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockReferenceFilesForTesting();
  });

  describe('subscribeToReferenceFiles', () => {
    it('should emit initial files in mock dev environment', () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(true);

      const onUpdate = vi.fn();
      const unsub = subscribeToReferenceFiles('CTR-2609-0001', onUpdate);

      expect(onUpdate).toHaveBeenCalledWith(DEV_SAMPLE_REF_FILES['CTR-2609-0001']);
      unsub();
    });

    it('should setup Firestore onSnapshot in production environment', () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(false);

      const mockUnsub = vi.fn();
      vi.mocked(onSnapshot).mockReturnValueOnce(mockUnsub as any);

      const onUpdate = vi.fn();
      const unsub = subscribeToReferenceFiles('CTR-2609-0001', onUpdate);

      expect(onSnapshot).toHaveBeenCalled();
      unsub();
      expect(mockUnsub).toHaveBeenCalled();
    });
  });

  describe('uploadReferenceFile', () => {
    it('should simulate upload and progress in mock mode', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(true);

      const onProgress = vi.fn();
      const mockFile = new File(['content'], 'test_bao_gia.pdf', { type: 'application/pdf' });

      const res = await uploadReferenceFile(
        'CTR-TEST-01',
        mockFile,
        { uid: 'u1', displayName: 'Uploader' },
        onProgress
      );

      expect(res.fileName).toBe('test_bao_gia.pdf');
      expect(res.uploadedBy.displayName).toBe('Uploader');
      expect(onProgress).toHaveBeenCalledWith(100);
    });

    it('should upload to Storage and write to Firestore in production mode', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(false);
      vi.mocked(uploadBytes).mockResolvedValueOnce({} as any);
      vi.mocked(setDoc).mockResolvedValueOnce(undefined);

      const mockFile = new File(['binary'], 'license.pdf', { type: 'application/pdf' });
      const res = await uploadReferenceFile(
        'CTR-2609-0001',
        mockFile,
        { uid: 'u1', displayName: 'User 1' }
      );

      expect(uploadBytes).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
      expect(res.fileName).toBe('license.pdf');
    });
  });

  describe('deleteReferenceFile', () => {
    it('should delete from mock list in mock mode', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(true);

      const onUpdate = vi.fn();
      const unsub = subscribeToReferenceFiles('CTR-2609-0001', onUpdate);
      onUpdate.mockClear();

      await deleteReferenceFile('CTR-2609-0001', 'ref-001', 'path/to/file.pdf');

      expect(onUpdate).toHaveBeenCalled();
      unsub();
    });

    it('should call deleteDoc and deleteObject in production mode', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(false);
      vi.mocked(deleteDoc).mockResolvedValueOnce(undefined);
      vi.mocked(deleteObject).mockResolvedValueOnce(undefined);

      await deleteReferenceFile('CTR-2609-0001', 'ref-002', 'path/to/file.pdf');

      expect(deleteDoc).toHaveBeenCalled();
      expect(deleteObject).toHaveBeenCalled();
    });
  });
});
