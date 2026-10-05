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
  { document: 'users/{uid}', region: 'asia-southeast1' },
  async (event) => {
  const uid = event.params.uid;
  if (!uid || !event.data) {
    return;
  }

  const afterSnap = event.data.after;
  const userData = afterSnap.exists
    ? (afterSnap.data() as Partial<UserDocument>)
    : undefined;

  const result = await syncUserCustomClaims(getAuth(), uid, userData);

  if (!result.success) {
    console.warn(
      `[onUserDocWrite] Could not sync claims for UID ${uid}: ${result.reason}`,
      result.error ?? ''
    );
    return;
  }

  console.log(`[onUserDocWrite] Claims synchronized for UID ${uid}:`, result.claims);
});
