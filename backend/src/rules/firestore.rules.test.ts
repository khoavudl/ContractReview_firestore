/**
 * Comprehensive Automated Tests for Cloud Firestore Security Rules (firestore.rules)
 * Verifies RBAC, Data Isolation, State Machine transitions, and Subcollection immutability.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  createRulesTestEnv,
  getAuthContext,
  getUnauthenticatedContext,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from './rulesTestHelper.js';

describe('Cloud Firestore Security Rules Automated Testing', () => {
  let testEnv: RulesTestEnvironment;

  const OWNER_USER = { uid: 'user_sales_01', email: 'user.sales@foodempire.vn', role: 'USER' as const, isActive: true };
  const OTHER_USER = { uid: 'user_other_02', email: 'other@foodempire.vn', role: 'USER' as const, isActive: true };
  const LEGAL_STAFF = { uid: 'legal_specialist_01', email: 'legal@foodempire.vn', role: 'LEGAL' as const, isActive: true };
  const HEAD_OF_LEGAL = { uid: 'head_of_legal_01', email: 'head.legal@foodempire.vn', role: 'HOL' as const, isActive: true };
  const INACTIVE_USER = { uid: 'user_locked_03', email: 'locked@foodempire.vn', role: 'USER' as const, isActive: false };

  const CONTRACT_ID = 'CTR-2609-0001';

  beforeAll(async () => {
    testEnv = await createRulesTestEnv();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();

    // Setup base contract document using admin context (bypasses rules)
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      const db = adminContext.firestore();

      // Seed user docs in /users
      await db.doc(`users/${OWNER_USER.uid}`).set({ ...OWNER_USER, displayName: 'User Owner' });
      await db.doc(`users/${LEGAL_STAFF.uid}`).set({ ...LEGAL_STAFF, displayName: 'Legal Staff' });
      await db.doc(`users/${HEAD_OF_LEGAL.uid}`).set({ ...HEAD_OF_LEGAL, displayName: 'Head Legal' });

      // Seed contract doc
      await db.doc(`contracts/${CONTRACT_ID}`).set({
        contractId: CONTRACT_ID,
        title: 'Hợp đồng mua bán thiết bị 2026',
        supplier: 'Công ty Cổ phần Alpha',
        description: 'Cung cấp trang thiết bị',
        status: 'DRAFT',
        currentVersion: 1,
        createdBy: {
          uid: OWNER_USER.uid,
          email: OWNER_USER.email,
          displayName: 'User Owner',
        },
        rejectCount: 0,
        isArchived: false,
        companyRole: 'BUYER',
        currentVersionFile: {
          versionNo: 1,
          originalFileName: `${CONTRACT_ID}_v1.docx`,
          storagePath: `contracts/${CONTRACT_ID}/versions/v1.docx`,
        },
      });

      // Seed initial version doc
      await db.doc(`contracts/${CONTRACT_ID}/versions/v1`).set({
        versionId: 'v1',
        versionNo: 1,
        fileName: `${CONTRACT_ID}_v1.docx`,
        storagePath: `contracts/${CONTRACT_ID}/versions/v1.docx`,
        action: 'INITIAL_UPLOAD',
        changeSummary: 'Khởi tạo',
        uploadedBy: {
          uid: OWNER_USER.uid,
          email: OWNER_USER.email,
        },
      });
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SUITE 1: Whitelist & Unauthenticated Isolation
  // ══════════════════════════════════════════════════════════════
  describe('Suite 1: Whitelist & Authentication Checks', () => {
    it('denies unauthenticated guests from reading or writing contracts', async () => {
      const guestDb = getUnauthenticatedContext(testEnv).firestore();
      await expect(assertFails(guestDb.doc(`contracts/${CONTRACT_ID}`).get())).resolves.toBeDefined();
    });

    it('denies inactive / blocked user from accessing contracts', async () => {
      const inactiveDb = getAuthContext(testEnv, INACTIVE_USER.uid, INACTIVE_USER).firestore();
      await expect(assertFails(inactiveDb.doc(`contracts/${CONTRACT_ID}`).get())).resolves.toBeDefined();
    });

    it('allows active whitelisted users to read /users document', async () => {
      const userDb = getAuthContext(testEnv, OWNER_USER.uid, OWNER_USER).firestore();
      await expect(assertSucceeds(userDb.doc(`users/${OWNER_USER.uid}`).get())).resolves.toBeDefined();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SUITE 2: Contracts Lifecycle & State Machine Transitions
  // ══════════════════════════════════════════════════════════════
  describe('Suite 2: State Machine 9-Status Transitions & RBAC Matrix', () => {
    it('allows USER to create a new contract only with DRAFT status', async () => {
      const userDb = getAuthContext(testEnv, OWNER_USER.uid, OWNER_USER).firestore();
      const newContractId = 'CTR-2609-0002';

      await expect(
        assertSucceeds(
          userDb.doc(`contracts/${newContractId}`).set({
            contractId: newContractId,
            title: 'Hợp đồng mới',
            supplier: 'Beta Co',
            description: 'Mô tả',
            status: 'DRAFT',
            currentVersion: 1,
            createdBy: {
              uid: OWNER_USER.uid,
              email: OWNER_USER.email,
              displayName: 'User Owner',
            },
            rejectCount: 0,
            isArchived: false,
            companyRole: 'BUYER',
          })
        )
      ).resolves.toBeUndefined();
    });

    it('denies USER from creating a new contract with status != DRAFT', async () => {
      const userDb = getAuthContext(testEnv, OWNER_USER.uid, OWNER_USER).firestore();
      const newContractId = 'CTR-2609-0003';

      await expect(
        assertFails(
          userDb.doc(`contracts/${newContractId}`).set({
            contractId: newContractId,
            title: 'Hợp đồng gian lận',
            status: 'HOL_APPROVED',
            createdBy: { uid: OWNER_USER.uid },
          })
        )
      ).resolves.toBeDefined();
    });

    it('allows owner USER to submit DRAFT -> PENDING_LEGAL', async () => {
      const userDb = getAuthContext(testEnv, OWNER_USER.uid, OWNER_USER).firestore();
      await expect(
        assertSucceeds(
          userDb.doc(`contracts/${CONTRACT_ID}`).update({
            status: 'PENDING_LEGAL',
          })
        )
      ).resolves.toBeUndefined();
    });

    it('denies non-owner USER from submitting someone elses contract', async () => {
      const otherDb = getAuthContext(testEnv, OTHER_USER.uid, OTHER_USER).firestore();
      await expect(
        assertFails(
          otherDb.doc(`contracts/${CONTRACT_ID}`).update({
            status: 'PENDING_LEGAL',
          })
        )
      ).resolves.toBeDefined();
    });

    it('allows LEGAL to transition PENDING_LEGAL -> PENDING_HOL', async () => {
      // Set to PENDING_LEGAL first
      await testEnv.withSecurityRulesDisabled(async (adminContext) => {
        await adminContext.firestore().doc(`contracts/${CONTRACT_ID}`).update({ status: 'PENDING_LEGAL' });
      });

      const legalDb = getAuthContext(testEnv, LEGAL_STAFF.uid, LEGAL_STAFF).firestore();
      await expect(
        assertSucceeds(
          legalDb.doc(`contracts/${CONTRACT_ID}`).update({
            status: 'PENDING_HOL',
          })
        )
      ).resolves.toBeUndefined();
    });

    it('denies LEGAL from directly executing HOL_APPROVED at PENDING_HOL stage', async () => {
      await testEnv.withSecurityRulesDisabled(async (adminContext) => {
        await adminContext.firestore().doc(`contracts/${CONTRACT_ID}`).update({ status: 'PENDING_HOL' });
      });

      const legalDb = getAuthContext(testEnv, LEGAL_STAFF.uid, LEGAL_STAFF).firestore();
      await expect(
        assertFails(
          legalDb.doc(`contracts/${CONTRACT_ID}`).update({
            status: 'HOL_APPROVED',
          })
        )
      ).resolves.toBeDefined();
    });

    it('allows HOL to approve contract PENDING_HOL -> HOL_APPROVED', async () => {
      await testEnv.withSecurityRulesDisabled(async (adminContext) => {
        await adminContext.firestore().doc(`contracts/${CONTRACT_ID}`).update({ status: 'PENDING_HOL' });
      });

      const holDb = getAuthContext(testEnv, HEAD_OF_LEGAL.uid, HEAD_OF_LEGAL).firestore();
      await expect(
        assertSucceeds(
          holDb.doc(`contracts/${CONTRACT_ID}`).update({
            status: 'HOL_APPROVED',
          })
        )
      ).resolves.toBeUndefined();
    });

    it('allows HOL to request change PENDING_HOL -> USER_REVISING', async () => {
      await testEnv.withSecurityRulesDisabled(async (adminContext) => {
        await adminContext.firestore().doc(`contracts/${CONTRACT_ID}`).update({ status: 'PENDING_HOL' });
      });

      const holDb = getAuthContext(testEnv, HEAD_OF_LEGAL.uid, HEAD_OF_LEGAL).firestore();
      await expect(
        assertSucceeds(
          holDb.doc(`contracts/${CONTRACT_ID}`).update({
            status: 'USER_REVISING',
            rejectCount: 1,
          })
        )
      ).resolves.toBeUndefined();
    });

    it('allows owner USER to complete contract HOL_APPROVED -> COMPLETED', async () => {
      await testEnv.withSecurityRulesDisabled(async (adminContext) => {
        await adminContext.firestore().doc(`contracts/${CONTRACT_ID}`).update({ status: 'HOL_APPROVED' });
      });

      const userDb = getAuthContext(testEnv, OWNER_USER.uid, OWNER_USER).firestore();
      await expect(
        assertSucceeds(
          userDb.doc(`contracts/${CONTRACT_ID}`).update({
            status: 'COMPLETED',
          })
        )
      ).resolves.toBeUndefined();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SUITE 3: Subcollection /versions/{versionId} Rules
  // ══════════════════════════════════════════════════════════════
  describe('Suite 3: Subcollection /versions Permissions & Immutability', () => {
    it('allows Staff to update isApprovedVersion and fileName on version doc when approving', async () => {
      const holDb = getAuthContext(testEnv, HEAD_OF_LEGAL.uid, HEAD_OF_LEGAL).firestore();
      const versionDocRef = holDb.doc(`contracts/${CONTRACT_ID}/versions/v1`);

      // HOL marks version as approved
      await expect(
        assertSucceeds(
          versionDocRef.update({
            fileName: `${CONTRACT_ID}_approved.docx`,
            isApprovedVersion: true,
          })
        )
      ).resolves.toBeUndefined();
    });

    it('denies updating immutable fields (e.g. storagePath, versionNo) on version doc', async () => {
      const holDb = getAuthContext(testEnv, HEAD_OF_LEGAL.uid, HEAD_OF_LEGAL).firestore();
      const versionDocRef = holDb.doc(`contracts/${CONTRACT_ID}/versions/v1`);

      // Attempting to alter storagePath should be rejected
      await expect(
        assertFails(
          versionDocRef.update({
            storagePath: 'malicious/path.docx',
          })
        )
      ).resolves.toBeDefined();
    });

    it('denies deleting version document by any user', async () => {
      const holDb = getAuthContext(testEnv, HEAD_OF_LEGAL.uid, HEAD_OF_LEGAL).firestore();
      await expect(assertFails(holDb.doc(`contracts/${CONTRACT_ID}/versions/v1`).delete())).resolves.toBeDefined();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SUITE 4: Subcollection /comments/{commentId} Rules
  // ══════════════════════════════════════════════════════════════
  describe('Suite 4: Subcollection /comments Authenticity & Immutability', () => {
    it('allows creating comment when author.uid matches authenticated uid', async () => {
      const userDb = getAuthContext(testEnv, OWNER_USER.uid, OWNER_USER).firestore();
      const commentRef = userDb.collection(`contracts/${CONTRACT_ID}/comments`).doc();

      await expect(
        assertSucceeds(
          commentRef.set({
            commentId: commentRef.id,
            versionNo: 1,
            commentText: 'Bình luận giải trình',
            type: 'USER_RESPONSE',
            author: {
              uid: OWNER_USER.uid,
              displayName: 'User Owner',
              role: 'USER',
            },
          })
        )
      ).resolves.toBeUndefined();
    });

    it('denies creating comment when author.uid does not match authenticated uid', async () => {
      const userDb = getAuthContext(testEnv, OWNER_USER.uid, OWNER_USER).firestore();
      const commentRef = userDb.collection(`contracts/${CONTRACT_ID}/comments`).doc();

      await expect(
        assertFails(
          commentRef.set({
            commentId: commentRef.id,
            versionNo: 1,
            commentText: 'Bình luận giả mạo',
            type: 'USER_RESPONSE',
            author: {
              uid: 'someone_else_uid',
              displayName: 'Mạo danh',
              role: 'USER',
            },
          })
        )
      ).resolves.toBeDefined();
    });

    it('denies updating or deleting existing comment (comments are immutable)', async () => {
      const commentId = 'comment-initial';
      await testEnv.withSecurityRulesDisabled(async (adminContext) => {
        await adminContext.firestore().doc(`contracts/${CONTRACT_ID}/comments/${commentId}`).set({
          commentId,
          commentText: 'Gốc',
          author: { uid: OWNER_USER.uid },
        });
      });

      const userDb = getAuthContext(testEnv, OWNER_USER.uid, OWNER_USER).firestore();
      await expect(assertFails(userDb.doc(`contracts/${CONTRACT_ID}/comments/${commentId}`).update({ commentText: 'Sửa' }))).resolves.toBeDefined();
      await expect(assertFails(userDb.doc(`contracts/${CONTRACT_ID}/comments/${commentId}`).delete())).resolves.toBeDefined();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SUITE 5: Atomic WriteBatch Simulation (Exact Holy Grail Transition)
  // ══════════════════════════════════════════════════════════════
  describe('Suite 5: HOL Approve writeBatch Real World Simulation', () => {
    it('executes the full atomic writeBatch (contract update, version mark, activity log, comment log) without PERMISSION_DENIED', async () => {
      // 1. Contract starts at PENDING_HOL
      await testEnv.withSecurityRulesDisabled(async (adminContext) => {
        await adminContext.firestore().doc(`contracts/${CONTRACT_ID}`).update({ status: 'PENDING_HOL' });
      });

      const holDb = getAuthContext(testEnv, HEAD_OF_LEGAL.uid, HEAD_OF_LEGAL).firestore();

      // 2. Perform writeBatch identically to taskService.ts
      const batch = holDb.batch();

      // Write A: Contract status update
      const contractRef = holDb.doc(`contracts/${CONTRACT_ID}`);
      batch.update(contractRef, {
        status: 'HOL_APPROVED',
        currentVersionFile: {
          versionNo: 1,
          originalFileName: `${CONTRACT_ID}_approved.docx`,
          storagePath: `contracts/${CONTRACT_ID}/versions/v1.docx`,
        },
      });

      // Write B: Version doc mark approved
      const versionRef = holDb.doc(`contracts/${CONTRACT_ID}/versions/v1`);
      batch.set(versionRef, {
        fileName: `${CONTRACT_ID}_approved.docx`,
        isApprovedVersion: true,
      }, { merge: true });

      // Write C: Activity log
      const actRef = holDb.collection(`contracts/${CONTRACT_ID}/activities`).doc();
      batch.set(actRef, {
        activityId: actRef.id,
        action: 'STATUS_CHANGE',
        performedBy: { uid: HEAD_OF_LEGAL.uid, role: 'HOL' },
        details: 'Phê duyệt hợp đồng',
      });

      // Write D: System comment bubble
      const commentRef = holDb.collection(`contracts/${CONTRACT_ID}/comments`).doc();
      batch.set(commentRef, {
        commentId: commentRef.id,
        versionNo: 1,
        commentText: 'Phê duyệt',
        type: 'SYSTEM_STATUS_CHANGE',
        author: { uid: HEAD_OF_LEGAL.uid, role: 'HOL' },
      });

      // 3. Commit should succeed 100%
      await expect(assertSucceeds(batch.commit())).resolves.toBeUndefined();
    });
  });
});
