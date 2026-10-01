/**
 * Feature: Contracts Management — Archive Lookup
 * Service: archivedContractService.ts — One-time fetch with TTL Cache & Client-Side In-Memory Search
 */

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  type Firestore,
} from 'firebase/firestore';
import {
  getFirebaseDb,
  isMockDevEnvironment,
  toValidDate,
  type AuthUser,
  type ContractDocument,
} from '@/shared';
import { DEV_SAMPLE_CONTRACTS } from './contractService';

export interface ArchivedCacheEntry {
  data: ContractDocument[];
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory TTL
const memoryCache = new Map<string, ArchivedCacheEntry>();

/**
 * Remove Vietnamese diacritics and convert to lowercase for accent-insensitive search
 */
export function normalizeSearchText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
}

/**
 * Client-Side In-Memory multi-field search (Contract ID, Title, Supplier, Description)
 * Runs 100% on browser RAM (0 Firestore reads)
 */
export function filterArchivedContracts(
  contracts: readonly ContractDocument[],
  keyword: string
): ContractDocument[] {
  const normKw = normalizeSearchText(keyword);
  if (!normKw) {
    return [...contracts];
  }

  return contracts.filter((c) => {
    const normId = normalizeSearchText(c.contractId);
    const normTitle = normalizeSearchText(c.title);
    const normSupplier = normalizeSearchText(c.supplier);
    const normDesc = normalizeSearchText(c.description || '');

    return (
      normId.includes(normKw) ||
      normTitle.includes(normKw) ||
      normSupplier.includes(normKw) ||
      normDesc.includes(normKw)
    );
  });
}

/**
 * Fetch archived (completed) contracts via one-time getDocs with In-Memory Cache
 */
export async function fetchArchivedContracts(
  currentUser: AuthUser | null,
  limitCount = 100,
  dbInstance?: Firestore
): Promise<ContractDocument[]> {
  const cacheKey = currentUser ? `${currentUser.uid}_${currentUser.role}` : 'anon';
  const cached = memoryCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return [...cached.data];
  }

  const isMock = isMockDevEnvironment() || import.meta.env.MODE === 'test';
  if (isMock) {
    // In Mock mode, filter sample contracts with completed / approved / archived status
    let mockList = DEV_SAMPLE_CONTRACTS.filter(
      (c) => c.status === 'HOL_APPROVED' || c.status === 'COMPLETED' || c.isArchived
    );

    // If USER role, filter by creator
    if (currentUser && currentUser.role === 'USER') {
      mockList = mockList.filter((c) => c.createdBy.uid === currentUser.uid);
    }

    mockList.sort((a, b) => {
      const timeB = toValidDate(b.updatedAt)?.getTime() ?? 0;
      const timeA = toValidDate(a.updatedAt)?.getTime() ?? 0;
      return timeB - timeA;
    });
    const result = mockList.slice(0, limitCount);

    memoryCache.set(cacheKey, { data: result, fetchedAt: now });
    return [...result];
  }

  const db = dbInstance ?? getFirebaseDb();
  const contractsRef = collection(db, 'contracts');

  // Build secure query based on role
  const isRegularUser = currentUser?.role === 'USER';
  const q = isRegularUser
    ? query(
        contractsRef,
        where('createdBy.uid', '==', currentUser.uid),
        where('status', 'in', ['HOL_APPROVED', 'COMPLETED']),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      )
    : query(
        contractsRef,
        where('status', 'in', ['HOL_APPROVED', 'COMPLETED']),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );

  const snapshot = await getDocs(q);
  const results: ContractDocument[] = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      contractId: d.id,
      createdAt: toValidDate(data.createdAt),
      updatedAt: toValidDate(data.updatedAt),
    } as ContractDocument;
  });

  memoryCache.set(cacheKey, { data: results, fetchedAt: now });
  return results;
}

/**
 * Reset in-memory cache for unit testing
 */
export function resetArchivedCacheForTesting(): void {
  memoryCache.clear();
}
