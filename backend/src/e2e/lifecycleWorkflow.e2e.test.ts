/**
 * Contract Review System v2.0
 * E2E Integration Test: Complete Contract Lifecycle Workflow
 *
 * Simulates and verifies the full 9-state lifecycle across all 3 roles:
 * USER (Creator) -> LEGAL (Reviewer) -> HOL (Head of Legal Approver)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { executeContractTransition } from '../modules/contracts/contractTransitionService.js';
import type { ContractDocument, ActivityDocument, NotificationItem } from '../types/index.js';
import type { TransitionUserContext } from '../modules/contracts/statusStateMachine.js';

describe('E2E Lifecycle: USER -> LEGAL -> HOL Complete Workflow', () => {
  // 3 Whitelist Actors
  const userActor: TransitionUserContext = {
    uid: 'user_sales_01',
    role: 'USER',
    displayName: 'Nguyễn Văn Phụ Trách',
    email: 'user.sales@foodempire.vn',
  };

  const legalActor: TransitionUserContext = {
    uid: 'legal_specialist_01',
    role: 'LEGAL',
    displayName: 'Trần Thị Pháp Chế',
    email: 'legal.specialist@foodempire.vn',
  };

  const holActor: TransitionUserContext = {
    uid: 'head_of_legal_01',
    role: 'HOL',
    displayName: 'Lê Văn Trưởng Phòng',
    email: 'head.legal@foodempire.vn',
  };

  // State store representing Firestore database
  let contractsStore: Map<string, ContractDocument>;
  let activitiesStore: ActivityDocument[];
  let notificationsStore: Map<string, NotificationItem[]>; // uid -> notifications
  let tasksStore: Map<string, { taskId: string; title: string; status: string }>;
  let mockDb: any;

  beforeEach(() => {
    contractsStore = new Map();
    activitiesStore = [];
    notificationsStore = new Map();
    tasksStore = new Map();

    notificationsStore.set(userActor.uid, []);
    notificationsStore.set(legalActor.uid, []);
    notificationsStore.set(holActor.uid, []);

    // Initial contract created by USER
    const initialContract: ContractDocument = {
      contractId: 'CTR-2609-0001',
      title: 'Hợp đồng Cung cấp Dịch vụ Logistics 2026',
      supplier: 'Công ty Cổ phần Vận tải Toàn Cầu',
      description: 'Dịch vụ vận chuyển hàng hóa xuất khẩu',
      status: 'DRAFT',
      currentVersion: 1,
      createdBy: {
        uid: userActor.uid,
        email: userActor.email,
        displayName: userActor.displayName,
      },
      rejectCount: 0,
      isArchived: false,
      companyRole: 'BUYER',
      currentVersionFile: {
        versionNo: 1,
        originalFileName: 'Hop_Dong_Logistics_v1.docx',
        storagePath: 'contracts/CTR-2609-0001/versions/v1.docx',
        previewPdfPath: 'contracts/CTR-2609-0001/previews/v1.pdf',
      },
      createdAt: { seconds: 1700000000, nanoseconds: 0 } as any,
      updatedAt: { seconds: 1700000000, nanoseconds: 0 } as any,
    };

    contractsStore.set('CTR-2609-0001', initialContract);

    // Mock Firestore DB with transaction support
    mockDb = {
      collection: (colName: string) => {
        if (colName === 'users') {
          return {
            where: (field: string, _op: string, val: any) => ({
              where: (_f2: string, _op2: string, _v2: any) => ({
                get: async () => {
                  if (field === 'role' && val === 'LEGAL') {
                    return { docs: [{ id: legalActor.uid }] };
                  }
                  if (field === 'role' && val === 'HOL') {
                    return { docs: [{ id: holActor.uid }] };
                  }
                  return { docs: [] };
                },
              }),
            }),
          };
        }

        if (colName === 'contracts') {
          return {
            doc: (docId: string) => ({
              id: docId,
              collection: (_subCol: string) => ({
                doc: (subId?: string) => ({
                  id: subId || `act-${activitiesStore.length + 1}`,
                }),
              }),
            }),
          };
        }

        if (colName === 'notifications') {
          return {
            doc: (_targetUid: string) => ({
              collection: (_sub: string) => ({
                doc: () => ({ id: `notif-${Date.now()}-${Math.random()}` }),
              }),
            }),
          };
        }

        return {};
      },

      runTransaction: async (updateFunction: (transaction: any) => Promise<any>) => {
        const transaction = {
          get: async (ref: any) => {
            const contract = contractsStore.get(ref.id);
            return {
              exists: !!contract,
              data: () => (contract ? { ...contract } : undefined),
            };
          },
          update: (ref: any, updates: Partial<ContractDocument>) => {
            const current = contractsStore.get(ref.id);
            if (current) {
              contractsStore.set(ref.id, { ...current, ...updates });
            }
          },
          set: (ref: any, data: any) => {
            if (ref.id?.startsWith('act-')) {
              activitiesStore.push(data);
            } else if (data.targetUid || data.notifId) {
              const uid = ref.path ? ref.path.split('/')[1] : null;
              if (uid && notificationsStore.has(uid)) {
                notificationsStore.get(uid)!.push(data);
              }
            }
          },
        };

        return updateFunction(transaction);
      },
    };
  });

  it('executes full 9-state lifecycle end-to-end successfully', async () => {
    // -------------------------------------------------------------
    // STEP 1: Initial state is DRAFT
    // -------------------------------------------------------------
    const contractV1 = contractsStore.get('CTR-2609-0001')!;
    expect(contractV1.status).toBe('DRAFT');
    expect(contractV1.currentVersion).toBe(1);
    expect(contractV1.rejectCount).toBe(0);
    expect(contractV1.isArchived).toBe(false);

    // -------------------------------------------------------------
    // STEP 2: USER submits contract: DRAFT -> PENDING_LEGAL
    // -------------------------------------------------------------
    const step2Result = await executeContractTransition(
      mockDb,
      {
        contractId: 'CTR-2609-0001',
        targetStatus: 'PENDING_LEGAL',
        payload: { changeSummary: 'Gửi hồ sơ hợp đồng mới lên Pháp chế' },
      },
      userActor
    );

    expect(step2Result.success).toBe(true);
    expect(step2Result.newStatus).toBe('PENDING_LEGAL');
    expect(contractsStore.get('CTR-2609-0001')!.status).toBe('PENDING_LEGAL');
    expect(activitiesStore).toHaveLength(1);
    expect(activitiesStore[0].details).toContain('DRAFT sang PENDING_LEGAL');

    // -------------------------------------------------------------
    // STEP 3: LEGAL adds tasks and returns with comments: PENDING_LEGAL -> LEGAL_COMMENTED
    // -------------------------------------------------------------
    tasksStore.set('task-1', {
      taskId: 'task-1',
      title: 'Bổ sung điều khoản phạt vi phạm hợp đồng tối đa 8%',
      status: 'OPEN',
    });
    tasksStore.set('task-2', {
      taskId: 'task-2',
      title: 'Làm rõ thời hạn thanh toán sau khi nghiệm thu từng đợt',
      status: 'OPEN',
    });

    const step3Result = await executeContractTransition(
      mockDb,
      {
        contractId: 'CTR-2609-0001',
        targetStatus: 'LEGAL_COMMENTED',
        payload: { changeSummary: 'Pháp chế đã rà soát và tạo 2 nhiệm vụ điều khoản' },
      },
      legalActor
    );

    expect(step3Result.success).toBe(true);
    expect(contractsStore.get('CTR-2609-0001')!.status).toBe('LEGAL_COMMENTED');

    // -------------------------------------------------------------
    // STEP 4: Contract moves to USER_REVISING (User starts revising)
    // -------------------------------------------------------------
    const step4Result = await executeContractTransition(
      mockDb,
      {
        contractId: 'CTR-2609-0001',
        targetStatus: 'USER_REVISING',
      },
      legalActor
    );

    expect(step4Result.success).toBe(true);
    const contractAfterReject = contractsStore.get('CTR-2609-0001')!;
    expect(contractAfterReject.status).toBe('USER_REVISING');
    expect(contractAfterReject.rejectCount).toBe(0);

    // -------------------------------------------------------------
    // STEP 5: USER resolves tasks, updates to v2 and resubmits: USER_REVISING -> PENDING_LEGAL (rejectCount becomes 1)
    // -------------------------------------------------------------
    tasksStore.get('task-1')!.status = 'RESOLVED';
    tasksStore.get('task-2')!.status = 'RESOLVED';

    // Simulate version v2 upload
    const currentContract = contractsStore.get('CTR-2609-0001')!;
    contractsStore.set('CTR-2609-0001', {
      ...currentContract,
      currentVersion: 2,
      currentVersionFile: {
        versionNo: 2,
        originalFileName: 'Hop_Dong_Logistics_v2_revised.docx',
        storagePath: 'contracts/CTR-2609-0001/versions/v2.docx',
        previewPdfPath: 'contracts/CTR-2609-0001/previews/v2.pdf',
      },
    });

    const step5Result = await executeContractTransition(
      mockDb,
      {
        contractId: 'CTR-2609-0001',
        targetStatus: 'PENDING_LEGAL',
        payload: { changeSummary: 'Đã bổ sung điều khoản phạt 8% và chỉnh thời hạn thanh toán 15 ngày' },
      },
      userActor
    );

    expect(step5Result.success).toBe(true);
    expect(contractsStore.get('CTR-2609-0001')!.status).toBe('PENDING_LEGAL');
    expect(contractsStore.get('CTR-2609-0001')!.currentVersion).toBe(2);
    expect(contractsStore.get('CTR-2609-0001')!.rejectCount).toBe(1);

    // -------------------------------------------------------------
    // STEP 6: LEGAL verifies and approves: PENDING_LEGAL -> LEGAL_APPROVED
    // -------------------------------------------------------------
    const step6Result = await executeContractTransition(
      mockDb,
      {
        contractId: 'CTR-2609-0001',
        targetStatus: 'LEGAL_APPROVED',
        payload: { changeSummary: 'Các điều khoản đã sửa đạt tiêu chuẩn pháp lý' },
      },
      legalActor
    );

    expect(step6Result.success).toBe(true);
    expect(contractsStore.get('CTR-2609-0001')!.status).toBe('LEGAL_APPROVED');

    // -------------------------------------------------------------
    // STEP 7: System/Legal submits to Head of Legal: LEGAL_APPROVED -> PENDING_HOL
    // -------------------------------------------------------------
    const step7Result = await executeContractTransition(
      mockDb,
      {
        contractId: 'CTR-2609-0001',
        targetStatus: 'PENDING_HOL',
        payload: { changeSummary: 'Trình Trưởng phòng Pháp chế xem xét Decision Brief' },
      },
      legalActor
    );

    expect(step7Result.success).toBe(true);
    expect(contractsStore.get('CTR-2609-0001')!.status).toBe('PENDING_HOL');

    // -------------------------------------------------------------
    // STEP 8: HOL reviews and approves: PENDING_HOL -> HOL_APPROVED
    // -------------------------------------------------------------
    const step8Result = await executeContractTransition(
      mockDb,
      {
        contractId: 'CTR-2609-0001',
        targetStatus: 'HOL_APPROVED',
        payload: { changeSummary: 'Đồng ý phê duyệt, cho phép ký kết hợp đồng' },
      },
      holActor
    );

    expect(step8Result.success).toBe(true);
    expect(contractsStore.get('CTR-2609-0001')!.status).toBe('HOL_APPROVED');

    // -------------------------------------------------------------
    // STEP 9: Finalizing contract: HOL_APPROVED -> COMPLETED (by USER owner)
    // -------------------------------------------------------------
    const step9Result = await executeContractTransition(
      mockDb,
      {
        contractId: 'CTR-2609-0001',
        targetStatus: 'COMPLETED',
      },
      userActor
    );

    expect(step9Result.success).toBe(true);

    // -------------------------------------------------------------
    // VERIFY FINAL STATE & AUDIT INTEGRITY
    // -------------------------------------------------------------
    const finalContract = contractsStore.get('CTR-2609-0001')!;
    expect(finalContract.status).toBe('COMPLETED');
    expect(finalContract.isArchived).toBe(true);
    expect(finalContract.currentVersion).toBe(2);
    expect(finalContract.rejectCount).toBe(1);

    // All 8 status transitions must be logged in activities audit trail
    expect(activitiesStore.length).toBe(8);
    expect(activitiesStore[activitiesStore.length - 1].details).toContain('HOL_APPROVED sang COMPLETED');

    // Verify all 3 actors participated and have logged activities
    const uniqueActors = new Set(activitiesStore.map((a) => a.performedBy.uid));
    expect(uniqueActors.has(userActor.uid)).toBe(true);
    expect(uniqueActors.has(legalActor.uid)).toBe(true);
    expect(uniqueActors.has(holActor.uid)).toBe(true);
  });

  it('rejects unauthorized actor from transitioning status (RBAC enforcement)', async () => {
    // USER cannot directly approve contract to LEGAL_APPROVED
    await expect(
      executeContractTransition(
        mockDb,
        {
          contractId: 'CTR-2609-0001',
          targetStatus: 'LEGAL_APPROVED',
        },
        userActor
      )
    ).rejects.toThrow();

    // LEGAL cannot directly execute HOL_APPROVED
    await expect(
      executeContractTransition(
        mockDb,
        {
          contractId: 'CTR-2609-0001',
          targetStatus: 'HOL_APPROVED',
        },
        legalActor
      )
    ).rejects.toThrow();
  });
});
