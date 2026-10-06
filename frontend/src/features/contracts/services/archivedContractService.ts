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
  startAfter,
  type QueryConstraint,
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

function filterMockArchived(
  currentUser: AuthUser | null,
  limitCount: number,
  lastTimestamp?: Date | null
): ContractDocument[] {
  let list = DEV_SAMPLE_CONTRACTS.filter((c) => c.isArchived || c.status === 'COMPLETED');

  if (currentUser && currentUser.role === 'USER') {
    list = list.filter((c) => c.createdBy.uid === currentUser.uid || c.createdBy.email === currentUser.email);
  }

  list.sort((a, b) => {
    const timeB = toValidDate(b.updatedAt)?.getTime() ?? 0;
    const timeA = toValidDate(a.updatedAt)?.getTime() ?? 0;
    return timeB - timeA;
  });

  if (lastTimestamp) {
    const cutoff = lastTimestamp.getTime();
    list = list.filter((c) => (toValidDate(c.updatedAt)?.getTime() ?? 0) < cutoff);
  }

  return list.slice(0, limitCount);
}

async function fetchFirestoreArchived(
  db: Firestore,
  currentUser: AuthUser | null,
  limitCount: number,
  lastTimestamp?: Date | null
): Promise<ContractDocument[]> {
  const contractsRef = collection(db, 'contracts');
  const constraints: QueryConstraint[] = [
    where('isArchived', '==', true),
    orderBy('updatedAt', 'desc'),
  ];

  if (currentUser && currentUser.role === 'USER') {
    constraints.unshift(where('createdBy.uid', '==', currentUser.uid));
  }
  if (lastTimestamp) {
    constraints.push(startAfter(lastTimestamp));
  }
  constraints.push(limit(limitCount));

  const snapshot = await getDocs(query(contractsRef, ...constraints));
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      contractId: d.id,
      createdAt: toValidDate(data.createdAt),
      updatedAt: toValidDate(data.updatedAt),
    } as ContractDocument;
  });
}

/**
 * Fetch archived (completed) contracts via one-time getDocs with In-Memory Cache and pagination support.
 * Default limit is 20 contracts (Smart Limiting).
 */
export async function fetchArchivedContracts(
  currentUser: AuthUser | null,
  limitCount = 20,
  lastTimestamp?: Date | null,
  dbInstance?: Firestore
): Promise<ContractDocument[]> {
  const isFirstPage = !lastTimestamp;
  const cacheKey = currentUser ? `${currentUser.uid}_${currentUser.role}` : 'anon';
  const now = Date.now();

  if (isFirstPage) {
    const cached = memoryCache.get(cacheKey);
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      return [...cached.data];
    }
  }

  const isMock = isMockDevEnvironment() || import.meta.env.MODE === 'test';
  const results = isMock
    ? filterMockArchived(currentUser, limitCount, lastTimestamp)
    : await fetchFirestoreArchived(dbInstance ?? getFirebaseDb(), currentUser, limitCount, lastTimestamp);

  if (isFirstPage) {
    memoryCache.set(cacheKey, { data: results, fetchedAt: now });
  }

  return results;
}

/**
 * Reset in-memory cache for unit testing
 */
export function resetArchivedCacheForTesting(): void {
  memoryCache.clear();
}
