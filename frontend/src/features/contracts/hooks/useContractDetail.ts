/**
 * Feature: Contracts Management
 * Hook: useContractDetail — Realtime contract detail & version history subscription
 */

import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  collection,
  onSnapshot,
  type Firestore,
} from 'firebase/firestore';
import {
  getFirebaseDb,
  isMockDevEnvironment,
  toValidDate,
  type AuthUser,
  type ContractDocument,
} from '@/shared';
import { DEV_SAMPLE_CONTRACTS, getMockContract } from '../services/contractService';
import type { ContractVersionItem } from '@/features/document-viewer/types';

export interface UseContractDetailReturn {
  readonly contract: ContractDocument | null;
  readonly versions: readonly ContractVersionItem[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refetchContract: () => void;
}

function buildMockVersions(contract: ContractDocument): readonly ContractVersionItem[] {
  const versions: ContractVersionItem[] = [];
  const maxVersion = Math.max(1, contract.currentVersion || 1);
  const baseTime = toValidDate(contract.createdAt)?.getTime() ?? Date.now();

  for (let v = 1; v <= maxVersion; v += 1) {
    const isCurrent = v === maxVersion;
    const fileName = isCurrent && contract.currentVersionFile?.originalFileName
      ? contract.currentVersionFile.originalFileName
      : `HopDong_${contract.contractId}_v${v}.docx`;

    versions.push({
      versionNo: v,
      versionId: `v${v}`,
      originalFileName: fileName,
      storagePath: `contracts/${contract.contractId}/versions/v${v}.docx`,
      previewPdfPath: `contracts/${contract.contractId}/previews/v${v}.pdf`,
      uploadedBy: contract.createdBy,
      changeSummary: v === 1 ? 'Khởi tạo hồ sơ ban đầu' : `Bản sửa đổi lần ${v - 1}`,
      uploadedAt: new Date(baseTime + (v - 1) * 3600 * 1000 * 24),
    });
  }

  return versions;
}

export function useContractDetail(
  contractId: string | undefined,
  user: AuthUser | null,
  dbInstance?: Firestore
): UseContractDetailReturn {
  const [contract, setContract] = useState<ContractDocument | null>(null);
  const [versions, setVersions] = useState<readonly ContractVersionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const refetchContract = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!contractId || !user) {
      setContract(null);
      setVersions([]);
      setIsLoading(false);
      return undefined;
    }

    const isMock = isMockDevEnvironment();
    const fallbackMockContract =
      (isMock ? getMockContract(contractId) : null) ??
      DEV_SAMPLE_CONTRACTS.find((c) => c.contractId === contractId) ??
      null;

    if (isMock && fallbackMockContract) {
      setContract(fallbackMockContract);
      setVersions(buildMockVersions(fallbackMockContract));
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const db = dbInstance ?? getFirebaseDb();
    const contractDocRef = doc(db, 'contracts', contractId);
    const versionsColRef = collection(db, 'contracts', contractId, 'versions');

    // Subscribe to contract document
    const unsubContract = onSnapshot(
      contractDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as ContractDocument;
          setContract(data);
          if (isMock) {
            setVersions(buildMockVersions(data));
          }
          setIsLoading(false);
        } else if (fallbackMockContract) {
          setContract(fallbackMockContract);
          setVersions(buildMockVersions(fallbackMockContract));
          setIsLoading(false);
        } else {
          setError(`Không tìm thấy hồ sơ hợp đồng ${contractId}.`);
          setIsLoading(false);
        }
      },
      (err) => {
        if (!isMock) {
          setError(err.message || 'Lỗi khi tải thông tin hợp đồng.');
        } else if (fallbackMockContract) {
          setContract(fallbackMockContract);
          setVersions(buildMockVersions(fallbackMockContract));
        }
        setIsLoading(false);
      }
    );

    // Subscribe to versions subcollection (if not pure mock)
    const unsubVersions = onSnapshot(
      versionsColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              versionNo: Number(data.versionNo) || 1,
              versionId: d.id,
              originalFileName: String(data.originalFileName || ''),
              storagePath: String(data.storagePath || ''),
              previewPdfPath: String(data.previewPdfPath || ''),
              uploadedBy: data.uploadedBy || { uid: '', email: '', displayName: '' },
              changeSummary: data.changeSummary ? String(data.changeSummary) : undefined,
              uploadedAt: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(),
            } as ContractVersionItem;
          });
          items.sort((a, b) => a.versionNo - b.versionNo);
          setVersions(items);
        }
      },
      () => {
        // Ignored in mock fallback
      }
    );

    return () => {
      unsubContract();
      unsubVersions();
    };
  }, [contractId, user, dbInstance, refreshTick]);

  return {
    contract,
    versions,
    isLoading,
    error,
    refetchContract,
  };
}
