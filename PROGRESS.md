# PROGRESS.md — Project Status & Handover Tracker

> **Dự án:** Contract Review System v2.0 (Firestore & Clean Modular Architecture)  
> **Source of Truth (Kiến trúc):** [new_architecture.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/new_architecture.md)  
> **Quy tắc phát triển:** [AGENTS.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/AGENTS.md), [GEMINI.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/GEMINI.md)  
> **Cập nhật lần cuối:** 2026-09-28 | **Trạng thái tổng thể:** Đã hoàn thành Giai đoạn 1 (Phase 1 Complete)

---

## 📌 HƯỚNG DẪN CHO AI AGENT KHI TIẾP QUẢN (HANDOVER PROTOCOL)

1. **BẮT BUỘC ĐỌC TRƯỚC TIÊN (MANDATORY READ FIRST)**:
   - Đọc kỹ file này (`PROGRESS.md`) để biết dự án đang ở giai đoạn nào, các module nào đã sẵn sàng, và task cụ thể tiếp theo là gì.
   - Đọc [`AGENTS.md`](file:///Users/tindn/Documents/Code/ContractReview_firestore/AGENTS.md) và [`GEMINI.md`](file:///Users/tindn/Documents/Code/ContractReview_firestore/GEMINI.md) để tuân thủ quy tắc làm việc (No unapproved code, Feature-Folder, Barrel export, Unit test Vitest 100%, SRP <= 25 dòng/function).
   - Tham chiếu [`new_architecture.md`](file:///Users/tindn/Documents/Code/ContractReview_firestore/new_architecture.md) làm tài liệu thiết kế chuẩn duy nhất.
2. **QUY TẮC CẬP NHẬT KHI KẾT THÚC (MANDATORY UPDATE AFTER)**:
   - Sau khi hoàn thành bất kỳ task hoặc phase nào, **BẮT BUỘC** cập nhật lại file này:
     - Tích chọn checkbox `[x]` các việc đã làm.
     - Cập nhật số lượng Unit Test và kết quả pass.
     - Xác định rõ nhiệm vụ bàn giao cho agent tiếp theo trong mục *Bước kế tiếp*.

---

## 📊 TIẾN ĐỘ TỔNG QUAN THEO 5 GIAI ĐOẠN

```mermaid
flowchart LR
    G1["✅ GĐ 1: Scaffolding & Firebase"] --> G2["⏳ GĐ 2: Backend Cloud Functions"]
    G2 --> G3["⬜ GĐ 3: Frontend Foundation"]
    G3 --> G4["⬜ GĐ 4: Feature-Folder Rollout"]
    G4 --> G5["⬜ GĐ 5: E2E & Go-Live"]

    classDef done fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#15803d;
    classDef current fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#b45309;
    classDef pending fill:#f1f5f9,stroke:#94a3b8,stroke-width:1px,color:#64748b;

    class G1 done;
    class G2 current;
    class G3,G4,G5 pending;
```

---

## ✅ GIAI ĐOẠN 1: KHỞI TẠO PROJECT & CẤU HÌNH FIREBASE (HOÀN THÀNH 100%)

### 1.1. Cấu hình Gốc Firebase & Quy tắc Bảo mật
- [x] Cập nhật [`.gitignore`](file:///Users/tindn/Documents/Code/ContractReview_firestore/.gitignore) chuẩn cho monorepo/multi-package Firebase.
- [x] Tạo [`firebase.json`](file:///Users/tindn/Documents/Code/ContractReview_firestore/firebase.json) liên kết Functions (`backend`), Hosting (`frontend/dist`), Firestore, Storage.
- [x] Tạo [`.firebaserc`](file:///Users/tindn/Documents/Code/ContractReview_firestore/.firebaserc) với default project `contractreview-v2`.
- [x] Tạo [`storage.rules`](file:///Users/tindn/Documents/Code/ContractReview_firestore/storage.rules) bảo vệ file docx (max 50MB), file tham chiếu (max 20MB), cấm sửa đè.
- [x] Tạo [`firestore.indexes.json`](file:///Users/tindn/Documents/Code/ContractReview_firestore/firestore.indexes.json) định nghĩa 3 composite indexes theo Mục 3.5.
- [x] Tạo [`firestore.rules`](file:///Users/tindn/Documents/Code/ContractReview_firestore/firestore.rules) thông qua specialist subagent `firestore-rules-author` (Custom Claims 0-read, Data Isolation, cấm client tự đổi status).

### 1.2. Khởi tạo Backend Cloud Functions v2 (`backend/`)
- [x] Khởi tạo [`backend/package.json`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/package.json) với `@google/genai`, `firebase-admin`, `firebase-functions v2`, `nodemailer`, `vitest`.
- [x] Cấu hình [`backend/tsconfig.json`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/tsconfig.json) ở Strict Mode (`noImplicitAny`, NodeNext, target ES2022).
- [x] Cấu hình [`backend/vitest.config.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/vitest.config.ts).
- [x] Dựng [`backend/src/config/firebaseAdmin.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/config/firebaseAdmin.ts) singleton.
- [x] Dựng [`backend/src/types/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/types/index.ts) định nghĩa toàn bộ schema Firestore backend.
- [x] Viết [`backend/src/modules/auth/whitelistValidator.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/auth/whitelistValidator.ts) và unit test [`whitelistValidator.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/auth/whitelistValidator.test.ts) (**6/6 tests PASS**).
- [x] Tạo [`backend/scripts/seedWhitelistUsers.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/scripts/seedWhitelistUsers.ts) dữ liệu mẫu cho `USER`, `LEGAL`, `HOL`.
- [x] Tạo [`backend/src/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/index.ts) với `healthCheck` endpoint.
- [x] Tạo [`backend/.env.example`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/.env.example).

### 1.3. Khởi tạo Frontend React + Vite + TypeScript (`frontend/`)
- [x] Khởi tạo [`frontend/package.json`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/package.json) với React 18, Vite, Lucide React, Tailwind CSS, Vitest.
- [x] Cấu hình [`frontend/tsconfig.json`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/tsconfig.json) với Strict Mode và alias `@/*` -> `src/*`.
- [x] Cấu hình [`frontend/vite.config.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/vite.config.ts) & [`vitest.config.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/vitest.config.ts) (`jsdom`).
- [x] Cấu hình [`frontend/tailwind.config.js`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/tailwind.config.js), [`src/styles/theme.css`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/styles/theme.css), [`src/styles/global.css`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/styles/global.css) theo Design Tokens Clean Enterprise (Dark/Light mode).
- [x] Tạo khung 8 Feature-Folders độc lập kèm barrel exports `index.ts`:
  - `features/auth`, `features/contracts`, `features/document-viewer`, `features/review-tasks`, `features/ai-assistant`, `features/comments`, `features/reference-files`, `features/notifications`.
- [x] Tạo [`frontend/src/main.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/main.tsx) & [`src/app/App.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/App.tsx).

### 1.4. Tầng Dùng Chung (Shared Layer) & Kiểm thử
- [x] Định nghĩa Domain Types tại [`src/shared/types/`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/types/): 9 trạng thái chuẩn (`statusEnums.ts`), `contract.ts`, `user.ts`.
- [x] Xây dựng [`src/shared/constants/statusConfig.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/constants/statusConfig.ts): Nhãn tiếng Việt, variant badge, 4 nhóm metric cards Dashboard.
- [x] Xây dựng [`src/shared/utils/dateUtils.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/utils/dateUtils.ts) & [`formatters.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/utils/formatters.ts).
- [x] Xây dựng UI Primitives [`src/shared/components/Badge.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/components/Badge.tsx) & [`Button.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/components/Button.tsx).
- [x] Tạo master barrel export [`src/shared/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/index.ts).
- [x] Viết Unit Tests đầy đủ: `dateUtils.test.ts`, `formatters.test.ts`, `statusConfig.test.ts`, `Badge.test.tsx`, `Button.test.tsx` (**28/28 tests PASS**).

### 1.5. Kết quả Kiểm thử & Build Verification
* **Backend Vitest**: 82 / 82 tests PASS (100%).
* **Backend Build**: `tsc` PASS (0 errors).
* **Frontend Vitest**: 28 / 28 tests PASS (100%).
* **Frontend Type-check**: `tsc --noEmit` PASS (0 errors).
* **Frontend Build**: `vite build` PASS (0 errors, 1.88s).
* **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

---

## ⏳ GIAI ĐOẠN 2: BACKEND CLOUD FUNCTIONS & SERVICES (ĐANG THỰC HIỆN)

### 2.1. Đồng bộ Custom Claims (`onUserDocWrite`)
- [x] **Bước 2.1**: Cloud Function `onUserDocWrite` — Tự động sync Custom Claims (`role`, `isActive`) khi admin ghi vào `/users/{uid}`.
  - Tạo module [`backend/src/modules/auth/claimsManager.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/auth/claimsManager.ts): Validate role (`USER`, `LEGAL`, `HOL`), quản lý claims, revoke claims khi xóa doc, xử lý lỗi Auth.
  - Viết unit tests [`backend/src/modules/auth/claimsManager.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/auth/claimsManager.test.ts) (**8/8 tests PASS**).
  - Tạo Firestore Trigger [`backend/src/functions/auth/onUserDocWrite.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/functions/auth/onUserDocWrite.ts) (`onDocumentWritten('users/{uid}')`).
  - Tách [`backend/src/functions/healthCheck.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/functions/healthCheck.ts) và export chuẩn tại [`backend/src/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/index.ts).
  - **Kết quả Backend**: 14/14 tests PASS, `tsc` build PASS (0 errors).

### 2.2. State Machine & Chuyển Trạng Thái (`transitionContractStatus`)
- [x] **Bước 2.2**: Cloud Function `transitionContractStatus` — Xử lý 9 trạng thái State Machine bằng Admin SDK transaction, kiểm tra ma trận phân quyền và trigger side effects (ghi activity log, gửi notification).
  - Tạo module [`backend/src/modules/contracts/statusStateMachine.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/statusStateMachine.ts): Kiểm tra ma trận chuyển trạng thái 9 bước, RBAC theo role, kiểm tra chính chủ owner, tự động tính `rejectCount` và `isArchived`.
  - Viết unit tests [`backend/src/modules/contracts/statusStateMachine.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/statusStateMachine.test.ts) (**15/15 tests PASS**).
  - Tạo service [`backend/src/modules/contracts/contractTransitionService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/contractTransitionService.ts): Thực thi trong Firestore atomic transaction (`runTransaction`), ghi audit log vào `activities` và gửi thông báo `notifications`.
  - Viết unit tests [`backend/src/modules/contracts/contractTransitionService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/contractTransitionService.test.ts) (**4/4 tests PASS**).
  - Tạo barrel export [`backend/src/modules/contracts/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/index.ts).
  - Tạo Callable Cloud Function [`backend/src/functions/contracts/transitionContractStatus.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/functions/contracts/transitionContractStatus.ts) và export tại [`backend/src/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/index.ts).
  - **Kết quả Backend**: 33/33 tests PASS, `tsc` build PASS (0 errors).

### 2.3. Sinh Signed URL Tệp Tin (`getSignedDocumentUrl`)
- [x] **Bước 2.3**: Cloud Function `getSignedDocumentUrl` — Sinh signed URL đọc file docx/pdf từ Storage (hết hạn sau 15 phút, check quyền).
  - Tạo module [`backend/src/modules/storage/storageAccessManager.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/storage/storageAccessManager.ts): Parse và validate path chống path traversal, kiểm tra ma trận phân quyền đọc tệp tin (Legal/HOL đọc tất cả, USER chỉ đọc hợp đồng do mình tạo).
  - Viết unit tests [`backend/src/modules/storage/storageAccessManager.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/storage/storageAccessManager.test.ts) (**12/12 tests PASS**).
  - Tạo service [`backend/src/modules/storage/documentUrlService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/storage/documentUrlService.ts): Kiểm tra khớp contractId, kiểm tra file tồn tại trong GCS bucket, sinh signed URL v4 với thời hạn 15 phút.
  - Viết unit tests [`backend/src/modules/storage/documentUrlService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/storage/documentUrlService.test.ts) (**7/7 tests PASS**).
  - Tạo barrel export [`backend/src/modules/storage/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/storage/index.ts).
  - Tạo Callable Cloud Function [`backend/src/functions/storage/getSignedDocumentUrl.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/functions/storage/getSignedDocumentUrl.ts) và export tại [`backend/src/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/index.ts).
  - **Kết quả Backend**: 52/52 tests PASS, `tsc` build PASS (0 errors).

### 2.4. Tự Động Sinh PDF Xem Trước (`onVersionUploaded`)
- [x] **Bước 2.4**: Module Docx-to-Pdf Converter Worker — Cloud Function `onVersionUploaded` convert file Word sang bản PDF xem trước.
  - Thiết kế Strategy Pattern (`DocxToPdfConverter`) cho phép chuyển đổi linh hoạt giữa headless LibreOffice, Cloud API và Mock Engine.
  - Tạo module [`backend/src/modules/converter/pathParser.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/converter/pathParser.ts): Nhận diện đúng file `.docx` trong `versions/`, lọc bỏ các file khác để chống Infinite Trigger Loop.
  - Viết unit tests [`backend/src/modules/converter/pathParser.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/converter/pathParser.test.ts) (**9/9 tests PASS**).
  - Tạo service [`backend/src/modules/converter/converterWorkerService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/converter/converterWorkerService.ts): Tải docx buffer, convert sang pdf, upload vào `previews/`, cập nhật `previewPdfPath` trên Firestore và ghi audit log `activities`. Bắt lỗi an toàn chống retry loop.
  - Viết unit tests [`backend/src/modules/converter/converterWorkerService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/converter/converterWorkerService.test.ts) (**3/3 tests PASS**).
  - Tạo [`backend/src/modules/converter/defaultConverter.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/converter/defaultConverter.ts) và barrel export [`backend/src/modules/converter/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/converter/index.ts).
  - Tạo Cloud Function v2 Storage Trigger [`backend/src/functions/converter/onVersionUploaded.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/functions/converter/onVersionUploaded.ts) (`onObjectFinalized`) và export tại [`backend/src/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/index.ts).
  - **Kết quả Backend**: 64/64 tests PASS, `tsc` build PASS (0 errors).

### 2.5. Tích Hợp Gemini AI Service (`analyzeContractAI`)
- [x] **Bước 2.5**: Module Gemini AI Service — Cloud Function `analyzeContractAI` (@google/genai) với Structured JSON Schema cho Summary, Risk Radar, Decision Brief.
  - Định nghĩa Type System ([`aiTypes.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/aiTypes.ts)) và JSON Schema chuẩn ([`aiSchemas.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/aiSchemas.ts)) cho 3 loại kết quả: `SummaryResult`, `RiskAssessmentResult`, `DecisionBriefResult`.
  - Tạo module [`promptBuilder.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/promptBuilder.ts) kèm unit tests ([`promptBuilder.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/promptBuilder.test.ts) — **4/4 tests PASS**).
  - Tạo module [`aiPermissionManager.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/aiPermissionManager.ts) quản lý phân quyền theo role (`USER`, `LEGAL`, `HOL`) và sinh cache key xác định (`buildAnalysisId`) kèm unit tests ([`aiPermissionManager.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/aiPermissionManager.test.ts) — **8/8 tests PASS**).
  - Tạo client [`geminiClient.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/geminiClient.ts) tích hợp `@google/genai` với Multimodal PDF.
  - Tạo core service [`aiService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/aiService.ts) xử lý Caching trên Firestore (5ms/0-cost), gọi AI, lưu subcollection `/contracts/{id}/ai_analyses/{analysisId}` và ghi audit log `activities` kèm unit tests ([`aiService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/aiService.test.ts) — **6/6 tests PASS**).
  - Tạo barrel export [`backend/src/modules/ai/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/index.ts).
  - Tạo Callable Cloud Function [`backend/src/functions/ai/analyzeContractAI.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/functions/ai/analyzeContractAI.ts) (`onCall`, timeout 120s, memory 1GiB) và export tại [`backend/src/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/index.ts).
  - **Kết quả Backend**: 82/82 tests PASS, `tsc` build PASS (0 errors).

### 2.6. Các Bước Tiếp Theo Trong Giai Đoạn 2
- [ ] **Bước 2.6**: Module Email Dispatcher — Gửi email qua Gmail SMTP (Nodemailer) với mẫu HTML Outlook-ready.
- [ ] **Bước 2.7**: Viết Unit Tests Vitest cho toàn bộ logic backend trên, đảm bảo PASS 100%.

---

## ⬜ GIAI ĐOẠN 3: FRONTEND FOUNDATION & SHARED LAYER (CHƯA BẮT ĐẦU)
- [ ] Dựng Firebase Client SDK wrapper (`src/shared/services/firebaseClient.ts`).
- [ ] Router & Navigation setup (`src/app/routes.tsx`).
- [ ] Theme Provider & Toast/Modal primitives.

---

## ⬜ GIAI ĐOẠN 4: TRIỂN KHAI TỪNG FEATURE-FOLDER (CHƯA BẮT ĐẦU)
- [ ] 4.1: Feature `auth` (Đăng nhập Microsoft/Google & Whitelist Check).
- [ ] 4.2: Feature `contracts` (Dashboard, Bảng hợp đồng Realtime, 4 Thẻ Metrics, Click-to-filter).
- [ ] 4.3: Feature `document-viewer` (In-App PDF Viewer với Signed URLs).
- [ ] 4.4: Feature `review-tasks` (Task List Matrix & Versioning Track Changes).
- [ ] 4.5: Feature `ai-assistant` (Gemini Summary, Risk Assessment, Decision Brief).
- [ ] 4.6: Feature `comments`, `reference-files`, `notifications` (Quả chuông thông báo).

---

## ⬜ GIAI ĐOẠN 5: TESTING END-TO-END & GO-LIVE (CHƯA BẮT ĐẦU)
- [ ] E2E Testing toàn bộ vòng đời hợp đồng (User -> Legal -> HOL).
- [ ] Deployment lên Firebase Hosting / App Engine.
