import { describe, it, expect } from 'vitest';
import { parseVersionUploadPath, buildPreviewPdfPath } from './pathParser.js';

describe('pathParser', () => {
  describe('parseVersionUploadPath', () => {
    it('correctly parses a standard version .docx path', () => {
      const result = parseVersionUploadPath('contracts/CTR-2609-0001/versions/v1.docx');
      expect(result).toEqual({
        contractId: 'CTR-2609-0001',
        versionFileName: 'v1.docx',
        versionId: 'v1',
      });
    });

    it('correctly parses case-insensitive .DOCX extension', () => {
      const result = parseVersionUploadPath('contracts/CTR-2609-0001/versions/v2.DOCX');
      expect(result).toEqual({
        contractId: 'CTR-2609-0001',
        versionFileName: 'v2.DOCX',
        versionId: 'v2',
      });
    });

    it('ignores preview pdf files to prevent infinite trigger loops', () => {
      expect(parseVersionUploadPath('contracts/CTR-2609-0001/previews/v1.pdf')).toBeNull();
    });

    it('ignores reference files in references/', () => {
      expect(parseVersionUploadPath('contracts/CTR-2609-0001/references/ref.docx')).toBeNull();
    });

    it('ignores files without .docx extension', () => {
      expect(parseVersionUploadPath('contracts/CTR-2609-0001/versions/v1.pdf')).toBeNull();
      expect(parseVersionUploadPath('contracts/CTR-2609-0001/versions/v1.txt')).toBeNull();
    });

    it('rejects path traversal attempts', () => {
      expect(parseVersionUploadPath('contracts/CTR-001/versions/../../v1.docx')).toBeNull();
    });

    it('rejects leading slashes and malformed paths', () => {
      expect(parseVersionUploadPath('/contracts/CTR-001/versions/v1.docx')).toBeNull();
      expect(parseVersionUploadPath('invalid/path/v1.docx')).toBeNull();
      expect(parseVersionUploadPath('')).toBeNull();
    });
  });

  describe('buildPreviewPdfPath', () => {
    it('generates the preview pdf path matching the version filename', () => {
      const preview = buildPreviewPdfPath('CTR-2609-0001', 'v1.docx');
      expect(preview).toBe('contracts/CTR-2609-0001/previews/v1.pdf');
    });

    it('handles uppercase extension in source filename', () => {
      const preview = buildPreviewPdfPath('CTR-2609-0001', 'v2.DOCX');
      expect(preview).toBe('contracts/CTR-2609-0001/previews/v2.pdf');
    });
  });
});
