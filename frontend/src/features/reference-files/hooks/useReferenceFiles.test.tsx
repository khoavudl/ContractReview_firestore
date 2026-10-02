import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReferenceFiles } from './useReferenceFiles';
import {
  subscribeToReferenceFiles,
  uploadReferenceFile,
  deleteReferenceFile,
  getReferenceFileViewUrl,
} from '../services/refFileService';

vi.mock('../services/refFileService', () => ({
  subscribeToReferenceFiles: vi.fn(),
  uploadReferenceFile: vi.fn(),
  deleteReferenceFile: vi.fn(),
  getReferenceFileViewUrl: vi.fn(),
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

  it('uploads multiple files successfully in sequence', async () => {
    vi.mocked(uploadReferenceFile).mockResolvedValue(sampleFiles[0] as any);

    const { result } = renderHook(() =>
      useReferenceFiles({
        contractId: 'CTR-2609-0001',
        currentUser: mockUser,
      })
    );

    const file1 = new File(['content1'], 'file1.pdf', { type: 'application/pdf' });
    const file2 = new File(['content2'], 'file2.pdf', { type: 'application/pdf' });

    let success = false;
    await act(async () => {
      success = await result.current.uploadFiles([file1, file2]);
    });

    expect(success).toBe(true);
    expect(uploadReferenceFile).toHaveBeenCalledTimes(2);
  });

  it('rejects upload when file exceeds 5MB limit', async () => {
    const { result } = renderHook(() =>
      useReferenceFiles({
        contractId: 'CTR-2609-0001',
        currentUser: mockUser,
      })
    );

    // 6MB file
    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });

    let success = false;
    await act(async () => {
      success = await result.current.uploadFiles([largeFile]);
    });

    expect(success).toBe(false);
    expect(result.current.error).toContain('vượt quá dung lượng tối đa 5MB');
    expect(uploadReferenceFile).not.toHaveBeenCalled();
  });

  it('rejects upload when total files exceed 10 files limit', async () => {
    const { result } = renderHook(() =>
      useReferenceFiles({
        contractId: 'CTR-2609-0001',
        currentUser: mockUser,
      })
    );

    await waitFor(() => {
      expect(result.current.files.length).toBe(2);
    });

    // 2 files currently exist, trying to add 9 files (total 11 > 10)
    const newFiles = Array.from(
      { length: 9 },
      (_, i) => new File(['text'], `doc${i}.pdf`, { type: 'application/pdf' })
    );

    let success = false;
    await act(async () => {
      success = await result.current.uploadFiles(newFiles);
    });

    expect(success).toBe(false);
    expect(result.current.error).toContain('Hồ sơ đã có 2/10 tệp');
    expect(uploadReferenceFile).not.toHaveBeenCalled();
  });

  it('opens file in a new tab via openFileInNewTab', async () => {
    vi.mocked(getReferenceFileViewUrl).mockResolvedValueOnce('blob:http://localhost/mock-uuid');
    const mockOpen = vi.fn().mockReturnValue({ location: { href: '' }, close: vi.fn() });
    vi.stubGlobal('open', mockOpen);

    const { result } = renderHook(() =>
      useReferenceFiles({
        contractId: 'CTR-2609-0001',
        currentUser: mockUser,
      })
    );

    let success = false;
    await act(async () => {
      success = await result.current.openFileInNewTab(sampleFiles[0] as any);
    });

    expect(success).toBe(true);
    expect(mockOpen).toHaveBeenCalledWith('about:blank', '_blank');
    expect(getReferenceFileViewUrl).toHaveBeenCalledWith(
      'CTR-2609-0001',
      sampleFiles[0].storagePath,
      sampleFiles[0].mimeType,
      sampleFiles[0].fileName
    );

    vi.unstubAllGlobals();
  });
});
