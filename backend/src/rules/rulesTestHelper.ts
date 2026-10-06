/**
 * Firestore Security Rules Testing Helper
 * Utilizes @firebase/rules-unit-testing to load and execute real security rules against emulator.
 */

import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

export { assertFails, assertSucceeds, type RulesTestEnvironment };

export interface MockTokenClaims {
  role?: 'USER' | 'LEGAL' | 'HOL';
  isActive?: boolean;
  email?: string;
  [key: string]: unknown;
}

const PROJECT_ID = 'contractreview-v2';

/**
 * Reads local firestore.rules and provisions the RulesTestEnvironment on Local Emulator.
 */
export async function createRulesTestEnv(): Promise<RulesTestEnvironment> {
  const rulesPath = path.resolve(__dirname, '../../../firestore.rules');
  if (!fs.existsSync(rulesPath)) {
    throw new Error(`Cannot locate firestore.rules at ${rulesPath}`);
  }
  const rules = fs.readFileSync(rulesPath, 'utf8');

  const storageRulesPath = path.resolve(__dirname, '../../../storage.rules');
  const storageRules = fs.existsSync(storageRulesPath)
    ? fs.readFileSync(storageRulesPath, 'utf8')
    : undefined;

  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] || '127.0.0.1',
      port: Number(process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1]) || 8080,
    },
    ...(storageRules
      ? {
          storage: {
            rules: storageRules,
            host: process.env.FIREBASE_STORAGE_EMULATOR_HOST?.split(':')[0] || '127.0.0.1',
            port: Number(process.env.FIREBASE_STORAGE_EMULATOR_HOST?.split(':')[1]) || 9199,
          },
        }
      : {}),
  });
}

/**
 * Returns authenticated context with custom claims.
 * Sanitizes claims to omit user identity fields (userId is passed as first param).
 */
export function getAuthContext(
  testEnv: RulesTestEnvironment,
  userId: string,
  rawClaims: MockTokenClaims = { role: 'USER', isActive: true }
) {
  const { uid: _unusedUid, sub: _unusedSub, user_id: _unusedUserId, ...claims } = rawClaims;
  return testEnv.authenticatedContext(userId, claims);
}

/**
 * Returns unauthenticated context (guest).
 */
export function getUnauthenticatedContext(testEnv: RulesTestEnvironment) {
  return testEnv.unauthenticatedContext();
}
