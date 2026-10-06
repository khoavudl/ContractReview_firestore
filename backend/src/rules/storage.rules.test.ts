/**
 * Automated Security Rules Tests for Firebase Storage (storage.rules)
 * Verifies Whitelist Enforcement, Data Isolation, and Unauthenticated/Stranger Lockout.
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

describe('Firebase Storage Security Rules Automated Testing', () => {
  let testEnv: RulesTestEnvironment;

  const OWNER_USER = { uid: 'user_sales_01', email: 'user.sales@foodempire.vn', role: 'USER' as const, isActive: true };
  const LEGAL_STAFF = { uid: 'legal_specialist_01', email: 'legal@foodempire.vn', role: 'LEGAL' as const, isActive: true };
  const HEAD_OF_LEGAL = { uid: 'head_of_legal_01', email: 'head.legal@foodempire.vn', role: 'HOL' as const, isActive: true };
  const INACTIVE_USER = { uid: 'user_locked_03', email: 'locked@foodempire.vn', role: 'USER' as const, isActive: false };
  const STRANGER_GMAIL = { uid: 'stranger_attacker_99', email: 'attacker@gmail.com' };

  const CONTRACT_ID = 'CTR-2609-0001';
  const VERSION_PATH = `contracts/${CONTRACT_ID}/versions/v1.docx`;
  const REF_FILE_PATH = `contracts/${CONTRACT_ID}/reference_files/ref-001.pdf`;

  const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const PDF_MIME = 'application/pdf';

  beforeAll(async () => {
    testEnv = await createRulesTestEnv();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.clearStorage();

    // Seed Firestore user docs and initial contract
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      const db = adminContext.firestore();

      // Seed /users documents
      await db.doc(`users/${OWNER_USER.email.toLowerCase()}`).set({ ...OWNER_USER, displayName: 'User Owner' });
      await db.doc(`users/${LEGAL_STAFF.email.toLowerCase()}`).set({ ...LEGAL_STAFF, displayName: 'Legal Staff' });
      await db.doc(`users/${HEAD_OF_LEGAL.email.toLowerCase()}`).set({ ...HEAD_OF_LEGAL, displayName: 'Head Legal' });
      await db.doc(`users/${INACTIVE_USER.email.toLowerCase()}`).set({ ...INACTIVE_USER, displayName: 'Inactive User' });

      // Seed contract doc
      await db.doc(`contracts/${CONTRACT_ID}`).set({
        contractId: CONTRACT_ID,
        title: 'Hợp đồng mua bán thiết bị 2026',
        supplier: 'Công ty Cổ phần Alpha',
        status: 'DRAFT',
        currentVersion: 1,
        createdBy: { uid: OWNER_USER.uid, email: OWNER_USER.email, displayName: 'User Owner' },
      });

    });

    // Seed base storage files using whitelisted owner storage context
    const seederStorage = getAuthContext(testEnv, OWNER_USER.uid, OWNER_USER).storage();
    const versionRef = seederStorage.ref(VERSION_PATH);
    await versionRef.put(Buffer.from('dummy docx file content'), { contentType: DOCX_MIME });

    const refRef = seederStorage.ref(REF_FILE_PATH);
    await refRef.put(Buffer.from('dummy pdf file content'), { contentType: PDF_MIME });
  });

  // ══════════════════════════════════════════════════════════════
  // SUITE: Stranger & Unauthenticated Block (Hotfix Scope)
  // ══════════════════════════════════════════════════════════════
  describe('Storage Access Control & Stranger Lockout', () => {
    it('denies unauthenticated guests from reading or writing versions and reference files', async () => {
      const guestStorage = getUnauthenticatedContext(testEnv).storage();
      await expect(assertFails(guestStorage.ref(VERSION_PATH).getDownloadURL())).resolves.toBeDefined();
      await expect(assertFails(guestStorage.ref(REF_FILE_PATH).getDownloadURL())).resolves.toBeDefined();
      await expect(assertFails(guestStorage.ref(REF_FILE_PATH).delete())).resolves.toBeDefined();
    });

    it('denies strange Gmail user (not in whitelist) from reading contract version', async () => {
      const strangerStorage = getAuthContext(testEnv, STRANGER_GMAIL.uid, STRANGER_GMAIL).storage();
      await expect(assertFails(strangerStorage.ref(VERSION_PATH).getDownloadURL())).resolves.toBeDefined();
    });

    it('denies strange Gmail user from reading reference files', async () => {
      const strangerStorage = getAuthContext(testEnv, STRANGER_GMAIL.uid, STRANGER_GMAIL).storage();
      await expect(assertFails(strangerStorage.ref(REF_FILE_PATH).getDownloadURL())).resolves.toBeDefined();
    });

    it('denies strange Gmail user from deleting reference files', async () => {
      const strangerStorage = getAuthContext(testEnv, STRANGER_GMAIL.uid, STRANGER_GMAIL).storage();
      await expect(assertFails(strangerStorage.ref(REF_FILE_PATH).delete())).resolves.toBeDefined();
    });

    it('denies strange Gmail user from uploading contract version files', async () => {
      const strangerStorage = getAuthContext(testEnv, STRANGER_GMAIL.uid, STRANGER_GMAIL).storage();
      const targetPath = `contracts/${CONTRACT_ID}/versions/v2.docx`;
      await expect(
        assertFails(strangerStorage.ref(targetPath).put(Buffer.from('hack content'), { contentType: DOCX_MIME }) as unknown as Promise<unknown>)
      ).resolves.toBeDefined();
    });

    it('denies locked / inactive user from reading contract version', async () => {
      // Locked user has email in whitelist doc, but isActive == false
      const lockedStorage = getAuthContext(testEnv, INACTIVE_USER.uid, { email: INACTIVE_USER.email }).storage();
      await expect(assertFails(lockedStorage.ref(VERSION_PATH).getDownloadURL())).resolves.toBeDefined();
    });

    it('allows whitelisted user with claims to read version file', async () => {
      const userStorage = getAuthContext(testEnv, OWNER_USER.uid, OWNER_USER).storage();
      await expect(assertSucceeds(userStorage.ref(VERSION_PATH).getDownloadURL())).resolves.toBeDefined();
    });

    it('allows whitelisted user WITHOUT claims (fallback to /users doc) to read version file', async () => {
      // Only email provided in token, no role or isActive claims
      const fallbackStorage = getAuthContext(testEnv, OWNER_USER.uid, { email: OWNER_USER.email }).storage();
      await expect(assertSucceeds(fallbackStorage.ref(VERSION_PATH).getDownloadURL())).resolves.toBeDefined();
    });

    it('allows whitelisted user WITHOUT claims to upload reference file', async () => {
      const fallbackStorage = getAuthContext(testEnv, OWNER_USER.uid, { email: OWNER_USER.email }).storage();
      const newRefPath = `contracts/${CONTRACT_ID}/reference_files/ref-new-fallback.pdf`;
      await expect(
        assertSucceeds(fallbackStorage.ref(newRefPath).put(Buffer.from('sample pdf'), { contentType: PDF_MIME }) as unknown as Promise<unknown>)
      ).resolves.toBeDefined();
    });

    it('allows LEGAL and HOL staff to read version files on contracts', async () => {
      const legalStorage = getAuthContext(testEnv, LEGAL_STAFF.uid, LEGAL_STAFF).storage();
      const holStorage = getAuthContext(testEnv, HEAD_OF_LEGAL.uid, HEAD_OF_LEGAL).storage();

      await expect(assertSucceeds(legalStorage.ref(VERSION_PATH).getDownloadURL())).resolves.toBeDefined();
      await expect(assertSucceeds(holStorage.ref(VERSION_PATH).getDownloadURL())).resolves.toBeDefined();
    });

    it('allows full contract creation flow: contract doc in Firestore + v1.docx upload in Storage', async () => {
      const userAuth = getAuthContext(testEnv, OWNER_USER.uid, OWNER_USER);
      const userDb = userAuth.firestore();
      const userStorage = userAuth.storage();

      const newContractId = 'CTR-2609-0005';
      const newVersionPath = `contracts/${newContractId}/versions/v1.docx`;

      // 1. Create contract in Firestore
      await assertSucceeds(
        userDb.doc(`contracts/${newContractId}`).set({
          contractId: newContractId,
          title: 'Hợp đồng mới 2026',
          supplier: 'Đối tác mới',
          description: 'Mô tả',
          status: 'DRAFT',
          currentVersion: 1,
          createdBy: { uid: OWNER_USER.uid, email: OWNER_USER.email, displayName: 'User Owner' },
          rejectCount: 0,
          isArchived: false,
          companyRole: 'BUYER',
          currentVersionFile: {
            versionNo: 1,
            originalFileName: `${newContractId}_v1.docx`,
            storagePath: newVersionPath,
          },
        })
      );

      // 2. Upload v1.docx to Storage
      await assertSucceeds(
        userStorage.ref(newVersionPath).put(Buffer.from('new contract docx content'), { contentType: DOCX_MIME }) as unknown as Promise<unknown>
      );
    });
  });
});
