/**
 * Feature: Contracts Management & Dashboard
 * Contract Service — Firestore Realtime Queries & Data Operations
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  runTransaction,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, type FirebaseStorage } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import {
  getFirebaseDb,
  getFirebaseStorage,
  getFirebaseFunctions,
  getMetricGroup,
  isMockDevEnvironment,
  toValidDate,
  METRIC_GROUPS,
  type ContractDocument,
  type AuthUser,
  type ContractStatus,
  type AnnexFile,
  type UserRole,
} from '@/shared';
import type {
  CreateContractPayload,
  MetricCounts,
  ContractFilterState,
} from '../types';
import {
  generateAnnexId,
  formatAnnexLabel,
  buildAnnexStoragePath,
} from '../utils/annexHelpers';
import { cacheUploadedFile } from '@/shared';

/**
 * Format 4-digit period string: YYMM (e.g. '2609')
 */
export function formatContractPeriod(date: Date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yy}${mm}`;
}

/**
 * Format standardized contract ID: CTR-YYMM-XXXX
 */
export function formatContractId(period: string, seq: number): string {
  return `CTR-${period}-${String(seq).padStart(4, '0')}`;
}

let mockSequenceCounter = 5; // DEV_SAMPLE_CONTRACTS has 0001..0005
export function getNextMockSequence(): number {
  mockSequenceCounter += 1;
  return mockSequenceCounter;
}

export function resetMockSequenceForTesting(initialSeq = 5): void {
  mockSequenceCounter = initialSeq;
}

/**
 * Generate standardized contract ID: CTR-YYMM-XXXX
 */
export function generateContractId(period?: string, seq?: number): string {
  const p = period ?? formatContractPeriod();
  if (seq !== undefined) {
    return formatContractId(p, seq);
  }
  return formatContractId(p, getNextMockSequence());
}

/**
 * Calculate count totals for 4 metric dashboard groups
 */
export function calculateMetricCounts(contracts: readonly ContractDocument[]): MetricCounts {
  let draft = 0;
  let legal = 0;
  let head = 0;
  let approved = 0;

  for (const c of contracts) {
    if (c.isArchived || c.status === 'COMPLETED') continue;
    const group = getMetricGroup(c.status);
    if (group === 'draft') draft += 1;
    else if (group === 'legal') legal += 1;
    else if (group === 'head') head += 1;
    else if (group === 'approved') approved += 1;
  }

  return {
    all: draft + legal + head + approved,
    draft,
    legal,
    head,
    approved,
  };
}

/**
 * Filter contracts by active metric group, detailed status, and search keyword
 */
export function filterContracts(
  contracts: readonly ContractDocument[],
  filter: ContractFilterState
): readonly ContractDocument[] {
  const { activeGroup, statusFilter, searchKeyword } = filter;
  const kw = searchKeyword.trim().toLowerCase();

  return contracts.filter((c) => {
    if (c.isArchived || c.status === 'COMPLETED') {
      return false;
    }
    if (activeGroup !== 'ALL' && !METRIC_GROUPS[activeGroup].includes(c.status)) {
      return false;
    }
    if (statusFilter && statusFilter !== 'ALL' && c.status !== statusFilter) {
      return false;
    }
    if (!kw) return true;

    return (
      c.contractId.toLowerCase().includes(kw) ||
      c.title.toLowerCase().includes(kw) ||
      c.supplier.toLowerCase().includes(kw) ||
      c.createdBy.displayName.toLowerCase().includes(kw)
    );
  });
}

/**
 * Build initial document payload for a new DRAFT contract
 */
export function buildNewContractDoc(
  user: AuthUser,
  payload: CreateContractPayload,
  contractId: string
): ContractDocument {
  const now = new Date();
  const annexFiles: AnnexFile[] | undefined =
    payload.annexFiles && payload.annexFiles.length > 0
      ? payload.annexFiles.map((af, idx) => {
          const annexId = generateAnnexId(idx + 1);
          return {
            annexId,
            label: formatAnnexLabel(annexId, af.name.replace(/\.docx$/i, '')),
            originalFileName: af.name,
            storagePath: buildAnnexStoragePath(contractId, 1, annexId),
            sourceVersionNo: 1,
            order: idx + 1,
          };
        })
      : undefined;

  const viewerEmails: string[] | undefined =
    payload.viewerEmails && payload.viewerEmails.length > 0
      ? Array.from(
          new Set(
            payload.viewerEmails
              .map((e) => e.trim().toLowerCase())
              .filter((e) => Boolean(e && e.includes('@') && e !== user.email.toLowerCase()))
          )
        )
      : undefined;

  return {
    contractId,
    title: payload.title.trim(),
    supplier: payload.supplier.trim(),
    description: payload.description.trim(),
    status: 'DRAFT',
    currentVersion: 1,
    createdBy: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    },
    rejectCount: 0,
    isArchived: false,
    companyRole: payload.companyRole || 'BUYER',
    currentVersionFile: {
      versionNo: 1,
      originalFileName: payload.file ? `${contractId}_v1.docx` : '',
      storagePath: payload.file ? `contracts/${contractId}/versions/v1.docx` : '',
    },
    ...(annexFiles ? { annexFiles } : {}),
    ...(viewerEmails && viewerEmails.length > 0 ? { viewerEmails } : {}),
    createdAt: now,
    updatedAt: now,
  };
}

async function createContractMockDev(
  db: Firestore,
  user: AuthUser,
  payload: CreateContractPayload
): Promise<string> {
  const period = formatContractPeriod();
  const nextSeq = getNextMockSequence();
  const contractId = formatContractId(period, nextSeq);
  const docData = {
    ...buildNewContractDoc(user, payload, contractId),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = doc(db, 'contracts', contractId);
  let timerId: ReturnType<typeof setTimeout> | undefined;
  try {
    const writePromise = setDoc(docRef, docData);
    const timeoutPromise = new Promise<void>((resolve) => {
      timerId = setTimeout(resolve, 1500);
    });
    await Promise.race([writePromise, timeoutPromise]);
  } finally {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
  }
  return contractId;
}

async function createContractWithTransaction(
  db: Firestore,
  user: AuthUser,
  payload: CreateContractPayload
): Promise<string> {
  const period = formatContractPeriod();
  const counterRef = doc(db, 'counters', `contracts_${period}`);

  return runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let nextSeq = 1;
    if (counterSnap.exists()) {
      const data = counterSnap.data();
      nextSeq = (Number(data.lastSeq) || 0) + 1;
    }

    const contractId = formatContractId(period, nextSeq);
    const contractRef = doc(db, 'contracts', contractId);
    const docData = {
      ...buildNewContractDoc(user, payload, contractId),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    transaction.set(counterRef, {
      lastSeq: nextSeq,
      period,
      updatedAt: serverTimestamp(),
    });
    transaction.set(contractRef, docData);

    return contractId;
  });
}

async function uploadVersion1Docx(
  db: Firestore,
  storage: FirebaseStorage,
  contractId: string,
  user: AuthUser,
  file: File,
  annexFiles?: readonly File[],
  annexMeta?: readonly AnnexFile[]
): Promise<void> {
  const storagePath = `contracts/${contractId}/versions/v1.docx`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, {
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    customMetadata: {
      createdByUid: user.uid,
    },
  });

  // Pre-cache main contract file in RAM for instant 0ms preview
  await cacheUploadedFile(contractId, storagePath, file);

  // Upload annex files if any
  if (annexFiles && annexMeta && annexFiles.length > 0) {
    for (let i = 0; i < annexFiles.length; i++) {
      const af = annexFiles[i];
      const meta = annexMeta[i];
      if (af && meta) {
        const annexRef = ref(storage, meta.storagePath);
        await uploadBytes(annexRef, af, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          customMetadata: {
            createdByUid: user.uid,
          },
        });
        // Pre-cache annex file in RAM
        await cacheUploadedFile(contractId, meta.storagePath, af);
      }
    }
  }

  const versionDocRef = doc(db, 'contracts', contractId, 'versions', 'v1');
  await setDoc(versionDocRef, {
    versionId: 'v1',
    versionNo: 1,
    fileName: `${contractId}_v1.docx`,
    storagePath,
    action: 'INITIAL_UPLOAD',
    changeSummary: 'Khởi tạo hồ sơ hợp đồng phiên bản đầu tiên',
    ...(annexMeta && annexMeta.length > 0 ? { annexFiles: annexMeta } : {}),
    uploadedBy: {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
    },
    uploadedAt: serverTimestamp(),
  });
}

/**
 * Create a new contract record in Firestore
 */
export async function createContract(
  user: AuthUser,
  payload: CreateContractPayload,
  dbInstance?: Firestore,
  storageInstance?: FirebaseStorage
): Promise<string> {
  const db = dbInstance ?? getFirebaseDb();
  if (isMockDevEnvironment()) {
    return createContractMockDev(db, user, payload);
  }
  const contractId = await createContractWithTransaction(db, user, payload);

  if (payload.file) {
    try {
      const storage = storageInstance ?? getFirebaseStorage();
      const annexMeta =
        payload.annexFiles && payload.annexFiles.length > 0
          ? payload.annexFiles.map((af, idx) => {
              const annexId = generateAnnexId(idx + 1);
              return {
                annexId,
                label: formatAnnexLabel(annexId, af.name.replace(/\.docx$/i, '')),
                originalFileName: af.name,
                storagePath: buildAnnexStoragePath(contractId, 1, annexId),
                sourceVersionNo: 1,
                order: idx + 1,
              };
            })
          : undefined;

      await uploadVersion1Docx(
        db,
        storage,
        contractId,
        user,
        payload.file,
        payload.annexFiles,
        annexMeta
      );
    } catch (uploadErr) {
      console.warn('[createContract] File v1 upload failed:', uploadErr);
    }
  }

  return contractId;
}

function parseContractDoc(data: Record<string, unknown>): ContractDocument {
  return {
    contractId: String(data.contractId || ''),
    title: String(data.title || ''),
    supplier: String(data.supplier || ''),
    description: String(data.description || ''),
    status: (data.status as ContractStatus) || 'DRAFT',
    currentVersion: Number(data.currentVersion || 1),
    createdBy: (data.createdBy as ContractDocument['createdBy']) || {
      uid: '',
      email: '',
      displayName: '',
    },
    rejectCount: Number(data.rejectCount || 0),
    isArchived: Boolean(data.isArchived),
    companyRole: (data.companyRole as ContractDocument['companyRole']) || 'BUYER',
    currentVersionFile: (data.currentVersionFile as ContractDocument['currentVersionFile']) || {
      versionNo: 1,
      originalFileName: '',
      storagePath: '',
    },
    annexFiles: Array.isArray(data.annexFiles) ? (data.annexFiles as AnnexFile[]) : undefined,
    viewerEmails: Array.isArray(data.viewerEmails) ? (data.viewerEmails as string[]) : undefined,
    createdAt: (data.createdAt as ContractDocument['createdAt']) || new Date(),
    updatedAt: (data.updatedAt as ContractDocument['updatedAt']) || new Date(),
  };
}

/**
 * Subscribe to realtime contract updates via Firestore onSnapshot
 * For USER role: subscribes to both created contracts and shared viewer contracts
 */
export function subscribeContracts(
  user: AuthUser,
  onData: (contracts: ContractDocument[]) => void,
  onError?: (err: Error) => void,
  dbInstance?: Firestore
): Unsubscribe {
  const db = dbInstance ?? getFirebaseDb();
  const colRef = collection(db, 'contracts');

  if (user.role !== 'USER') {
    const q = query(colRef, where('isArchived', '==', false));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => parseContractDoc(d.data()));
        onData(items);
      },
      (err) => onError?.(err)
    );
  }

  // Realtime dual-stream for USER: owned + shared (as viewer)
  let ownedMap = new Map<string, ContractDocument>();
  let viewedMap = new Map<string, ContractDocument>();

  const emitMerged = () => {
    const combined = new Map<string, ContractDocument>([...ownedMap, ...viewedMap]);
    const items = Array.from(combined.values());
    items.sort((a, b) => {
      const timeB = toValidDate(b.updatedAt)?.getTime() ?? 0;
      const timeA = toValidDate(a.updatedAt)?.getTime() ?? 0;
      return timeB - timeA;
    });
    onData(items);
  };

  const qOwned = query(
    colRef,
    where('createdBy.uid', '==', user.uid),
    where('isArchived', '==', false)
  );
  const qViewed = query(
    colRef,
    where('viewerEmails', 'array-contains', user.email.toLowerCase()),
    where('isArchived', '==', false)
  );

  const unsubOwned = onSnapshot(
    qOwned,
    (snapshot) => {
      ownedMap = new Map(snapshot.docs.map((d) => [d.id, parseContractDoc(d.data())]));
      emitMerged();
    },
    (err) => onError?.(err)
  );

  const unsubViewed = onSnapshot(
    qViewed,
    (snapshot) => {
      viewedMap = new Map(snapshot.docs.map((d) => [d.id, parseContractDoc(d.data())]));
      emitMerged();
    },
    (err) => {
      console.warn('[subscribeContracts] viewer subscription warning:', err);
    }
  );

  return () => {
    unsubOwned();
    unsubViewed();
  };
}

/**
 * Sample contracts for local dev & testing
 */
export const DEV_SAMPLE_CONTRACTS: readonly ContractDocument[] = [
  {
    contractId: 'CTR-2609-0001',
    title: 'Hợp đồng mua bao bì màng nhôm vụ mùa 2026',
    supplier: 'Công ty Cổ phần Bao Bì Toàn Cầu',
    description: 'Cung cấp màng phức hợp nhôm đóng gói sản phẩm MacCoffee.',
    status: 'DRAFT',
    currentVersion: 1,
    createdBy: { uid: 'user_sales_01', email: 'user.sales@foodempire.vn', displayName: 'Nguyễn Văn Phụ Trách' },
    rejectCount: 0,
    isArchived: false,
    companyRole: 'BUYER',
    currentVersionFile: { versionNo: 1, originalFileName: 'BaoBi_v1.docx', storagePath: '' },
    createdAt: new Date('2026-09-25T08:00:00Z'),
    updatedAt: new Date('2026-09-25T09:30:00Z'),
  },
  {
    contractId: 'CTR-2609-0002',
    title: 'Hợp đồng cung cấp hạt cà phê Robusta Đắk Lắk',
    supplier: 'Hợp tác xã Cà Phê Cao Nguyên Xanh',
    description: 'Mua 50 tấn cà phê nhân xô Robusta loại 1.',
    status: 'PENDING_LEGAL',
    currentVersion: 1,
    createdBy: { uid: 'user_sales_01', email: 'user.sales@foodempire.vn', displayName: 'Nguyễn Văn Phụ Trách' },
    viewerEmails: ['user2@foodempire.vn'],
    rejectCount: 0,
    isArchived: false,
    companyRole: 'BUYER',
    currentVersionFile: { versionNo: 1, originalFileName: 'Coffee_v1.docx', storagePath: '' },
    createdAt: new Date('2026-09-26T10:00:00Z'),
    updatedAt: new Date('2026-09-26T10:30:00Z'),
  },
  {
    contractId: 'CTR-2609-0003',
    title: 'Hợp đồng thuê kho bãi lạnh Bình Dương',
    supplier: 'Logistics Kho Vận Á Châu',
    description: 'Thuê 2000m2 diện tích kho trữ nguyên phụ liệu thời hạn 2 năm.',
    status: 'PENDING_HOL',
    currentVersion: 2,
    createdBy: { uid: 'user_sales_02', email: 'user2@foodempire.vn', displayName: 'Phạm Thị Mua Hàng' },
    rejectCount: 1,
    isArchived: false,
    companyRole: 'BUYER',
    currentVersionFile: { versionNo: 2, originalFileName: 'KhoBai_v2.docx', storagePath: '' },
    createdAt: new Date('2026-09-22T07:30:00Z'),
    updatedAt: new Date('2026-09-27T14:15:00Z'),
  },
  {
    contractId: 'CTR-2609-0004',
    title: 'Hợp đồng bảo trì hệ thống máy rang xay tự động',
    supplier: 'Tập đoàn Cơ Khí Buhler Thụy Sĩ',
    description: 'Bảo trì định kỳ máy rang xay công nghiệp dây chuyền số 3.',
    status: 'HOL_APPROVED',
    currentVersion: 1,
    createdBy: { uid: 'user_sales_01', email: 'user.sales@foodempire.vn', displayName: 'Nguyễn Văn Phụ Trách' },
    rejectCount: 0,
    isArchived: false,
    companyRole: 'BUYER',
    currentVersionFile: { versionNo: 1, originalFileName: 'BaoTri_v1.docx', storagePath: '' },
    createdAt: new Date('2026-09-20T08:00:00Z'),
    updatedAt: new Date('2026-09-28T16:00:00Z'),
  },
  {
    contractId: 'CTR-2609-0005',
    title: 'Hợp đồng dịch vụ vận tải đường bộ Bắc Nam',
    supplier: 'Công ty Cổ phần Vận Tải Con Thoi',
    description: 'Vận chuyển thành phẩm từ nhà máy Bình Dương ra tổng kho Hà Nội.',
    status: 'USER_REVISING',
    currentVersion: 2,
    createdBy: { uid: 'user_sales_01', email: 'user.sales@foodempire.vn', displayName: 'Nguyễn Văn Phụ Trách' },
    rejectCount: 1,
    isArchived: false,
    companyRole: 'BUYER',
    currentVersionFile: { versionNo: 2, originalFileName: 'VanTai_v2.docx', storagePath: '' },
    createdAt: new Date('2026-09-24T09:00:00Z'),
    updatedAt: new Date('2026-09-29T11:00:00Z'),
  },
  {
    contractId: 'CTR-2609-0006',
    title: 'Hợp đồng bảo hiểm tài sản nhà xưởng 2026',
    supplier: 'Tổng Công ty Cổ phần Bảo hiểm Quân Đội MIC',
    description: 'Bảo hiểm cháy nổ và rủi ro tài sản nhà xưởng sản xuất MacCoffee Bình Dương.',
    status: 'COMPLETED',
    currentVersion: 1,
    createdBy: { uid: 'user_sales_01', email: 'user.sales@foodempire.vn', displayName: 'Nguyễn Văn Phụ Trách' },
    rejectCount: 0,
    isArchived: true,
    companyRole: 'BUYER',
    currentVersionFile: { versionNo: 1, originalFileName: 'BaoHiem_v1.docx', storagePath: '' },
    createdAt: new Date('2026-08-15T09:00:00Z'),
    updatedAt: new Date('2026-09-01T10:00:00Z'),
  },
  {
    contractId: 'CTR-2609-0007',
    title: 'Hợp đồng kiểm toán báo cáo tài chính niên độ 2025',
    supplier: 'Công ty TNHH PwC Việt Nam',
    description: 'Kiểm toán độc lập báo cáo tài chính năm tài chính 2025.',
    status: 'COMPLETED',
    currentVersion: 1,
    createdBy: { uid: 'user_sales_02', email: 'user2@foodempire.vn', displayName: 'Phạm Thị Mua Hàng' },
    rejectCount: 0,
    isArchived: true,
    companyRole: 'BUYER',
    currentVersionFile: { versionNo: 1, originalFileName: 'KiemToan_v1.docx', storagePath: '' },
    createdAt: new Date('2026-08-20T08:00:00Z'),
    updatedAt: new Date('2026-09-05T14:30:00Z'),
  },
];

const mockContractsStore: Map<string, ContractDocument> = new Map();

function initMockStore(): void {
  if (mockContractsStore.size === 0) {
    for (const c of DEV_SAMPLE_CONTRACTS) {
      mockContractsStore.set(c.contractId, { ...c });
    }
  }
}

export function getMockContract(contractId: string): ContractDocument | null {
  initMockStore();
  return mockContractsStore.get(contractId) || null;
}

export function getAllMockContracts(user?: AuthUser): readonly ContractDocument[] {
  initMockStore();
  const all = Array.from(mockContractsStore.values()).filter((c) => !c.isArchived);
  if (user && user.role === 'USER') {
    const userEmail = (user.email || '').toLowerCase();
    const userFiltered = all.filter(
      (c) =>
        c.createdBy.uid === user.uid ||
        c.createdBy.email.toLowerCase() === userEmail ||
        (c.viewerEmails && c.viewerEmails.map((e) => e.toLowerCase()).includes(userEmail))
    );
    return userFiltered.length > 0 ? userFiltered : all;
  }
  return all;
}

export function updateMockContractStatus(contractId: string, newStatus: ContractStatus): void {
  initMockStore();
  const current = mockContractsStore.get(contractId);
  if (current) {
    mockContractsStore.set(contractId, {
      ...current,
      status: newStatus,
      isArchived: newStatus === 'COMPLETED' ? true : current.isArchived,
      updatedAt: new Date(),
    });
  }
}

export function updateMockContractViewers(contractId: string, viewerEmails: readonly string[]): void {
  initMockStore();
  const current = mockContractsStore.get(contractId);
  if (current) {
    mockContractsStore.set(contractId, {
      ...current,
      viewerEmails: [...viewerEmails],
      updatedAt: new Date(),
    });
  }
}

export interface ActiveUserOption {
  readonly uid: string;
  readonly email: string;
  readonly displayName: string;
  readonly department?: string;
  readonly role: UserRole;
}

export const DEV_SAMPLE_USERS: readonly ActiveUserOption[] = [
  { uid: 'user_sales_01', email: 'user.sales@foodempire.vn', displayName: 'Nguyễn Văn Phụ Trách', department: 'Sales', role: 'USER' },
  { uid: 'user_sales_02', email: 'user2@foodempire.vn', displayName: 'Phạm Thị Mua Hàng', department: 'Mua hàng', role: 'USER' },
  { uid: 'manager_sales_01', email: 'manager.sales@foodempire.vn', displayName: 'Trần Quản Lý (Sales Head)', department: 'Sales', role: 'USER' },
  { uid: 'legal_specialist_01', email: 'legal@foodempire.vn', displayName: 'Lê Chuyên Viên (Legal)', department: 'Pháp chế', role: 'LEGAL' },
  { uid: 'head_of_legal_01', email: 'head.legal@foodempire.vn', displayName: 'Võ Trưởng Ban (Head of Legal)', department: 'Pháp chế', role: 'HOL' },
];

/**
 * Fetch list of active users from /users collection for Viewers autocomplete/selector
 */
export async function fetchActiveUsers(dbInstance?: Firestore): Promise<ActiveUserOption[]> {
  if (isMockDevEnvironment()) {
    return [...DEV_SAMPLE_USERS];
  }
  try {
    const db = dbInstance ?? getFirebaseDb();
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('isActive', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) {
      return [...DEV_SAMPLE_USERS];
    }
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: String(data.uid || d.id),
        email: String(data.email || ''),
        displayName: String(data.displayName || data.email || ''),
        department: data.department ? String(data.department) : undefined,
        role: (data.role as UserRole) || 'USER',
      };
    });
  } catch (err) {
    console.warn('[fetchActiveUsers] Error fetching users from Firestore, using fallback:', err);
    return [...DEV_SAMPLE_USERS];
  }
}

/**
 * Update viewers list for a contract document
 */
export async function updateContractViewers(
  contractId: string,
  viewerEmails: readonly string[],
  dbInstance?: Firestore
): Promise<void> {
  const cleanEmails = Array.from(
    new Set(
      viewerEmails
        .map((e) => e.trim().toLowerCase())
        .filter((e) => Boolean(e && e.includes('@')))
    )
  );

  if (isMockDevEnvironment()) {
    updateMockContractViewers(contractId, cleanEmails);
    return;
  }

  const db = dbInstance ?? getFirebaseDb();
  const contractRef = doc(db, 'contracts', contractId);
  await updateDoc(contractRef, {
    viewerEmails: cleanEmails,
    updatedAt: serverTimestamp(),
  });
}

export function updateMockContractVersion(
  contractId: string,
  nextVersionNo: number,
  mainFileName: string,
  annexFiles: readonly AnnexFile[]
): void {
  initMockStore();
  const current = mockContractsStore.get(contractId);
  if (current) {
    mockContractsStore.set(contractId, {
      ...current,
      currentVersion: nextVersionNo,
      currentVersionFile: {
        versionNo: nextVersionNo,
        originalFileName: mainFileName,
        storagePath: `contracts/${contractId}/versions/v${nextVersionNo}.docx`,
      },
      annexFiles: [...annexFiles],
      updatedAt: new Date(),
    });
  }
}

export function resetMockContractsStoreForTesting(): void {
  mockContractsStore.clear();
}

export function deleteMockContract(contractId: string): boolean {
  initMockStore();
  return mockContractsStore.delete(contractId);
}

export async function deleteContractDoc(
  contractId: string
): Promise<{ success: boolean; contractId: string }> {
  if (isMockDevEnvironment()) {
    deleteMockContract(contractId);
    return { success: true, contractId };
  }

  const fns = getFirebaseFunctions();
  const callable = httpsCallable<{ contractId: string }, { success: boolean; contractId: string }>(
    fns,
    'deleteContract'
  );
  const result = await callable({ contractId });
  return result.data;
}

