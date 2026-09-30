import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getFirebaseConfig,
  isEmulatorMode,
  getEmulatorConfig,
  type FirebaseClientConfig,
  type EmulatorConfig,
} from './firebaseConfig';
import {
  initializeFirebaseClient,
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
  getFirebaseFunctions,
  resetFirebaseClientForTesting,
} from './firebaseClient';

// Mock Firebase SDK modules using vi.hoisted to prevent hoisting TDZ
const {
  mockAppInstance,
  mockAuthInstance,
  mockDbInstance,
  mockStorageInstance,
  mockFunctionsInstance,
  mockInitializeApp,
  mockGetApps,
  mockGetApp,
  mockGetAuth,
  mockConnectAuthEmulator,
  mockGetFirestore,
  mockConnectFirestoreEmulator,
  mockGetStorage,
  mockConnectStorageEmulator,
  mockGetFunctions,
  mockConnectFunctionsEmulator,
} = vi.hoisted(() => {
  const app = { name: '[DEFAULT]', options: {} };
  const auth = { name: 'mockAuth' };
  const db = { name: 'mockDb' };
  const storage = { name: 'mockStorage' };
  const functions = { name: 'mockFunctions' };

  return {
    mockAppInstance: app,
    mockAuthInstance: auth,
    mockDbInstance: db,
    mockStorageInstance: storage,
    mockFunctionsInstance: functions,
    mockInitializeApp: vi.fn(() => app),
    mockGetApps: vi.fn<() => unknown[]>(() => []),
    mockGetApp: vi.fn(() => app),
    mockGetAuth: vi.fn(() => auth),
    mockConnectAuthEmulator: vi.fn(),
    mockGetFirestore: vi.fn(() => db),
    mockConnectFirestoreEmulator: vi.fn(),
    mockGetStorage: vi.fn(() => storage),
    mockConnectStorageEmulator: vi.fn(),
    mockGetFunctions: vi.fn(() => functions),
    mockConnectFunctionsEmulator: vi.fn(),
  };
});

vi.mock('firebase/app', () => ({
  initializeApp: mockInitializeApp,
  getApps: mockGetApps,
  getApp: mockGetApp,
}));

vi.mock('firebase/auth', () => ({
  getAuth: mockGetAuth,
  connectAuthEmulator: mockConnectAuthEmulator,
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: mockGetFirestore,
  connectFirestoreEmulator: mockConnectFirestoreEmulator,
}));

vi.mock('firebase/storage', () => ({
  getStorage: mockGetStorage,
  connectStorageEmulator: mockConnectStorageEmulator,
}));

vi.mock('firebase/functions', () => ({
  getFunctions: mockGetFunctions,
  connectFunctionsEmulator: mockConnectFunctionsEmulator,
}));

const validTestConfig: FirebaseClientConfig = {
  apiKey: 'test-api-key',
  authDomain: 'test-project.firebaseapp.com',
  projectId: 'test-project',
  storageBucket: 'test-project.firebasestorage.app',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abcdef',
  functionsRegion: 'us-central1',
};

const disabledEmulatorConfig: EmulatorConfig = {
  enabled: false,
  authHost: 'http://127.0.0.1:9099',
  firestoreHost: '127.0.0.1',
  firestorePort: 8080,
  storageHost: '127.0.0.1',
  storagePort: 9199,
  functionsHost: '127.0.0.1',
  functionsPort: 5001,
};

describe('firebaseConfig', () => {
  it('should throw descriptive error when mandatory environment variables are missing', () => {
    expect(() => getFirebaseConfig({})).toThrowError(
      /Thiếu biến môi trường Firebase bắt buộc/
    );
  });

  it('should return valid FirebaseClientConfig when all required env vars are provided', () => {
    const config = getFirebaseConfig({
      VITE_FIREBASE_API_KEY: 'key-123',
      VITE_FIREBASE_AUTH_DOMAIN: 'app.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'app-id',
      VITE_FIREBASE_STORAGE_BUCKET: 'app-id.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '999',
      VITE_FIREBASE_APP_ID: '1:999:web:xxx',
    });

    expect(config.apiKey).toBe('key-123');
    expect(config.projectId).toBe('app-id');
    expect(config.functionsRegion).toBe('us-central1'); // default fallback
  });

  it('should respect custom functionsRegion when provided', () => {
    const config = getFirebaseConfig({
      VITE_FIREBASE_API_KEY: 'key-123',
      VITE_FIREBASE_AUTH_DOMAIN: 'app.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'app-id',
      VITE_FIREBASE_STORAGE_BUCKET: 'app-id.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '999',
      VITE_FIREBASE_APP_ID: '1:999:web:xxx',
      VITE_FIREBASE_FUNCTIONS_REGION: 'asia-southeast1',
    });

    expect(config.functionsRegion).toBe('asia-southeast1');
  });

  it('should correctly detect emulator mode', () => {
    expect(isEmulatorMode({ VITE_USE_EMULATORS: 'true' })).toBe(true);
    expect(isEmulatorMode({ VITE_USE_EMULATORS: 'false' })).toBe(false);
    expect(isEmulatorMode({})).toBe(false);
  });

  it('should parse custom emulator ports and fallback to defaults', () => {
    const defaultEmu = getEmulatorConfig({});
    expect(defaultEmu.enabled).toBe(false);
    expect(defaultEmu.firestorePort).toBe(8080);
    expect(defaultEmu.storagePort).toBe(9199);
    expect(defaultEmu.functionsPort).toBe(5001);

    const customEmu = getEmulatorConfig({
      VITE_USE_EMULATORS: 'true',
      VITE_EMULATOR_FIRESTORE_PORT: '8888',
      VITE_EMULATOR_STORAGE_PORT: '9999',
    });
    expect(customEmu.enabled).toBe(true);
    expect(customEmu.firestorePort).toBe(8888);
    expect(customEmu.storagePort).toBe(9999);
  });
});

describe('firebaseClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFirebaseClientForTesting();
    mockGetApps.mockReturnValue([]);
  });

  it('should initialize Firebase App as singleton on first call', () => {
    const services = initializeFirebaseClient(
      validTestConfig,
      disabledEmulatorConfig
    );

    expect(mockInitializeApp).toHaveBeenCalledTimes(1);
    expect(services.app).toBe(mockAppInstance);
    expect(services.auth).toBe(mockAuthInstance);
    expect(services.db).toBe(mockDbInstance);
    expect(services.storage).toBe(mockStorageInstance);
    expect(services.functions).toBe(mockFunctionsInstance);

    // Call again, should not re-initialize
    const secondCall = initializeFirebaseClient(
      validTestConfig,
      disabledEmulatorConfig
    );
    expect(secondCall).toBe(services);
    expect(mockInitializeApp).toHaveBeenCalledTimes(1);
  });

  it('should reuse existing app if getApps() already has an instance', () => {
    mockGetApps.mockReturnValue([mockAppInstance]);

    const services = initializeFirebaseClient(
      validTestConfig,
      disabledEmulatorConfig
    );

    expect(mockGetApp).toHaveBeenCalled();
    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(services.app).toBe(mockAppInstance);
  });

  it('should provide individual getters returning identical instances', () => {
    initializeFirebaseClient(validTestConfig, disabledEmulatorConfig);

    expect(getFirebaseApp()).toBe(mockAppInstance);
    expect(getFirebaseAuth()).toBe(mockAuthInstance);
    expect(getFirebaseDb()).toBe(mockDbInstance);
    expect(getFirebaseStorage()).toBe(mockStorageInstance);
    expect(getFirebaseFunctions()).toBe(mockFunctionsInstance);
  });

  it('should connect to Emulators when enabled is true', () => {
    const enabledEmulatorConfig: EmulatorConfig = {
      ...disabledEmulatorConfig,
      enabled: true,
      authHost: 'http://127.0.0.1:9099',
      firestoreHost: '127.0.0.1',
      firestorePort: 8080,
      storageHost: '127.0.0.1',
      storagePort: 9199,
      functionsHost: '127.0.0.1',
      functionsPort: 5001,
    };

    initializeFirebaseClient(validTestConfig, enabledEmulatorConfig);

    expect(mockConnectAuthEmulator).toHaveBeenCalledWith(
      mockAuthInstance,
      'http://127.0.0.1:9099',
      { disableWarnings: true }
    );
    expect(mockConnectFirestoreEmulator).toHaveBeenCalledWith(
      mockDbInstance,
      '127.0.0.1',
      8080
    );
    expect(mockConnectStorageEmulator).toHaveBeenCalledWith(
      mockStorageInstance,
      '127.0.0.1',
      9199
    );
    expect(mockConnectFunctionsEmulator).toHaveBeenCalledWith(
      mockFunctionsInstance,
      '127.0.0.1',
      5001
    );
  });

  it('should NOT connect to Emulators when enabled is false', () => {
    initializeFirebaseClient(validTestConfig, disabledEmulatorConfig);

    expect(mockConnectAuthEmulator).not.toHaveBeenCalled();
    expect(mockConnectFirestoreEmulator).not.toHaveBeenCalled();
    expect(mockConnectStorageEmulator).not.toHaveBeenCalled();
    expect(mockConnectFunctionsEmulator).not.toHaveBeenCalled();
  });
});
