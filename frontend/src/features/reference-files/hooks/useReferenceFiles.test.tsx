import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReferenceFiles } from './useReferenceFiles';
import {
  subscribeToReferenceFiles,
  uploadReferenceFile,
  deleteReferenceFile,
} from '../services/refFileService';

vi.mock('../services/refFileService', () => ({
  subscribeToReferenceFiles: vi.fn(),
  uploadReferenceFile: vi.fn(),
  deleteReferenceFile: vi.fn(),
}));

describe('useReferenceFiles hook', () => {
  const mockUser = {
    uid: 'user-01',
    displayName: 'Người Phụ Trách',
    email: 'user@fev.com',
    role: 'USER' as const,
    isActive: true,
  };

  const sampleFiles = [
    {
      fileId: 'f-1',
      fileName: 'bao_gia.pdf',
      storagePath: 'contracts/ctr/f-1.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      uploadedBy: { uid: 'user-01', displayName: 'Người Phụ Trách' },
      uploadedAt: new Date(),
    },
    {
      fileId: 'f-2',
      fileName: 'phu_luc.docx',
      storagePath: 'contracts/ctr/f-2.docx',
      fileSize: 2048,
      mimeType: 'application/docx',
      uploadedBy: { uid: 'legal-01', displayName: 'Luật sư Pháp' },
      uploadedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(subscribeToReferenceFiles).mockImplementation((_id, onUpdate) => {
      onUpdate(sampleFiles as any);
      return () => {};
    });
  });

  it('subscribes to reference files and populates list', async () => {
    const { result } = renderHook(() =>
      useReferenceFiles({
        contractId: 'CTR-2609-0001',
        currentUser: mockUser,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.files.length).toBe(2);
    expect(result.current.totalCount).toBe(2);
  });

  it('evaluates canDelete correctly based on ownership and HOL role', async () => {
    const { result } = renderHook(() =>
      useReferenceFiles({
        contractId: 'CTR-2609-0001',
        currentUser: mockUser, // uid: user-01, role: USER
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Can delete own file
    expect(result.current.canDelete(sampleFiles[0] as any)).toBe(true);
    // Cannot delete others file
    expect(result.current.canDelete(sampleFiles[1] as any)).toBe(false);
  });

  it('allows HOL to delete any file', async () => {
    const holUser = {
      uid: 'hol-01',
      displayName: 'Head of Legal',
      email: 'hol@fev.com',
      role: 'HOL' as const,
      isActive: true,
    };

    const { result } = renderHook(() =>
      useReferenceFiles({
        contractId: 'CTR-2609-0001',
        currentUser: holUser,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canDelete(sampleFiles[0] as any)).toBe(true);
    expect(result.current.canDelete(sampleFiles[1] as any)).toBe(true);
  });

  it('calls uploadReferenceFile when uploadFile is invoked', async () => {
    vi.mocked(uploadReferenceFile).mockResolvedValueOnce(sampleFiles[0] as any);

    const { result } = renderHook(() =>
      useReferenceFiles({
        contractId: 'CTR-2609-0001',
        currentUser: mockUser,
      })
    );

    const mockFile = new File(['123'], 'new.pdf', { type: 'application/pdf' });
    let success = false;
    await act(async () => {
      success = await result.current.uploadFile(mockFile);
    });

    expect(success).toBe(true);
    expect(uploadReferenceFile).toHaveBeenCalled();
  });

  it('calls deleteReferenceFile when deleteFile is invoked on own file', async () => {
    vi.mocked(deleteReferenceFile).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useReferenceFiles({
        contractId: 'CTR-2609-0001',
        currentUser: mockUser,
      })
    );

    let success = false;
    await act(async () => {
      success = await result.current.deleteFile(sampleFiles[0] as any);
    });

    expect(success).toBe(true);
    expect(deleteReferenceFile).toHaveBeenCalledWith(
      'CTR-2609-0001',
      'f-1',
      'contracts/ctr/f-1.pdf'
    );
  });
});
