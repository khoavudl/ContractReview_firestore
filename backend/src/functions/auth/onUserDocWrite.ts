import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getAuth } from '../../config/firebaseAdmin.js';
import { syncUserCustomClaims } from '../../modules/auth/index.js';
import type { UserDocument } from '../../types/index.js';

/**
 * Cloud Function v2 Firestore Trigger:
 * Listens to writes on `/users/{uid}` and syncs custom claims to Firebase Auth.
 * Enables 0-read cost in Firestore Security Rules.
 */
export const onUserDocWrite = onDocumentWritten(
  { document: 'users/{userId}', region: 'asia-southeast1' },
  async (event) => {
    const userId = event.params.userId;
    if (!userId || !event.data) {
      return;
    }

    const afterSnap = event.data.after;
    const userData = afterSnap.exists
      ? (afterSnap.data() as Partial<UserDocument>)
      : undefined;

    const auth = getAuth();
    let targetUid = userData?.uid;

    if (!targetUid && userId.includes('@')) {
      try {
        const userRecord = await auth.getUserByEmail(userId.toLowerCase());
        targetUid = userRecord.uid;
      } catch (err: unknown) {
        console.warn(`[onUserDocWrite] User not found in Auth by email ${userId}:`, err);
      }
    }

    if (!targetUid) {
      targetUid = userId;
    }

    const result = await syncUserCustomClaims(auth, targetUid, userData);

    if (!result.success) {
      console.warn(
        `[onUserDocWrite] Could not sync claims for UID ${targetUid}: ${result.reason}`,
        result.error ?? ''
      );
      return;
    }

    console.log(`[onUserDocWrite] Claims synchronized for UID ${targetUid}:`, result.claims);
  }
);
