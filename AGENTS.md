# AGENTS.md — Development Rules & Guidelines for AI Agents

> **Dự án:** Contract Review System v2.0 (Firestore & Clean Modular Architecture)  
> **Áp dụng cho:** Tất cả các AI Coding Agents (Antigravity, Gemini, Claude, Cursor, v.v.) làm việc trên repository này.  
> **Ngày ban hành:** 2026-09-28 | **Trạng thái:** Bắt buộc tuân thủ 100% (Strict Compliance Required)

---

## 1. NGUYÊN TẮC CỐT LÕI (CORE PRINCIPLES)

### 1.1. Single Source of Truth
* 📄 [**`new_architecture.md`**](file:///Users/tindn/Documents/Code/ContractReview_firestore/new_architecture.md) là **tài liệu đặc tả kiến trúc chuẩn mực duy nhất** của toàn bộ dự án.
* Mọi quyết định kỹ thuật, schema cơ sở dữ liệu, phân quyền RBAC, state machine, và cấu trúc thư mục PHẢI tuân thủ tuyệt đối theo tài liệu này.
* Tuyệt đối không tự ý thay đổi kiến trúc hoặc áp dụng công nghệ khác ngoài phạm vi đã thống nhất trong `new_architecture.md`.

### 1.2. Quy tắc Thư mục Code Cũ (`OLD_Ver/`)
* Thư mục `OLD_Ver/` chứa toàn bộ mã nguồn cũ (Google Apps Script + Google Sheets + Vanilla JS monolithic).
* **CHỈ ĐƯỢC ĐỌC ĐỂ THAM CHIẾU (Read-Only Reference)**: Chỉ mở đọc khi cần hiểu sâu logic nghiệp vụ cũ, xem lại các prompt Gemini đã tinh chỉnh, hoặc mẫu email HTML Outlook.
* **TUYỆT ĐỐI KHÔNG COPY/PASTE TRỰC TIẾP**: Toàn bộ codebase mới sẽ được viết lại hoàn toàn từ đầu (Fresh Rewrite), đảm bảo sạch sẽ, chuẩn TypeScript và không vướng bất kỳ nợ kỹ thuật (technical debt) nào từ bản cũ.

---

## 2. QUY TRÌNH PHÁT TRIỂN & VIẾT CODE (DEVELOPMENT WORKFLOW)

### 2.1. Không Bao Giờ Code Khi Chưa Được Duyệt Kế Hoạch (No Unapproved Code)
* **NGHIÊM CẤM** tự ý viết code, tạo file tính năng mới hoặc chỉnh sửa cấu trúc khi chưa trình bày Kế hoạch triển khai (Plan) cho User và nhận được sự phê duyệt (Approval).
* Khi nhận một yêu cầu mới, Agent PHẢI:
  1. Phân tích yêu cầu và đối chiếu với `new_architecture.md`.
  2. Lập danh sách các bước thực hiện chi tiết kèm danh sách file sẽ tạo / sửa.
  3. Chờ User xác nhận *"Proceed"* hoặc phản hồi đồng ý mới được bắt tay vào code.

### 2.2. Luôn Chia Nhỏ Tác Vụ (Granular & Atomic Tasks)
* **KHÔNG BAO GIỜ** thay đổi hoặc tạo mới một lúc quá nhiều module/file gây conflict, khó review và không thể rollback.
* Mỗi bước thực hiện chỉ tập trung giải quyết **1 tác vụ đơn lẻ, khép kín**:
  * Ví dụ: Dựng xong Shared UI Primitives $\rightarrow$ Test xong $\rightarrow$ Mới sang Module Auth.
* Sau mỗi bước, kiểm tra chắc chắn không có lỗi build/lint trước khi tiếp tục.

### 2.3. Bắt Buộc Phải Có Unit Test (Mandatory Unit Testing)
* Mọi module, service, state machine transitions, custom hooks, và utility functions PHẢI có Unit Test đi kèm.
* Tất cả tests phải **PASS 100%** trước khi coi một tác vụ là hoàn thành.
* Sử dụng framework test hiện đại (Vitest cho Frontend & Backend).
* Tuyệt đối không bỏ qua lỗi test hoặc comment-out test để đối phó.

---

## 3. TIÊU CHUẨN CODE SẠCH & KIẾN TRÚC MÔ-ĐUN (CLEAN & MODULAR STANDARDS)

### 3.1. Phân Tầng Rõ Ràng (4-Layer Separation)
Codebase phải tuân thủ nghiêm ngặt mô hình 4 tầng theo chiều phụ thuộc từ trên xuống:
```
┌─────────────────────────────────┐
│ 1. Presentation Layer (Giao diện)│  ← React Components, Pages, UI Cards (KHÔNG chứa direct API/DB calls)
├─────────────────────────────────┤
│ 2. Business Logic Layer         │  ← Custom Hooks, State Stores, Workflow Transitions
├─────────────────────────────────┤
│ 3. Data / Service Layer         │  ← Firestore SDK queries, Storage, Cloud Functions API
├─────────────────────────────────┤
│ 4. Shared / Core Layer          │  ← TypeScript Types, Constants, Utilities, Formatters
└─────────────────────────────────┘
```
* **Quy tắc một chiều**: Tầng trên được import tầng dưới; tầng dưới KHÔNG BAO GIỜ import ngược lên tầng trên; tầng `Shared/Core` không import bất kỳ tầng nào khác.

### 3.2. Cấu Trúc Feature-Folder & Barrel Exports
* Mỗi tính năng lớn (`auth`, `contracts`, `document-viewer`, `review-tasks`, `ai-assistant`, `comments`, `notifications`) được tổ chức thành một **Feature-Folder** độc lập:
  ```text
  features/my-feature/
  ├── components/       # UI riêng của feature
  ├── hooks/            # Logic & State riêng
  ├── services/         # Tương tác dữ liệu riêng
  ├── types.ts          # Interfaces riêng
  └── index.ts          # ⭐ Barrel export duy nhất — Public API của feature
  ```
* **Quy tắc Barrel Export**: Các module khác muốn sử dụng thành phần của feature này CHỈ ĐƯỢC import thông qua file `index.ts`. Tuyệt đối không import sâu vào file nội bộ (ví dụ: `import { X } from '@/features/contracts/components/InternalWidget'` $\rightarrow$ **SAI**).

### 3.3. Giới Hạn Trách Nhiệm Đơn Lẻ (Single Responsibility - SRP)
* **Hàm / Method**: $\le$ 25 dòng logic. Nếu dài hơn, phải bóc tách thành các private helpers.
* **Component / File**: $\le$ 150 – 300 dòng. Tuyệt đối không lặp lại sai lầm tạo file monolithic 5,000 dòng như bản cũ.
* **Type-Safety**: 100% viết bằng **TypeScript** ở chế độ strict mode. Tuyệt đối cấm sử dụng kiểu `any` (nếu chưa rõ type thì dùng `unknown` kèm type narrowing hoặc Zod schema).

---

## 4. QUY TẮC BẢO MẬT & FIRESTORE STANDARDS

1. **Bảo vệ Dữ liệu Hợp đồng**:
   * Không bao giờ query Firestore mà không lọc theo `createdBy.uid` đối với vai trò `USER`.
   * Luôn kiểm tra quyền truy cập theo `firestore.rules`.
2. **Quản lý Tệp Tin Hợp đồng**:
   * Không lưu file trực tiếp ở chế độ public.
   * Tất cả thao tác đọc file văn bản hợp đồng từ Firebase Storage phải thông qua **Signed URL (hết hạn sau 15 phút)**.
3. **Quản trị API Keys & Secrets**:
   * Không bao giờ commit hardcode API Key, Gemini Key, hay Google Service Account JSON vào mã nguồn git.
   * Tất cả secrets phải cấu hình qua biến môi trường (`.env`, Firebase Secret Manager).

---

## 5. CHECKLIST TRƯỚC KHI BÀN GIAO MỖI BƯỚC

Trước khi báo cáo hoàn thành bất kỳ bước nào cho User, AI Agent phải tự rà soát:
- [ ] Code có đúng theo thiết kế trong `new_architecture.md` không?
- [ ] Có tự ý code tính năng nào chưa được approve trong plan không?
- [ ] Có đụng chạm hoặc làm biến đổi thư mục `OLD_Ver/` không? (Thư mục này là bất khả xâm phạm).
- [ ] Tất cả file mới có tuân thủ quy tắc Feature-Folder và Barrel Export không?
- [ ] Đã viết Unit Test chưa? Unit test có chạy pass 100% không?
- [ ] Lệnh build/lint có báo lỗi TypeScript nào không?
