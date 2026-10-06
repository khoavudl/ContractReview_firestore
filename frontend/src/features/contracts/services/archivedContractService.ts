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
  type CollectionReference,
  type Query,
  type QueryDocumentSnapshot,
  type DocumentData,
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

function buildArchivedQuery(
  contractsRef: CollectionReference<DocumentData>,
  currentUser: AuthUser | null,
  equalityFilter: QueryConstraint,
  limitCount: number,
  lastTimestamp?: Date | null
): Query<DocumentData> {
  const constraints: QueryConstraint[] = [
    equalityFilter,
    orderBy('updatedAt', 'desc'),
  ];
  if (currentUser && currentUser.role === 'USER') {
    constraints.unshift(where('createdBy.uid', '==', currentUser.uid));
  }
  if (lastTimestamp) {
    constraints.push(startAfter(lastTimestamp));
  }
  constraints.push(limit(limitCount));
  return query(contractsRef, ...constraints);
}

function mapDocsToContracts(docs: QueryDocumentSnapshot<DocumentData>[]): ContractDocument[] {
  return docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      contractId: d.id,
      createdAt: toValidDate(data.createdAt),
      updatedAt: toValidDate(data.updatedAt),
    } as ContractDocument;
  });
}

export function mergeAndDeduplicateArchived(
  listA: readonly ContractDocument[],
  listB: readonly ContractDocument[],
  limitCount: number
): ContractDocument[] {
  const map = new Map<string, ContractDocument>();
  for (const c of listA) map.set(c.contractId, c);
  for (const c of listB) map.set(c.contractId, c);

  const merged = Array.from(map.values());
  merged.sort((a, b) => {
    const timeB = toValidDate(b.updatedAt)?.getTime() ?? 0;
    const timeA = toValidDate(a.updatedAt)?.getTime() ?? 0;
    return timeB - timeA;
  });
  return merged.slice(0, limitCount);
}

async function fetchFirestoreArchived(
  db: Firestore,
  currentUser: AuthUser | null,
  limitCount: number,
  lastTimestamp?: Date | null
): Promise<ContractDocument[]> {
  const contractsRef = collection(db, 'contracts');

  const qArchived = buildArchivedQuery(
    contractsRef,
    currentUser,
    where('isArchived', '==', true),
    limitCount,
    lastTimestamp
  );
  const qCompleted = buildArchivedQuery(
    contractsRef,
    currentUser,
    where('status', '==', 'COMPLETED'),
    limitCount,
    lastTimestamp
  );

  const [snapArchived, snapCompleted] = await Promise.all([
    getDocs(qArchived).catch((err) => {
      console.warn('[fetchFirestoreArchived] isArchived query fallback:', err);
      return null;
    }),
    getDocs(qCompleted).catch((err) => {
      console.warn('[fetchFirestoreArchived] COMPLETED query fallback:', err);
      return null;
    }),
  ]);

  const docsArchived = snapArchived ? mapDocsToContracts(snapArchived.docs) : [];
  const docsCompleted = snapCompleted ? mapDocsToContracts(snapCompleted.docs) : [];

  return mergeAndDeduplicateArchived(docsArchived, docsCompleted, limitCount);
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
