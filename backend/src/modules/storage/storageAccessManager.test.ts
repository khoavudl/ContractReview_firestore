import { describe, it, expect } from 'vitest';
import {
  parseContractStoragePath,
  canAccessContractDocument,
  type StorageUserContext,
} from './storageAccessManager.js';

describe('storageAccessManager', () => {
  describe('parseContractStoragePath', () => {
    it('correctly parses a valid version docx path', () => {
      const parsed = parseContractStoragePath('contracts/CTR-2609-0001/versions/v1.docx');
      expect(parsed).toEqual({
        contractId: 'CTR-2609-0001',
        category: 'versions',
        fileName: 'v1.docx',
      });
    });

    it('correctly parses a valid preview pdf path', () => {
      const parsed = parseContractStoragePath('contracts/CTR-2609-0001/previews/v2.pdf');
      expect(parsed).toEqual({
        contractId: 'CTR-2609-0001',
        category: 'previews',
        fileName: 'v2.pdf',
      });
    });

    it('correctly parses an approved pdf path', () => {
      const parsed = parseContractStoragePath('contracts/CTR-2609-0001/approved/CTR_approved.pdf');
      expect(parsed).toEqual({
        contractId: 'CTR-2609-0001',
        category: 'approved',
        fileName: 'CTR_approved.pdf',
      });
    });

    it('correctly parses a reference file path', () => {
      const parsed = parseContractStoragePath('contracts/CTR-2609-0001/references/quote.xlsx');
      expect(parsed).toEqual({
        contractId: 'CTR-2609-0001',
        category: 'references',
        fileName: 'quote.xlsx',
      });
    });

    it('rejects path traversal attempts with ..', () => {
      expect(parseContractStoragePath('contracts/CTR-001/../../etc/passwd')).toBeNull();
      expect(parseContractStoragePath('../contracts/CTR-001/versions/v1.docx')).toBeNull();
    });

    it('rejects paths with leading slash or invalid segments', () => {
      expect(parseContractStoragePath('/contracts/CTR-001/versions/v1.docx')).toBeNull();
      expect(parseContractStoragePath('contracts/CTR-001/v1.docx')).toBeNull();
      expect(parseContractStoragePath('other/CTR-001/versions/v1.docx')).toBeNull();
    });

    it('rejects unknown categories', () => {
      expect(parseContractStoragePath('contracts/CTR-001/secrets/v1.docx')).toBeNull();
    });
  });

  describe('canAccessContractDocument', () => {
    const ownerUser: StorageUserContext = { uid: 'user-001', role: 'USER' };
    const otherUser: StorageUserContext = { uid: 'user-002', role: 'USER' };
    const legalUser: StorageUserContext = { uid: 'legal-001', role: 'LEGAL' };
    const holUser: StorageUserContext = { uid: 'hol-001', role: 'HOL' };

    it('grants access to owner USER', () => {
      expect(canAccessContractDocument('user-001', ownerUser)).toBe(true);
    });

    it('denies access to non-owner USER', () => {
      expect(canAccessContractDocument('user-001', otherUser)).toBe(false);
    });

    it('grants access to LEGAL regardless of creator', () => {
      expect(canAccessContractDocument('user-001', legalUser)).toBe(true);
      expect(canAccessContractDocument('user-999', legalUser)).toBe(true);
    });

    it('grants access to HOL regardless of creator', () => {
      expect(canAccessContractDocument('user-001', holUser)).toBe(true);
      expect(canAccessContractDocument('user-999', holUser)).toBe(true);
    });

    it('denies access if user context is invalid', () => {
      expect(canAccessContractDocument('user-001', { uid: '', role: 'USER' })).toBe(false);
    });
  });
});
