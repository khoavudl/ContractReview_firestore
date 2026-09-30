import * as admin from 'firebase-admin';

let isInitialized = false;

/**
 * Initializes and returns the Firebase Admin SDK singleton.
 */
export function getFirebaseAdmin(): typeof admin {
  if (!isInitialized && admin.apps.length === 0) {
    admin.initializeApp();
    isInitialized = true;
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
