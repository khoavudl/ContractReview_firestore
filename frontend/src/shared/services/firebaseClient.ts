/**
 * Firebase Client SDK Wrapper
 * Shared Core Layer — Singleton instances for App, Auth, Firestore, Storage, Functions
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';
import {
  getStorage,
  connectStorageEmulator,
  type FirebaseStorage,
} from 'firebase/storage';
import {
  getFunctions,
  connectFunctionsEmulator,
  type Functions,
} from 'firebase/functions';
import {
  getFirebaseConfig,
  getEmulatorConfig,
  type FirebaseClientConfig,
  type EmulatorConfig,
} from './firebaseConfig';

interface FirebaseServices {
  readonly app: FirebaseApp;
  readonly auth: Auth;
  readonly db: Firestore;
  readonly storage: FirebaseStorage;
  readonly functions: Functions;
}

let servicesInstance: FirebaseServices | null = null;
let hasConnectedEmulators = false;

/**
 * Initialize Firestore instance with persistent IndexedDB multi-tab local cache.
 * Falls back to getFirestore(app) if already initialized or in environments without IndexedDB.
 */
function createFirestoreInstance(app: FirebaseApp): Firestore {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    return getFirestore(app);
  }
}

/**
 * Connect Firebase Services to Local Emulators if configured
 */
function attachEmulators(
  services: FirebaseServices,
  config: EmulatorConfig
): void {
  if (!config.enabled || hasConnectedEmulators) {
    return;
  }

  connectAuthEmulator(services.auth, config.authHost, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(services.db, config.firestoreHost, config.firestorePort);
  connectStorageEmulator(services.storage, config.storageHost, config.storagePort);
  connectFunctionsEmulator(
    services.functions,
    config.functionsHost,
    config.functionsPort
  );

  hasConnectedEmulators = true;
}

/**
 * Initialize or retrieve the singleton Firebase App instance
 */
function createFirebaseApp(customConfig?: FirebaseClientConfig): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  const config = customConfig || getFirebaseConfig();
  return initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  });
}

/**
 * Initialize all Firebase Client SDK services as a singleton bundle
 */
export function initializeFirebaseClient(
  clientConfig?: FirebaseClientConfig,
  emulatorConfig?: EmulatorConfig
): FirebaseServices {
  if (servicesInstance) {
    return servicesInstance;
  }

  const app = createFirebaseApp(clientConfig);
  const cfg = clientConfig || getFirebaseConfig();
  const emuCfg = emulatorConfig || getEmulatorConfig();

  const services: FirebaseServices = {
    app,
    auth: getAuth(app),
    db: createFirestoreInstance(app),
    storage: getStorage(app),
    functions: getFunctions(app, cfg.functionsRegion),
  };

  attachEmulators(services, emuCfg);
  servicesInstance = services;
  return servicesInstance;
}

/**
 * Get the singleton Firebase App instance
 */
export function getFirebaseApp(): FirebaseApp {
  return initializeFirebaseClient().app;
}

/**
 * Get the singleton Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  return initializeFirebaseClient().auth;
}

/**
 * Get the singleton Firestore Database instance
 */
export function getFirebaseDb(): Firestore {
  return initializeFirebaseClient().db;
}

/**
 * Get the singleton Firebase Storage instance
 */
export function getFirebaseStorage(): FirebaseStorage {
  return initializeFirebaseClient().storage;
}

/**
 * Get the singleton Firebase Cloud Functions instance
 */
export function getFirebaseFunctions(): Functions {
  return initializeFirebaseClient().functions;
}

/**
 * Reset singleton state (Internal helper for unit testing)
 */
export function resetFirebaseClientForTesting(): void {
  servicesInstance = null;
  hasConnectedEmulators = false;
}
