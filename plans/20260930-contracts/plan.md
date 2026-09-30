# Kế Hoạch Triển Khai: Bước 4.2 — Feature `contracts` (Dashboard, Bảng Hợp Đồng Realtime, 4 Thẻ Metrics & Click-to-Filter)

> **Mã công việc:** Giai đoạn 4 — Bước 4.2  
> **Feature Folder:** `frontend/src/features/contracts/`  
> **Tài liệu quy chuẩn:** [new_architecture.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/new_architecture.md), [AGENTS.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/AGENTS.md), [PROGRESS.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/PROGRESS.md)  
> **Ngày lập kế hoạch:** 2026-09-30  
> **Trạng thái:** Chờ phê duyệt (Pending Approval)

---

## 1. TỔNG QUAN VÀ MỤC TIÊU NGHIỆP VỤ

### 1.1. Mục tiêu
Xây dựng giao diện Bảng điều khiển trung tâm (**Contract Dashboard**) và Bảng danh sách hợp đồng thời gian thực (**Realtime Contract Table**), bao gồm:
1. **4 Thẻ Metrics thống kê trực quan** theo 4 nhóm giai đoạn hồ sơ kèm tính năng **Click-to-Filter** (lọc nhanh 0ms).
2. **Thanh tìm kiếm tức thì (Search Bar)** hỗ trợ tìm theo mã hợp đồng, tiêu đề, đối tác với thuật toán Debounce mượt mà.
3. **Bảng dữ liệu Clean Enterprise (`ContractTable`)** hiển thị mã hồ sơ, phiên bản, trạng thái badge, người tạo, ngày nộp, kèm hành động mở chi tiết hồ sơ.
4. **Hộp thoại tạo hợp đồng mới (`CreateContractModal`)** dành cho nhân viên (`USER`) để khởi tạo hồ sơ ở trạng thái `DRAFT`.
5. **Đồng bộ dữ liệu Realtime qua Firestore `onSnapshot`** tuân thủ nghiêm ngặt quy tắc Data Isolation (USER chỉ thấy hồ sơ của mình; Pháp chế/Trưởng phòng thấy toàn bộ).

---

## 2. THIẾT KẾ 4 THẺ METRICS & LOGIC PHÂN NHÓM (SECTION 6.3 NEW_ARCHITECTURE.MD)

| Thẻ Thống Kê | Icon | Màu Sắc | Các Trạng Thái Gom Nhóm | Ý Nghĩa Nghiệp Vụ |
| :--- | :---: | :---: | :--- | :--- |
| **1. Bản nháp & Chờ sửa** | 📝 | Xám / Vàng | `DRAFT`, `USER_REVISING` | Hồ sơ đang nằm ở phía User cần hoàn thiện hoặc sửa đổi |
| **2. Pháp chế thẩm định** | ⚖️ | Xanh dương | `PENDING_LEGAL`, `LEGAL_COMMENTED` | Hồ sơ đang thuộc quyền xử lý của Chuyên viên Pháp chế |
| **3. Trưởng ban xét duyệt** | 👔 | Cam / Tím | `PENDING_HOL`, `HOL_COMMENTED` | Hồ sơ đang trình Trưởng ban Pháp chế phê duyệt |
| **4. Hoàn tất / Đã duyệt** | ✅ | Xanh lá | `HOL_APPROVED`, `COMPLETED` | Hồ sơ đã đạt yêu cầu hoặc đã hoàn tất ký WeSign |

* **Cơ chế Click-to-Filter**:
  - Nhấp vào một thẻ bất kỳ $\rightarrow$ Bảng bên dưới lọc ngay danh sách theo nhóm trạng thái tương ứng.
  - Nhấp lại vào thẻ đang chọn $\rightarrow$ Hủy lọc, quay về trạng thái hiển thị "Tất cả hồ sơ".

---

## 3. PHÂN TẦNG KIẾN TRÚC MÔ-ĐUN (4-LAYER SEPARATION)

```
┌────────────────────────────────────────────────────────┐
│ 1. Presentation Layer (Giao diện)                      │
│    - MetricCards.tsx (4 Thẻ thống kê + Click-to-Filter)│
│    - ContractTable.tsx (Bảng danh sách hợp đồng + Sort)│
│    - ContractFilters.tsx (Thanh tìm kiếm Debounce)     │
│    - CreateContractModal.tsx (Dialog tạo hợp đồng DRAFT│
├────────────────────────────────────────────────────────┤
│ 2. Business Logic Layer (Hooks & State)                │
│    - useContracts.ts (Quản lý data realtime, filter)   │
│    - useCreateContract.ts (Xử lý validation & submit)  │
├────────────────────────────────────────────────────────┤
│ 3. Data / Service Layer                                │
│    - contractService.ts (Firestore onSnapshot, addDoc) │
├────────────────────────────────────────────────────────┤
│ 4. Shared / Core Layer                                 │
│    - types.ts (ContractDomainTypes, MetricCounts...)   │
│    - index.ts (Barrel export duy nhất của feature)     │
└────────────────────────────────────────────────────────┘
```

---

## 4. DANH SÁCH FILE SẼ TẠO & CẬP NHẬT

### 4.1. Tạo mới trong Feature [`frontend/src/features/contracts/`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/)
1. [`frontend/src/features/contracts/types.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/types.ts)
   - Định nghĩa `ContractFilterGroup = 'ALL' | 'DRAFT' | 'LEGAL_REVIEW' | 'HEAD_REVIEW' | 'APPROVED'`.
   - Định nghĩa `MetricCounts`, `ContractFilterState`, `CreateContractPayload`.
2. [`frontend/src/features/contracts/services/contractService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/services/contractService.ts)
   - Hàm `subscribeContracts(user, onData, onError)`: Lắng nghe realtime từ `/contracts` có phân quyền RBAC.
   - Hàm `createContract(user, payload)`: Tạo document hợp đồng mới (`DRAFT`, `currentVersion: 1`).
   - Hàm `calculateMetricCounts(contracts)`: Tính toán số lượng cho 4 nhóm metrics.
   - Hàm `filterContracts(contracts, filterState)`: Lọc theo từ khóa tìm kiếm và nhóm trạng thái.
   - Hỗ trợ dữ liệu mẫu khi chạy môi trường cục bộ (Dev Mock Data).
3. [`frontend/src/features/contracts/services/contractService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/services/contractService.test.ts)
   - Unit tests cho `contractService` (tính metrics, lọc từ khóa, tạo hợp đồng).
4. [`frontend/src/features/contracts/hooks/useContracts.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/hooks/useContracts.ts)
   - Custom hook quản lý danh sách hợp đồng, trạng thái loading, lỗi, từ khóa tìm kiếm, nhóm metric đang chọn.
5. [`frontend/src/features/contracts/hooks/useContracts.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/hooks/useContracts.test.tsx)
   - Unit tests cho hook `useContracts`.
6. [`frontend/src/features/contracts/components/MetricCards.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/MetricCards.tsx)
   - Hiển thị 4 thẻ thống kê trực quan với số lượng nhảy số realtime, trạng thái active badge, hover effect.
7. [`frontend/src/features/contracts/components/ContractFilters.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/ContractFilters.tsx)
   - Ô tìm kiếm từ khóa với Debounce 300ms, nút Clear text nhanh.
8. [`frontend/src/features/contracts/components/ContractTable.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/ContractTable.tsx)
   - Bảng hiển thị danh sách hồ sơ với các cột: Mã HĐ, Tiêu đề & Đối tác, Phiên bản, Người tạo, Ngày cập nhật, Trạng thái Badge, Nút mở chi tiết.
   - Xử lý Loading Skeleton và Empty State chuyên nghiệp.
9. [`frontend/src/features/contracts/components/CreateContractModal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/CreateContractModal.tsx)
   - Hộp thoại tạo mới hồ sơ hợp đồng (Tiêu đề, Đối tác, Mô tả, Phòng ban) với validate dữ liệu.
10. [`frontend/src/features/contracts/components/MetricCards.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/MetricCards.test.tsx) & [`ContractTable.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/ContractTable.test.tsx)
    - Unit tests cho các components giao diện.
11. [`frontend/src/features/contracts/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/index.ts)
    - Master Barrel export công khai duy nhất cho feature `contracts`.

### 4.2. Cập nhật Dashboard View trong App Shell
12. [`frontend/src/app/components/PlaceholderPages.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/PlaceholderPages.tsx)
    - Thay thế component `DashboardView` giả lập bằng trang Dashboard hoàn chỉnh tích hợp:
      - Header Bảng điều khiển + Nút "+ Tạo Hồ Sơ Mới" (chỉ hiển thị cho `USER`).
      - Component `<MetricCards />` tương tác.
      - Component `<ContractFilters />`.
      - Component `<ContractTable />`.
      - Component `<CreateContractModal />`.

---

## 5. KẾ HOẠCH THỰC HIỆN NGUYÊN TỬ (ATOMIC IMPLEMENTATION STEPS)

- **Bước 1 (Types & Core Services)**:
  - Tạo `types.ts` và `contractService.ts`.
  - Viết `contractService.test.ts` kiểm thử các thuật toán tính metric và bộ lọc.
  - Chạy `npm run test` pass 100%.

- **Bước 2 (Custom Hooks)**:
  - Tạo `useContracts.ts` kết nối service và state.
  - Viết `useContracts.test.tsx`.
  - Chạy `npm run test` pass 100%.

- **Bước 3 (UI Components)**:
  - Tạo `MetricCards.tsx`, `ContractFilters.tsx`, `ContractTable.tsx`, `CreateContractModal.tsx`.
  - Viết Unit Tests cho các components.
  - Tạo Barrel export `frontend/src/features/contracts/index.ts`.
  - Chạy `npm run test` pass 100%.

- **Bước 4 (Tích hợp Dashboard View & Build Verification)**:
  - Cập nhật `DashboardView` trong `PlaceholderPages.tsx`.
  - Chạy kiểm thử toàn bộ dự án (`npm run test` frontend + backend).
  - Chạy `npm run build` xác minh không có lỗi linter/typecheck.

- **Bước 5 (Cập nhật Tiến độ & Bàn giao)**:
  - Cập nhật mục 4.2 trong `PROGRESS.md`.
  - Báo cáo kết quả và mở đường link demo trên localhost:3000.

---

## 6. TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)
- [ ] Tuân thủ nghiêm ngặt 4-Layer Separation và Feature-Folder.
- [ ] Hàm $\le 25$ dòng logic; Component $\le 150-300$ dòng; TypeScript Strict 100% không dùng `any`.
- [ ] Bấm vào thẻ Metric nào thì bảng hợp đồng lọc đúng nhóm trạng thái đó tức thì; bấm lại thì bỏ lọc.
- [ ] Tìm kiếm từ khóa lọc đúng theo mã hợp đồng, tiêu đề, tên đối tác.
- [ ] Nút tạo hồ sơ chỉ hiển thị cho tài khoản vai trò `USER`.
- [ ] Toàn bộ Unit Tests bổ sung mới pass 100% (nâng tổng số test frontend lên $>135$ tests).
- [ ] `tsc -b && vite build` hoàn thành với **0 lỗi**.
