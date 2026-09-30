import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processVersionUpload } from './converterWorkerService.js';
import type { DocxToPdfConverter } from './converterTypes.js';

describe('converterWorkerService', () => {
  let mockBucket: any;
  let mockDb: any;
  let mockConverter: DocxToPdfConverter;
  let mockFile: any;
  let mockContractDoc: any;
  let mockActivityDoc: any;

  beforeEach(() => {
    mockFile = {
      download: vi.fn(async () => [Buffer.from('fake-docx-content')]),
      save: vi.fn(async () => undefined),
    };

    mockBucket = {
      file: vi.fn(() => mockFile),
    };

    mockActivityDoc = {
      id: 'activity-123',
      set: vi.fn(async () => undefined),
    };

    mockContractDoc = {
      update: vi.fn(async () => undefined),
      collection: vi.fn((subCol: string) => {
        if (subCol === 'activities') {
          return { doc: vi.fn(() => mockActivityDoc) };
        }
        if (subCol === 'versions') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn(async () => ({ exists: true })),
              update: vi.fn(async () => undefined),
            })),
          };
        }
        return { doc: vi.fn(() => ({ id: 'mock-id', set: vi.fn() })) };
      }),
    };

    mockDb = {
      collection: vi.fn((_col: string) => ({
        doc: vi.fn((_id: string) => mockContractDoc),
      })),
    };

    mockConverter = {
      convert: vi.fn(async (_buf: Buffer) => Buffer.from('%PDF-1.4 fake-pdf')),
    };
  });

  it('returns null and does nothing for non-version files', async () => {
    const result = await processVersionUpload(
      mockBucket,
      mockDb,
      'contracts/CTR-001/previews/v1.pdf',
      mockConverter
    );

    expect(result).toBeNull();
    expect(mockBucket.file).not.toHaveBeenCalled();
    expect(mockConverter.convert).not.toHaveBeenCalled();
  });

  it('successfully converts version docx and updates Firestore', async () => {
    const result = await processVersionUpload(
      mockBucket,
      mockDb,
      'contracts/CTR-2609-0001/versions/v1.docx',
      mockConverter
    );

    expect(result).toEqual({
      success: true,
      contractId: 'CTR-2609-0001',
      versionFileName: 'v1.docx',
      previewPdfPath: 'contracts/CTR-2609-0001/previews/v1.pdf',
    });

    expect(mockBucket.file).toHaveBeenCalledWith('contracts/CTR-2609-0001/versions/v1.docx');
    expect(mockConverter.convert).toHaveBeenCalled();
    expect(mockBucket.file).toHaveBeenCalledWith('contracts/CTR-2609-0001/previews/v1.pdf');
    expect(mockFile.save).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'application/pdf' })
    );
    expect(mockContractDoc.update).toHaveBeenCalledWith(
      expect.objectContaining({
        'currentVersionFile.previewPdfPath': 'contracts/CTR-2609-0001/previews/v1.pdf',
      })
    );
    expect(mockActivityDoc.set).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PREVIEW_GENERATED',
      })
    );
  });

  it('handles converter engine errors gracefully without throwing', async () => {
    mockConverter.convert = vi.fn().mockRejectedValueOnce(new Error('Corrupt Word Document'));

    const result = await processVersionUpload(
      mockBucket,
      mockDb,
      'contracts/CTR-2609-0001/versions/v1.docx',
      mockConverter
    );

    expect(result).toEqual({
      success: false,
      contractId: 'CTR-2609-0001',
      versionFileName: 'v1.docx',
      error: 'Corrupt Word Document',
    });

    expect(mockActivityDoc.set).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PREVIEW_FAILED',
        details: expect.stringContaining('Corrupt Word Document'),
      })
    );
  });
});
