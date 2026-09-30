/**
 * Firebase Client SDK Configuration & Environment Validator
 * Shared Core Layer — Type-safe configuration extraction
 */

export interface FirebaseClientConfig {
  readonly apiKey: string;
  readonly authDomain: string;
  readonly projectId: string;
  readonly storageBucket: string;
  readonly messagingSenderId: string;
  readonly appId: string;
  readonly functionsRegion: string;
}

export interface EmulatorConfig {
  readonly enabled: boolean;
  readonly authHost: string;
  readonly firestoreHost: string;
  readonly firestorePort: number;
  readonly storageHost: string;
  readonly storagePort: number;
  readonly functionsHost: string;
  readonly functionsPort: number;
}

const REQUIRED_CONFIG_KEYS: ReadonlyArray<{
  key: keyof ImportMetaEnv;
  field: keyof FirebaseClientConfig;
}> = [
  { key: 'VITE_FIREBASE_API_KEY', field: 'apiKey' },
  { key: 'VITE_FIREBASE_AUTH_DOMAIN', field: 'authDomain' },
  { key: 'VITE_FIREBASE_PROJECT_ID', field: 'projectId' },
  { key: 'VITE_FIREBASE_STORAGE_BUCKET', field: 'storageBucket' },
  { key: 'VITE_FIREBASE_MESSAGING_SENDER_ID', field: 'messagingSenderId' },
  { key: 'VITE_FIREBASE_APP_ID', field: 'appId' },
];

/**
 * Validate and extract Firebase configuration from environment
 */
export function getFirebaseConfig(
  env: Partial<ImportMetaEnv> = import.meta.env
): FirebaseClientConfig {
  const missingKeys = REQUIRED_CONFIG_KEYS.filter((item) => !env[item.key]).map(
    (item) => item.key
  );

  if (missingKeys.length > 0) {
    throw new Error(
      `Thiếu biến môi trường Firebase bắt buộc: ${missingKeys.join(', ')}`
    );
  }

  return {
    apiKey: env.VITE_FIREBASE_API_KEY!,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN!,
    projectId: env.VITE_FIREBASE_PROJECT_ID!,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
    appId: env.VITE_FIREBASE_APP_ID!,
    functionsRegion: env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1',
  };
}

/**
 * Check if Firebase Emulators are enabled
 */
export function isEmulatorMode(
  env: Partial<ImportMetaEnv> = import.meta.env
): boolean {
  return env.VITE_USE_EMULATORS === 'true';
}

/**
 * Parse and return Emulator configuration with default fallback ports
 */
export function getEmulatorConfig(
  env: Partial<ImportMetaEnv> = import.meta.env
): EmulatorConfig {
  return {
    enabled: isEmulatorMode(env),
    authHost: env.VITE_EMULATOR_AUTH_HOST || 'http://127.0.0.1:9099',
    firestoreHost: env.VITE_EMULATOR_FIRESTORE_HOST || '127.0.0.1',
    firestorePort: Number(env.VITE_EMULATOR_FIRESTORE_PORT) || 8080,
    storageHost: env.VITE_EMULATOR_STORAGE_HOST || '127.0.0.1',
    storagePort: Number(env.VITE_EMULATOR_STORAGE_PORT) || 9199,
    functionsHost: env.VITE_EMULATOR_FUNCTIONS_HOST || '127.0.0.1',
    functionsPort: Number(env.VITE_EMULATOR_FUNCTIONS_PORT) || 5001,
  };
}
