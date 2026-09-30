/**
 * Feature: Reference Files & Attachments
 * Service: refFileService.ts — Storage Upload & Firestore Subcollection Management
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  deleteObject,
  type FirebaseStorage,
} from 'firebase/storage';
import {
  getFirebaseDb,
  getFirebaseStorage,
  isMockDevEnvironment,
  toValidDate,
} from '@/shared';
import type { ReferenceFileDocument } from '../types';

/** Dev sample initial reference files for offline testing */
export const DEV_SAMPLE_REF_FILES: Record<string, ReferenceFileDocument[]> = {
  'CTR-2609-0001': [
    {
      fileId: 'ref-001',
      fileName: 'Bao_gia_dich_vu_Cloud_Global_2026.pdf',
      storagePath: 'contracts/CTR-2609-0001/reference_files/ref-001_Bao_gia.pdf',
      fileSize: 1845000,
      mimeType: 'application/pdf',
      uploadedBy: {
        uid: 'user_01',
        displayName: 'Nguyễn Văn Phụ Trách',
      },
      uploadedAt: new Date('2026-09-28T08:45:00Z'),
    },
    {
      fileId: 'ref-002',
      fileName: 'Giay_phep_kinh_doanh_va_uy_quyen_Ben_B.pdf',
      storagePath: 'contracts/CTR-2609-0001/reference_files/ref-002_GPKD.pdf',
      fileSize: 3250000,
      mimeType: 'application/pdf',
      uploadedBy: {
        uid: 'user_01',
        displayName: 'Nguyễn Văn Phụ Trách',
      },
      uploadedAt: new Date('2026-09-28T08:50:00Z'),
    },
    {
      fileId: 'ref-003',
      fileName: 'Phu_luc_dac_ta_SLA_va_an_toan_thong_tin.docx',
      storagePath: 'contracts/CTR-2609-0001/reference_files/ref-003_PhuLuc.docx',
      fileSize: 450000,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedBy: {
        uid: 'legal_01',
        displayName: 'Luật sư Trần Văn Pháp',
      },
      uploadedAt: new Date('2026-09-29T11:00:00Z'),
    },
  ],
};

const mockInMemFiles: Record<string, ReferenceFileDocument[]> = { ...DEV_SAMPLE_REF_FILES };
const mockSubscribers: Record<string, Set<(files: ReferenceFileDocument[]) => void>> = {};

/**
 * Subscribes to realtime updates of contract reference files
 * Subcollection: /contracts/{contractId}/reference_files
 */
export function subscribeToReferenceFiles(
  contractId: string,
  onUpdate: (files: ReferenceFileDocument[]) => void,
  onError?: (err: Error) => void,
  dbInstance?: Firestore
): Unsubscribe {
  if (isMockDevEnvironment()) {
    if (!mockInMemFiles[contractId]) {
      mockInMemFiles[contractId] = DEV_SAMPLE_REF_FILES['CTR-2609-0001']
        ? [...DEV_SAMPLE_REF_FILES['CTR-2609-0001']]
        : [];
    }

    if (!mockSubscribers[contractId]) {
      mockSubscribers[contractId] = new Set();
    }
    mockSubscribers[contractId].add(onUpdate);

    // Initial emit
    onUpdate([...mockInMemFiles[contractId]]);

    return () => {
      mockSubscribers[contractId]?.delete(onUpdate);
    };
  }

  try {
    const db = dbInstance || getFirebaseDb();
    const filesRef = collection(db, 'contracts', contractId, 'reference_files');
    const q = query(filesRef, orderBy('uploadedAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            fileId: d.id,
            uploadedAt: toValidDate(data.uploadedAt),
          } as ReferenceFileDocument;
        });
        onUpdate(list);
      },
      (err) => {
        console.warn(`[refFileService] Firestore onSnapshot error for ${contractId}:`, err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn(`[refFileService] Failed to establish listener for ${contractId}:`, err);
    if (onError) onError(err as Error);
    return () => {};
  }
}

/**
 * Uploads reference file to Firebase Storage and records in Firestore subcollection
 */
export async function uploadReferenceFile(
  contractId: string,
  file: File,
  user: { uid: string; displayName: string },
  onProgress?: (pct: number) => void,
  storageInstance?: FirebaseStorage,
  dbInstance?: Firestore
): Promise<ReferenceFileDocument> {
  const fileId = `ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const storagePath = `contracts/${contractId}/reference_files/${fileId}_${file.name}`;

  const newDoc: ReferenceFileDocument = {
    fileId,
    fileName: file.name,
    storagePath,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
    uploadedBy: {
      uid: user.uid,
      displayName: user.displayName,
    },
    uploadedAt: new Date(),
  };

  if (isMockDevEnvironment()) {
    onProgress?.(30);
    await new Promise((r) => setTimeout(r, 100));
    onProgress?.(80);
    await new Promise((r) => setTimeout(r, 100));
    onProgress?.(100);

    if (!mockInMemFiles[contractId]) {
      mockInMemFiles[contractId] = [];
    }
    mockInMemFiles[contractId].unshift(newDoc);

    mockSubscribers[contractId]?.forEach((listener) => {
      listener([...mockInMemFiles[contractId]]);
    });

    return newDoc;
  }

  const storage = storageInstance || getFirebaseStorage();
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, file);
  onProgress?.(100);

  const db = dbInstance || getFirebaseDb();
  const docRef = doc(db, 'contracts', contractId, 'reference_files', fileId);
  await setDoc(docRef, {
    ...newDoc,
    uploadedAt: serverTimestamp(),
  });

  return newDoc;
}

/**
 * Deletes reference file from Firestore subcollection and Firebase Storage
 */
export async function deleteReferenceFile(
  contractId: string,
  fileId: string,
  storagePath: string,
  storageInstance?: FirebaseStorage,
  dbInstance?: Firestore
): Promise<void> {
  if (isMockDevEnvironment()) {
    if (mockInMemFiles[contractId]) {
      mockInMemFiles[contractId] = mockInMemFiles[contractId].filter((f) => f.fileId !== fileId);
      mockSubscribers[contractId]?.forEach((listener) => {
        listener([...mockInMemFiles[contractId]]);
      });
    }
    return;
  }

  const db = dbInstance || getFirebaseDb();
  const docRef = doc(db, 'contracts', contractId, 'reference_files', fileId);
  await deleteDoc(docRef);

  try {
    const storage = storageInstance || getFirebaseStorage();
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn(`[refFileService] Storage file delete failed for ${storagePath}:`, err);
  }
}

/** Internal test reset helper */
export function resetMockReferenceFilesForTesting(): void {
  for (const key of Object.keys(mockInMemFiles)) {
    delete mockInMemFiles[key];
  }
  Object.assign(mockInMemFiles, DEV_SAMPLE_REF_FILES);
  for (const key of Object.keys(mockSubscribers)) {
    delete mockSubscribers[key];
  }
}
