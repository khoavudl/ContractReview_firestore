/**
 * Feature: Contracts Management & Dashboard
 * Contract Service — Firestore Realtime Queries & Data Operations
 */

import {
  collection,
  doc,
  setDoc,
  runTransaction,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, type FirebaseStorage } from 'firebase/storage';
import {
  getFirebaseDb,
  getFirebaseStorage,
  getMetricGroup,
  isMockDevEnvironment,
  METRIC_GROUPS,
  type ContractDocument,
  type AuthUser,
  type ContractStatus,
} from '@/shared';
import type {
  CreateContractPayload,
  MetricCounts,
  ContractFilterState,
} from '../types';

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
    const group = getMetricGroup(c.status);
    if (group === 'draft') draft += 1;
    else if (group === 'legal') legal += 1;
    else if (group === 'head') head += 1;
    else if (group === 'approved') approved += 1;
  }

  return {
    all: contracts.length,
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
      originalFileName: payload.file ? payload.file.name : '',
      storagePath: payload.file ? `contracts/${contractId}/versions/v1.docx` : '',
      previewPdfPath: '',
    },
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
  file: File
): Promise<void> {
  const storagePath = `contracts/${contractId}/versions/v1.docx`;
  const storageRef = ref(storage, storagePath);
  const downloadToken = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `token_${Date.now()}`;
  await uploadBytes(storageRef, file, {
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    customMetadata: {
      firebaseStorageDownloadTokens: downloadToken,
    },
  });

  const versionDocRef = doc(db, 'contracts', contractId, 'versions', 'v1');
  await setDoc(versionDocRef, {
    versionId: 'v1',
    versionNo: 1,
    fileName: file.name,
    storagePath,
    previewPdfPath: '',
    action: 'INITIAL_UPLOAD',
    changeSummary: 'Khởi tạo hồ sơ hợp đồng phiên bản đầu tiên',
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
      await uploadVersion1Docx(db, storage, contractId, user, payload.file);
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
      previewPdfPath: '',
    },
    createdAt: (data.createdAt as ContractDocument['createdAt']) || new Date(),
    updatedAt: (data.updatedAt as ContractDocument['updatedAt']) || new Date(),
  };
}

/**
 * Subscribe to realtime contract updates via Firestore onSnapshot
 */
export function subscribeContracts(
  user: AuthUser,
  onData: (contracts: ContractDocument[]) => void,
  onError?: (err: Error) => void,
  dbInstance?: Firestore
): Unsubscribe {
  const db = dbInstance ?? getFirebaseDb();
  const colRef = collection(db, 'contracts');

  const q = user.role === 'USER'
    ? query(colRef, where('createdBy.uid', '==', user.uid), where('isArchived', '==', false))
    : query(colRef, where('isArchived', '==', false));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => parseContractDoc(d.data()));
      onData(items);
    },
    (err) => onError?.(err)
  );
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
    currentVersionFile: { versionNo: 1, originalFileName: 'BaoBi_v1.docx', storagePath: '', previewPdfPath: '' },
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
    rejectCount: 0,
    isArchived: false,
    companyRole: 'BUYER',
    currentVersionFile: { versionNo: 1, originalFileName: 'Coffee_v1.docx', storagePath: '', previewPdfPath: '' },
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
    currentVersionFile: { versionNo: 2, originalFileName: 'KhoBai_v2.docx', storagePath: '', previewPdfPath: '' },
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
    currentVersionFile: { versionNo: 1, originalFileName: 'BaoTri_v1.docx', storagePath: '', previewPdfPath: '' },
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
    currentVersionFile: { versionNo: 2, originalFileName: 'VanTai_v2.docx', storagePath: '', previewPdfPath: '' },
    createdAt: new Date('2026-09-24T09:00:00Z'),
    updatedAt: new Date('2026-09-29T11:00:00Z'),
  },
];
