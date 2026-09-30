import { getDb, getFirebaseAdmin } from '../src/config/firebaseAdmin.js';
import { validateWhitelistUser } from '../src/modules/auth/whitelistValidator.js';
import type { UserRole } from '../src/types/index.js';

interface SeedUserData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department: string;
  isActive: boolean;
}

export const SAMPLE_USERS: SeedUserData[] = [
  {
    uid: 'user_sales_01',
    email: 'user.sales@foodempire.vn',
    displayName: 'Nguyễn Văn Phụ Trách',
    role: 'USER',
    department: 'Sales Department',
    isActive: true,
  },
  {
    uid: 'legal_specialist_01',
    email: 'legal.specialist@foodempire.vn',
    displayName: 'Trần Thị Pháp Chế',
    role: 'LEGAL',
    department: 'Legal Department',
    isActive: true,
  },
  {
    uid: 'head_of_legal_01',
    email: 'head.legal@foodempire.vn',
    displayName: 'Lê Văn Trưởng Phòng',
    role: 'HOL',
    department: 'Legal Department',
    isActive: true,
  },
];

/**
 * Seeds sample whitelist users into Cloud Firestore /users collection.
 */
export async function seedWhitelistUsers(): Promise<void> {
  // Ensure default emulator hosts if running locally
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  }
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  }

  const db = getDb();
  const admin = getFirebaseAdmin();
  const auth = admin.auth();
  const now = admin.firestore.Timestamp.now();

  console.log(`[Seed] Starting seed of ${SAMPLE_USERS.length} sample users...`);

  for (const user of SAMPLE_USERS) {
    const validation = validateWhitelistUser(user);
    if (!validation.isValid) {
      throw new Error(`Invalid user ${user.email}: ${validation.errors.join(', ')}`);
    }

    await db.collection('users').doc(user.uid).set(
      {
        ...user,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    // Sync Auth Emulator account and Custom Claims
    try {
      try {
        await auth.getUser(user.uid);
      } catch {
        await auth.createUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          password: 'Password123!',
        });
      }
      await auth.setCustomUserClaims(user.uid, {
        role: user.role,
        isActive: user.isActive,
      });
    } catch (authErr) {
      console.warn(`[Seed Warning] Could not sync Auth for ${user.email}:`, authErr);
    }

    console.log(`[Seed] Successfully seeded: ${user.email} (${user.role})`);
  }

  // Seed initial counter for current period if not exists
  const period = new Date().toISOString().slice(2, 7).replace('-', '');
  const counterRef = db.collection('counters').doc(`contracts_${period}`);
  const counterSnap = await counterRef.get();
  if (!counterSnap.exists) {
    await counterRef.set({ lastSeq: 0, period, updatedAt: now });
    console.log(`[Seed] Initialized counter /counters/contracts_${period} with lastSeq: 0, period: ${period}`);
  } else {
    const existing = counterSnap.data();
    if (!existing?.period) {
      await counterRef.set({ period }, { merge: true });
      console.log(`[Seed] Updated missing period: ${period} in /counters/contracts_${period}`);
    }
  }

  console.log('[Seed] Whitelist users seeded successfully.');
}

// Run directly if invoked via CLI
if (process.argv[1]?.endsWith('seedWhitelistUsers.ts')) {
  seedWhitelistUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}
