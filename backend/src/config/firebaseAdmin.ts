import * as admin from 'firebase-admin';

/**
 * Initializes and returns the Firebase Admin SDK singleton.
 */
export function getFirebaseAdmin(): typeof admin {
  try {
    admin.app();
  } catch {
    const projectId = process.env.PROJECT_ID || process.env.GCLOUD_PROJECT || 'contractreview-v2';
    const storageBucket = process.env.STORAGE_BUCKET || `${projectId}.firebasestorage.app`;
    admin.initializeApp({ projectId, storageBucket });
  }
  return admin;
}

/**
 * Returns the Firestore database instance.
 */
export function getDb(): admin.firestore.Firestore {
  return getFirebaseAdmin().firestore();
}

/**
 * Returns the Firebase Auth instance.
 */
export function getAuth(): admin.auth.Auth {
  return getFirebaseAdmin().auth();
}

/**
 * Returns the Firebase Cloud Storage bucket instance.
 */
export function getStorageBucket(): ReturnType<admin.storage.Storage['bucket']> {
  return getFirebaseAdmin().storage().bucket();
}
