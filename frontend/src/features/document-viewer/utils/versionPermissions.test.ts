/**
 * Unit Tests for versionPermissions utility
 */

import { describe, it, expect } from 'vitest';
import { canUploadVersion } from './versionPermissions';
import type { AuthUser, ContractDocument, ContractStatus } from '@/shared';

describe('versionPermissions — canUploadVersion', () => {
  const createMockUser = (uid: string, role: AuthUser['role']): AuthUser => ({
    uid,
    email: `${uid}@example.com`,
    displayName: `User ${uid}`,
    role,
    isActive: true,
  });

  const createMockContract = (status: ContractStatus, creatorUid = 'u-owner'): ContractDocument => ({
    contractId: 'CTR-2609-0001',
    title: 'Hợp đồng mua bán',
    supplier: 'Công ty Đối tác',
    description: 'Mô tả hợp đồng',
    status,
    currentVersion: 1,
    createdBy: {
      uid: creatorUid,
      email: `${creatorUid}@example.com`,
      displayName: 'Chủ sở hữu',
    },
    rejectCount: 0,
    isArchived: false,
    companyRole: 'BUYER',
    currentVersionFile: {
      versionNo: 1,
      originalFileName: 'test.docx',
      storagePath: 'contracts/CTR-2609-0001/versions/v1.docx',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const ownerUser = createMockUser('u-owner', 'USER');
  const otherUser = createMockUser('u-other', 'USER');
  const legalUser = createMockUser('u-legal', 'LEGAL');
  const holUser = createMockUser('u-hol', 'HOL');

  it('returns false if contract or user is null', () => {
    expect(canUploadVersion(null, ownerUser)).toBe(false);
    expect(canUploadVersion(createMockContract('DRAFT'), null)).toBe(false);
    expect(canUploadVersion(null, null)).toBe(false);
  });

  it('allows creator to upload at DRAFT stage, but denies others', () => {
    const contract = createMockContract('DRAFT');
    expect(canUploadVersion(contract, ownerUser)).toBe(true);
    expect(canUploadVersion(contract, otherUser)).toBe(false);
    expect(canUploadVersion(contract, legalUser)).toBe(false);
    expect(canUploadVersion(contract, holUser)).toBe(false);
  });

  it('allows creator to upload at USER_REVISING stage, but denies others', () => {
    const contract = createMockContract('USER_REVISING');
    expect(canUploadVersion(contract, ownerUser)).toBe(true);
    expect(canUploadVersion(contract, otherUser)).toBe(false);
    expect(canUploadVersion(contract, legalUser)).toBe(false);
    expect(canUploadVersion(contract, holUser)).toBe(false);
  });

  it('allows LEGAL and HOL to upload at PENDING_LEGAL stage, but denies USER', () => {
    const contract = createMockContract('PENDING_LEGAL');
    expect(canUploadVersion(contract, ownerUser)).toBe(false);
    expect(canUploadVersion(contract, otherUser)).toBe(false);
    expect(canUploadVersion(contract, legalUser)).toBe(true);
    expect(canUploadVersion(contract, holUser)).toBe(true);
  });

  it('allows only HOL to upload at PENDING_HOL stage, denies USER and LEGAL', () => {
    const contract = createMockContract('PENDING_HOL');
    expect(canUploadVersion(contract, ownerUser)).toBe(false);
    expect(canUploadVersion(contract, otherUser)).toBe(false);
    expect(canUploadVersion(contract, legalUser)).toBe(false);
    expect(canUploadVersion(contract, holUser)).toBe(true);
  });

  it('denies all roles at terminal/completed or intermediate stages', () => {
    const completedContract = createMockContract('COMPLETED');
    expect(canUploadVersion(completedContract, ownerUser)).toBe(false);
    expect(canUploadVersion(completedContract, legalUser)).toBe(false);
    expect(canUploadVersion(completedContract, holUser)).toBe(false);

    const holApprovedContract = createMockContract('HOL_APPROVED');
    expect(canUploadVersion(holApprovedContract, ownerUser)).toBe(false);
    expect(canUploadVersion(holApprovedContract, legalUser)).toBe(false);
    expect(canUploadVersion(holApprovedContract, holUser)).toBe(false);
  });
});
