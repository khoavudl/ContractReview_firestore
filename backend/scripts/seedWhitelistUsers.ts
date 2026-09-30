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
  const db = getDb();
  const admin = getFirebaseAdmin();
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
    console.log(`[Seed] Successfully seeded: ${user.email} (${user.role})`);
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
