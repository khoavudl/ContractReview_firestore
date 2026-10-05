# PROGRESS.md — Project Status & Handover Tracker

> **Dự án:** Contract Review System v2.0 (Firestore & Clean Modular Architecture)  
> **Source of Truth (Kiến trúc):** [new_architecture.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/new_architecture.md)  
> **Quy tắc phát triển:** [AGENTS.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/AGENTS.md), [GEMINI.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/GEMINI.md)  
> **Cập nhật lần cuối:** 2026-10-05 | **Trạng thái tổng thể:** Giai đoạn 5 Hoàn Thành 100% (Tích Hợp Xác Thực Microsoft Entra ID; Tích Hợp Thông Báo Email Tự Động onContractStatusChanged; 385/385 Frontend Tests Pass; 128/128 Backend Tests Pass; 19/19 Rules Tests Pass; 532/532 Toàn Repo Pass)

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
    G1["✅ GĐ 1: Scaffolding & Firebase"] --> G2["✅ GĐ 2: Backend Cloud Functions"]
    G2 --> G3["✅ GĐ 3: Frontend Foundation"]
    G3 --> G4["✅ GĐ 4: Feature-Folder Rollout"]
    G4 --> G5["⏳ GĐ 5: E2E & Go-Live"]

    classDef done fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#15803d;
    classDef current fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#b45309;
    classDef pending fill:#f1f5f9,stroke:#94a3b8,stroke-width:1px,color:#64748b;

    class G1,G2,G3,G4 done;
    class G5 current;
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
* **Backend Vitest**: 95 / 95 tests PASS (100%).
* **Backend Build**: `tsc` PASS (0 errors).
* **Frontend Vitest**: 28 / 28 tests PASS (100%).
* **Frontend Type-check**: `tsc --noEmit` PASS (0 errors).
* **Frontend Build**: `vite build` PASS (0 errors, 1.88s).
* **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

---

## ✅ GIAI ĐOẠN 2: BACKEND CLOUD FUNCTIONS & SERVICES (HOÀN THÀNH 100%)

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

### 2.6. Module Email Dispatcher (`sendContractEmail`)
- [x] **Bước 2.6**: Module Email Dispatcher — Gửi email qua Gmail SMTP (Nodemailer) với mẫu HTML Outlook-ready.
  - Định nghĩa Type System ([`emailTypes.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/email/emailTypes.ts)) và Strategy Pattern `EmailDispatcher`.
  - Thiết kế 6 mẫu email chuẩn HTML Table tương thích 100% với Microsoft Outlook Desktop (Word rendering engine) & Office 365 ([`emailTemplates.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/email/emailTemplates.ts)) kèm unit tests ([`emailTemplates.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/email/emailTemplates.test.ts) — **7/7 tests PASS**).
  - Tạo `NodemailerDispatcher` và `ConsoleEmailDispatcher` (fallback local dev) ([`nodemailerDispatcher.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/email/nodemailerDispatcher.ts)).
  - Tạo core service [`emailDispatcherService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/email/emailDispatcherService.ts): Tự động phân phối người nhận từ `/users` (Legal team, HOL, User creator), gửi email và ghi audit log `activities` kèm unit tests ([`emailDispatcherService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/email/emailDispatcherService.test.ts) — **6/6 tests PASS**).
  - Tạo barrel export [`backend/src/modules/email/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/email/index.ts).
  - Tạo Callable Cloud Function [`backend/src/functions/email/sendContractEmail.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/functions/email/sendContractEmail.ts) và export tại [`backend/src/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/index.ts).

### 2.7. Kiểm Thử Unit Test Toàn Bộ Backend
- [x] **Bước 2.7**: Viết Unit Tests Vitest cho toàn bộ logic backend trên, đảm bảo PASS 100%.
  - **13 test suites**, **95/95 tests PASS (100%)**.
  - TypeScript `tsc` build: **0 errors**.

### 2.8. Hoàn Thiện Sau Báo Cáo Supervisor Review (Đạt 8.5/10)
- [x] **Bước 2.8**: Xử lý toàn bộ 6/6 điểm cải thiện từ Báo cáo Review Backend Phase 2:
  - **Issue 1 & 6 (Type Safety)**: Loại bỏ triệt để `<any>` tại [`aiService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/aiService.ts), khai báo `AnalysisResultContent` và gán kiểu chặt chẽ cho `AIAnalysisResponse.result`.
  - **Issue 2 (Barrel Export)**: Tạo mới [`backend/src/modules/auth/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/auth/index.ts) và cập nhật import tại [`onUserDocWrite.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/functions/auth/onUserDocWrite.ts) tuân thủ nghiêm ngặt mục 3.2 của `AGENTS.md`.
  - **Issue 3 (Type Guard)**: Viết type guard function `isFirebaseAuthError()` trong [`claimsManager.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/auth/claimsManager.ts) loại bỏ hoàn toàn type assertion `as`.
  - **Issue 4 (Email Deduplication)**: Chuẩn hóa bộ lọc `Cc` trong [`emailDispatcherService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/email/emailDispatcherService.ts) triệt tiêu hoàn toàn trường hợp nhân sự bị gửi trùng ở cả `To` và `Cc`.
  - **Issue 5 (In-App Notifications)**: Mở rộng [`contractTransitionService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/contractTransitionService.ts) tự động đẩy thông báo quả chuông cho:
    - Tất cả nhân sự `LEGAL` khi User nộp hồ sơ (`DRAFT` $\rightarrow$ `PENDING_LEGAL`) hoặc nộp lại (`USER_REVISING` $\rightarrow$ `PENDING_LEGAL`).
    - Nhân sự `HOL` khi Pháp chế duyệt hồ sơ (`LEGAL_APPROVED` $\rightarrow$ `PENDING_HOL`).
    - Người tạo (`USER`) khi hồ sơ bị trả về có lý do (`HOL_COMMENTED`).
  - **Kết quả Kiểm Thử Toàn Diện**:
    - **13 test suites**, **99/99 tests PASS (100%)**.
    - TypeScript `tsc` build: **0 errors** (Strict mode).

---

## ✅ GIAI ĐOẠN 3: FRONTEND FOUNDATION & SHARED LAYER (HOÀN THÀNH 100%)
- [x] **Bước 3.1**: Dựng Firebase Client SDK wrapper ([`src/shared/services/firebaseClient.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/services/firebaseClient.ts)).
  - Tạo [`frontend/.env.example`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/.env.example) & [`.env`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/.env) khai báo biến môi trường chuẩn Vite (`VITE_FIREBASE_*`, `VITE_USE_EMULATORS`).
  - Tạo [`frontend/src/vite-env.d.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/vite-env.d.ts) định nghĩa chặt chẽ type-safe cho `import.meta.env`.
  - Tạo module [`firebaseConfig.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/services/firebaseConfig.ts): Validate biến môi trường, trích xuất `FirebaseClientConfig` và cấu hình `EmulatorConfig` với fallback port an toàn.
  - Tạo module [`firebaseClient.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/services/firebaseClient.ts): Singleton an toàn chống re-init trên React/Vite, cung cấp getters (`getFirebaseApp`, `getFirebaseAuth`, `getFirebaseDb`, `getFirebaseStorage`, `getFirebaseFunctions`), hỗ trợ tự động kết nối Firebase Emulators khi chạy dev.
  - Tạo barrel export nội bộ [`src/shared/services/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/services/index.ts) và re-export tại master barrel export [`src/shared/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/index.ts).
  - Viết Unit Tests đầy đủ tại [`firebaseClient.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/services/firebaseClient.test.ts) (**10/10 tests PASS**).
  - **Kết quả Kiểm thử & Build Frontend**:
    - **6 test suites, 38/38 tests PASS (100%)**.
    - TypeScript `tsc -b && vite build` PASS (0 errors, 1.14s).
- [x] **Bước 3.2**: Router & Navigation setup ([`src/app/routes.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/routes.tsx) + Auth Guard & Role Guard).
  - Bổ sung `react-router-dom` vào `frontend/package.json`.
  - Tạo [`frontend/src/app/providers.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/providers.tsx) quản lý Auth state qua `AuthProvider` & `useAuthContext`.
  - Tạo Route Guards tại [`src/app/guards/`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/guards/): `AuthGuard.tsx` (bảo vệ đăng nhập & trạng thái active whitelist) và `RoleGuard.tsx` (kiểm tra RBAC theo `allowedRoles: UserRole[]`).
  - Tạo [`frontend/src/app/components/AppLayout.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/AppLayout.tsx) Shell layout với responsive header, brand logo, Dark/Light mode toggle, role badge (`USER`, `LEGAL`, `HOL`), user session info, và content `<Outlet />`.
  - Tạo [`frontend/src/app/components/PlaceholderPages.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/PlaceholderPages.tsx) (Login, Dashboard, ContractDetail, 403 Unauthorized, 404 NotFound).
  - Tạo [`frontend/src/app/routes.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/routes.tsx) định nghĩa cây Route chuẩn mực và component `AppRouter`.
  - Cập nhật [`Button.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/components/Button.tsx) hỗ trợ prop `fullWidth` chuẩn Tailwind.
  - Cập nhật [`frontend/src/app/App.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/App.tsx) kết nối `AuthProvider` và `AppRouter`.
  - Viết Unit Tests đầy đủ: `AuthGuard.test.tsx` (4 tests), `RoleGuard.test.tsx` (4 tests), `routes.test.tsx` (6 tests).
  - **Kết quả Kiểm thử & Build Frontend**:
    - **9 test suites, 52/52 tests PASS (100%)**.
    - TypeScript `tsc -b && vite build` PASS (0 errors, 1.76s).
- [x] **Bước 3.3**: Theme Provider & Toast/Modal primitives.
  - Tạo [`useTheme.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/hooks/useTheme.tsx): Quản lý Light/Dark/System theme, persist localStorage (`cr_theme_mode`), tự động cập nhật class `.dark` trên `html`.
  - Tạo [`useToast.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/hooks/useToast.tsx): Quản lý danh sách toast nổi với 4 biến thể (`success`, `error`, `warning`, `info`) và cơ chế auto-dismiss sau thời gian quy định.
  - Tạo [`useDebounce.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/hooks/useDebounce.ts): Hook trì hoãn giá trị tìm kiếm tức thì.
  - Tạo barrel export [`src/shared/hooks/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/hooks/index.ts).
  - Xây dựng các UI Primitives tại [`src/shared/components/`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/components/):
    - [`Input.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/components/Input.tsx): Ô nhập liệu doanh nghiệp hỗ trợ label, icons, helper text, error text, fullWidth.
    - [`Modal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/components/Modal.tsx): Hộp thoại Dialog chuẩn a11y với phím tắt `Escape`, backdrop mờ, và responsive sizes (`sm`, `md`, `lg`, `xl`).
    - [`Toast.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/components/Toast.tsx): Component Toast và `ToastContainer` hiển thị thông báo góc dưới màn hình.
  - Cập nhật master barrel export [`src/shared/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/index.ts) re-export đầy đủ hooks và components mới.
  - Tích hợp `AppProviders` (`ThemeProvider`, `ToastProvider`, `AuthProvider`) vào [`src/app/providers.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/providers.tsx) và [`src/app/App.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/App.tsx).
  - Cập nhật [`src/app/components/AppLayout.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/AppLayout.tsx) sử dụng `useTheme()` và gắn `<ToastContainer />`.
  - Cập nhật [`src/test/setup.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/test/setup.ts) bổ sung mock cho `window.matchMedia` và `window.localStorage`.
  - Viết Unit Tests đầy đủ: `useTheme.test.tsx` (4 tests), `useToast.test.tsx` (4 tests), `useDebounce.test.ts` (3 tests), `Input.test.tsx` (7 tests), `Modal.test.tsx` (6 tests), `Toast.test.tsx` (2 tests).
  - **Kết quả Kiểm thử & Build Frontend Giai đoạn 3**:
    - **15 test suites, 78/78 tests PASS (100%)**.
    - TypeScript `tsc -b && vite build` PASS (0 errors, 1.91s).
- [x] **Bước 3.4**: Hoàn thiện sau Báo cáo Review Frontend Phase 3 (Đạt 9.0/10):
  - **Issue 1 (Medium - `functionsHost` env var)**:
    - Bổ sung `readonly VITE_EMULATOR_FUNCTIONS_HOST?: string;` vào [`vite-env.d.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/vite-env.d.ts).
    - Cập nhật [`frontend/.env.example`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/.env.example) & [`frontend/.env`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/.env).
    - Sửa dòng `functionsHost` tại [`firebaseConfig.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/services/firebaseConfig.ts) sử dụng đúng `env.VITE_EMULATOR_FUNCTIONS_HOST || '127.0.0.1'`.
    - Cập nhật test case tại [`firebaseClient.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/services/firebaseClient.test.ts) (**10/10 tests PASS**).
  - **Issue 2 (Low - Modal Focus Trap WCAG 2.1 AA)**:
    - Bổ sung thuật toán `trapFocus` và phục hồi focus vào [`Modal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/components/Modal.tsx): Bắt sự kiện bàn phím `Tab` & `Shift+Tab` khóa focus trong hộp thoại dialog, tự động focus element đầu tiên khi mở và trả focus về element trước đó khi đóng modal.
    - Viết bổ sung 2 unit tests kiểm thử Focus Trap tại [`Modal.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/components/Modal.test.tsx) (**8/8 tests PASS**).
  - **Issue 3 (Low - AuthProvider placeholder)**:
    - Ghi nhận trạng thái placeholder cho Phase 3, sẵn sàng nâng cấp kết nối trực tiếp `onAuthStateChanged` với Firebase Auth SDK trong Bước 4.1.
  - **Kết quả Kiểm thử Toàn Diện Frontend Sau Fix**:
    - **15 test suites, 80/80 tests PASS (100%)**.
    - TypeScript `tsc -b && vite build` PASS (0 errors, 1.80s).
    - Toàn bộ repo (Backend + Frontend): **179/179 tests PASS (100%)**.

---

## ✅ GIAI ĐOẠN 4: TRIỂN KHAI TỪNG FEATURE-FOLDER (HOÀN THÀNH 100%)
- [x] **Bước 4.1**: Feature `auth` (Đăng nhập Microsoft/Google & Whitelist Check).
  - Tạo cấu trúc feature độc lập [`frontend/src/features/auth/`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/auth/):
    - [`types.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/auth/types.ts): Định nghĩa `SignInProvider`, `AuthErrorType`, `BlockedUserInfo`, `ClaimsCheckResult`.
    - [`services/authService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/auth/services/authService.ts): Tích hợp SSO `OAuthProvider('microsoft.com')` và `GoogleAuthProvider`, `fetchClaimsWithRetry` (3 lần polling backoff), `signOutUser`, `parseAuthError`.
    - [`services/authService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/auth/services/authService.test.ts): 14 unit tests kiểm thử claims parsing, retry và error handling (**14/14 PASS**).
    - [`hooks/useCurrentUser.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/auth/hooks/useCurrentUser.ts): Tiện ích RBAC flags (`isStaff`, `isLegal`, `isHOL`, `isUser`, `isActive`) kèm tests (**4/4 PASS**).
    - [`context/AuthContext.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/auth/context/AuthContext.tsx): Quản lý phiên làm việc, lắng nghe `onAuthStateChanged`, kiểm tra whitelist/inactive.
    - [`hooks/useAuth.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/auth/hooks/useAuth.ts): Primary hook cho components kèm tests (**6/6 PASS**).
    - [`components/WhitelistBlockModal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/auth/components/WhitelistBlockModal.tsx): Dialog cảnh báo tài khoản ngoài whitelist hoặc bị vô hiệu hóa kèm tests (**4/4 PASS**).
    - [`components/LoginCard.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/auth/components/LoginCard.tsx): Giao diện Clean Enterprise SSO Microsoft 365 & Google Workspace kèm tests (**4/4 PASS**).
    - [`index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/auth/index.ts): Master Barrel export công khai duy nhất cho feature `auth`.
  - Tích hợp vào App Shell:
    - Nâng cấp [`frontend/src/app/providers.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/providers.tsx) kết nối `AuthProvider` từ `@/features/auth`.
    - Cập nhật [`frontend/src/app/components/PlaceholderPages.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/PlaceholderPages.tsx) gắn `LoginCard` thực tế vào trang `/login`.
  - **Kết quả Kiểm thử & Build Giai đoạn 4.1**:
    - **Frontend Vitest**: 20 test suites, **112/112 tests PASS (100%)** (+32 unit tests mới).
    - **Backend Vitest**: 13 test suites, **99/99 tests PASS (100%)**.
    - **Toàn bộ Repo**: **211/211 tests PASS (100%)**.
    - **Build verification**: `tsc -b && vite build` PASS (0 errors, 1.93s).
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).
- [x] **Bước 4.2**: Feature `contracts` (Dashboard, Bảng hợp đồng Realtime, 4 Thẻ Metrics, Click-to-filter).
  - Tạo cấu trúc feature độc lập [`frontend/src/features/contracts/`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/):
    - [`types.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/types.ts): Định nghĩa `ContractFilterGroup`, `MetricCounts`, `ContractFilterState`, `CreateContractPayload`, `ContractListState`.
    - [`services/contractService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/services/contractService.ts): Firestore subscription `onSnapshot` phân quyền theo `role`, `calculateMetricCounts` (tổng hợp 4 nhóm), `filterContracts` (search keyword & active group), `createContract` (tạo `DRAFT` v1), `DEV_SAMPLE_CONTRACTS` (dữ liệu mẫu local dev).
    - [`services/contractService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/services/contractService.test.ts): 12 unit tests kiểm thử sinh mã `CTR-YYMM-XXXX`, phân nhóm metrics, filter từ khóa và Firestore queries (**12/12 PASS**).
    - [`hooks/useContracts.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/hooks/useContracts.ts): Hook quản lý realtime contracts, click-to-filter toggle state, search input.
    - [`hooks/useCreateContract.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/hooks/useCreateContract.ts): Hook xử lý validation (tiêu đề $\ge 5$ ký tự, đối tác) và tạo hợp đồng mới.
    - [`hooks/useContracts.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/hooks/useContracts.test.tsx): 7 unit tests kiểm thử toggling metrics, debounced search và creation validation (**7/7 PASS**).
    - [`components/MetricCards.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/MetricCards.tsx): 4 Thẻ Thống Kê tương tác (Bản nháp & Chờ sửa, Pháp chế thẩm định, Trưởng ban xét duyệt, Hoàn tất/Đã duyệt) kèm tests (**3/3 PASS**).
    - [`components/ContractFilters.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/ContractFilters.tsx): Search input kèm clear button và filter tag.
    - [`components/ContractTable.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/ContractTable.tsx): Bảng dữ liệu Clean Enterprise kèm TableSkeleton, EmptyState, Badge trạng thái, thông tin phiên bản vX và nút mở chi tiết kèm tests (**3/3 PASS**).
    - [`components/CreateContractModal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/CreateContractModal.tsx): Dialog tạo mới hồ sơ hợp đồng dành riêng cho vai trò `USER`.
    - **Hotfix UX Modal, Firestore write timeout & Instant Mock Load**:
      - Sửa lỗi Focus Stealing trong [`Modal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/components/Modal.tsx): Cô lập autofocus khỏi các re-render con khi gõ phím, bảo vệ trường đang có con trỏ (`document.activeElement`).
      - Xây dựng helper nhận diện môi trường [`isMockDevEnvironment()`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/services/firebaseConfig.ts): Tự động phát hiện khi nào đang dùng Dummy Key và chưa bật Emulator.
      - Nâng cấp [`contractService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/services/contractService.ts): Ở môi trường Production / Emulator, `createContract` chờ Server ACK thật 100% (bắt đúng lỗi phân quyền `permission-denied` nếu có); chỉ kích hoạt fallback 1500ms khi ở môi trường mock dev.
      - Tối ưu [`useContracts.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/hooks/useContracts.ts): Khắc phục hiện tượng load chậm 3-5 giây lần đầu mở Dashboard (do Firestore chờ Google từ chối fake key) bằng cách render dữ liệu mẫu tức thì (0ms) trong mock dev mode.
      - Thiết lập trường **"Mô tả tóm tắt nội dung *"** là bắt buộc (`required`): Bổ sung kiểm tra validation trong [`useCreateContract.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/hooks/useCreateContract.ts), hiển thị dấu sao bắt buộc trên [`CreateContractModal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/CreateContractModal.tsx) và bổ sung unit test kiểm thử.
      - **Nâng cấp mã hợp đồng tuần tự chuẩn doanh nghiệp (`CTR-YYMM-XXXX` dạng `0001, 0002...`)**:
        - Quy tắc bảo mật Firestore: Ủy thác cho subagent `firestore-rules-author` bổ sung collection `/counters/{counterId}` trong [`firestore.rules`](file:///Users/tindn/Documents/Code/ContractReview_firestore/firestore.rules). Enforce nghiêm ngặt `lastSeq == 1` khi khởi tạo và `lastSeq == resource.data.lastSeq + 1` khi cập nhật, chống hoàn toàn nguy cơ can thiệp counter trái phép.
        - Phân tán ACID Transaction: Trong [`contractService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/services/contractService.ts), sử dụng `runTransaction` để đọc counter `/counters/contracts_YYMM` và ghi hợp đồng `CTR-YYMM-XXXX` nguyên tử, cam kết không bao giờ trùng mã giữa các user.
        - Hỗ trợ Mock Dev: Tự động kế thừa chuỗi số mẫu (từ `CTR-2609-0006`, `CTR-2609-0007`...) đảm bảo tính tuần tự ngay cả khi test giao diện cục bộ.
        - Bổ sung unit tests kiểm thử bộ format kỳ YYMM, padding số 4 chữ số, và transaction (**16/16 tests PASS**).
      - Tối ưu callback re-render bằng `useCallback` trong [`CreateContractModal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/CreateContractModal.tsx).
    - [`index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/index.ts): Master Barrel export công khai duy nhất cho feature `contracts`.
  - Tích hợp vào App Shell:
    - Cập nhật [`DashboardView`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/PlaceholderPages.tsx): Gắn header điều hướng, nút `+ Tạo Hồ Sơ Mới` cho `USER`, 4 thẻ MetricCards, thanh ContractFilters, ContractTable và CreateContractModal.
  - **Kết quả Kiểm thử & Build Giai đoạn 4.2**:
    - **Frontend Vitest**: 24 test suites, **143/143 tests PASS (100%)** (+31 unit tests mới).
    - **Backend Vitest**: 13 test suites, **99/99 tests PASS (100%)**.
    - **Toàn bộ Repo**: **242/242 tests PASS (100%)**.
    - **Build verification**: `tsc -b && vite build` PASS (0 errors, 2.17s).
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).
- [x] **Bước 4.3**: Feature `document-viewer` (In-App PDF Viewer với Signed URLs 15 phút, multi-version switcher, download Word/PDF và bố cục 6:4 Enterprise Workspace).
  - Tạo cấu trúc feature độc lập [`frontend/src/features/document-viewer/`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/):
    - [`types.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/types.ts): Định nghĩa `ContractVersionItem`, `SignedUrlResult`, `SignedUrlCacheEntry`, `ViewerZoomLevel`, `ViewerErrorType`, `DocumentViewerState`.
    - [`services/storageService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/services/storageService.ts): Tích hợp Cloud Function `getSignedDocumentUrl`, cơ chế in-memory TTL cache 15 phút kèm tự động refresh trước 2 phút, fallback PDF Data URI cho local dev.
    - [`services/storageService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/services/storageService.test.ts): 8 unit tests kiểm thử bộ nhớ đệm URL, auto-refresh trước 2 phút và xử lý lỗi mạng (**8/8 PASS**).
    - [`hooks/useDocumentViewer.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/hooks/useDocumentViewer.ts): Custom hook điều khiển zoom (75%–200%), toàn màn hình (Fullscreen toggle), chuyển đổi phiên bản và kích hoạt download file gốc `.docx` / xem trước `.pdf`.
    - [`hooks/useDocumentViewer.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/hooks/useDocumentViewer.test.tsx): 5 unit tests kiểm thử zoom logic, tải URL và chuyển đổi phiên bản (**5/5 PASS**).
    - [`components/VersionDropdown.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/VersionDropdown.tsx): Dropdown điều hướng lịch sử phiên bản (`v1`, `v2`...) hiển thị người tạo, ngày nộp và badge phiên bản hiện tại.
    - [`components/DownloadButton.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/DownloadButton.tsx): Menu dropdown tải xuống file Word gốc (`.docx`) hoặc bản xem trước (`.pdf`).
    - [`components/PdfViewer.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/PdfViewer.tsx): Khung hiển thị PDF responsive tích hợp Toolbar chuyên dụng, Skeleton loading, chế độ toàn màn hình, và thông báo trạng thái khi file `.docx` đang trong quá trình chuyển đổi.
    - [`components/PdfViewer.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/PdfViewer.test.tsx): 3 unit tests kiểm thử render toolbar, loading skeleton và iframe preview (**3/3 PASS**).
    - [`index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/index.ts): Master Barrel export công khai duy nhất cho feature `document-viewer`.
  - Bổ sung hook chi tiết hồ sơ trong feature `contracts`:
    - [`frontend/src/features/contracts/hooks/useContractDetail.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/hooks/useContractDetail.ts): Lắng nghe realtime document `/contracts/{contractId}` và subcollection `/versions`, tự động fallback sang `DEV_SAMPLE_CONTRACTS` trong môi trường local dev. Re-export tại [`frontend/src/features/contracts/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/index.ts).
  - Tích hợp không gian làm việc chia đôi 6:4 chuẩn Enterprise:
    - Nâng cấp [`ContractDetailView`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/PlaceholderPages.tsx): Thay thế placeholder cũ bằng bố cục 6:4 (Mục 10.2 `new_architecture.md`) gồm:
      - Cột trái (60%): Bộ đọc tài liệu `<PdfViewer />` tương tác cao.
      - Cột phải (40%): Panel Tab điều hướng gồm 4 tab ("Nhiệm vụ rà soát", "Trợ lý AI", "Trao đổi", "Đính kèm"), sẵn sàng kết nối các feature tiếp theo ở Bước 4.4 - 4.6.
  - **Kết quả Kiểm thử & Build Giai đoạn 4.3**:
    - **Frontend Vitest**: 27 test suites, **159/159 tests PASS (100%)** (+16 unit tests mới).
    - **Backend Vitest**: 13 test suites, **99/99 tests PASS (100%)**.
    - **Toàn bộ Repo**: **258/258 tests PASS (100%)**.
    - **Build verification**: `tsc -b && vite build` PASS (0 errors, 2.34s).
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).
- [x] **Bước 4.4**: Feature `review-tasks` (Ma trận nhiệm vụ rà soát, Luồng chuyển trạng thái hợp đồng, Quản lý phiên bản và Tải lên bản sửa đổi .docx).
  - Tạo cấu trúc feature độc lập [`frontend/src/features/review-tasks/`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/):
    - [`types.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/types.ts): Định nghĩa `TaskCategory`, `TaskStatus`, `TaskItem`, `CreateTaskPayload`, `UpdateTaskPayload`, `TASK_CATEGORY_CONFIG`, `TASK_STATUS_CONFIG`, `WorkflowActionType`, `WorkflowActionConfig`.
    - [`services/taskService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/services/taskService.ts): Firestore queries subcollection `/contracts/{id}/tasks`, `createTask`, `updateTask`, `deleteTask`, gọi Cloud Function `transitionContractStatus` và `uploadRevisionDocx` (tải lên file Word mới lên Firebase Storage và ghi nhận version).
    - [`services/taskService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/services/taskService.test.ts): 6 unit tests kiểm thử CRUD task, status transition và version docx upload (**6/6 PASS**).
    - [`hooks/useTaskList.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useTaskList.ts): Hook đồng bộ danh sách task realtime, tính toán thanh tiến độ (`resolvedCount/totalCount`), lọc theo tab (Tất cả, Cần giải trình, Đã phản hồi), phân quyền RBAC (`canManageTasks` cho Legal/HOL, `canRespondTasks` cho User khi đang `USER_REVISING`).
    - [`hooks/useTaskList.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useTaskList.test.tsx): 5 unit tests kiểm thử tiến độ, phân quyền và handlers (**5/5 PASS**).
    - [`hooks/useWorkflowActions.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useWorkflowActions.ts): Hook ánh xạ trạng thái và vai trò người dùng thành danh sách Action Buttons hợp lệ theo chuẩn State Machine (Mục 6.1 `new_architecture.md`).
    - [`hooks/useWorkflowActions.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useWorkflowActions.test.tsx): 5 unit tests kiểm thử quyền hành động theo vai trò (User/Legal/HOL) và modal trigger (**5/5 PASS**).
    - [`components/TaskRow.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/TaskRow.tsx): Hàng hiển thị chi tiết điều khoản, vấn đề phát hiện, khuyến nghị của Pháp chế, khung nhập phản hồi giải trình của người phụ trách kèm nút lưu nhanh `Đã sửa (Resolved)` / `Bỏ qua (Waived)`.
    - [`components/TaskFormModal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/TaskFormModal.tsx): Dialog cho chuyên viên Pháp chế thêm mới hoặc chỉnh sửa điều khoản rà soát.
    - [`components/TaskMatrix.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/TaskMatrix.tsx): Khung ma trận nhiệm vụ rà soát tích hợp thanh tiến độ trực quan, nút `+ Thêm điều khoản`, bộ lọc tab mini và empty state khi chưa có task.
    - [`components/TaskMatrix.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/TaskMatrix.test.tsx): 4 unit tests kiểm thử render, tiến độ và modal trigger (**4/4 PASS**).
    - [`components/SubmitRevisionModal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/SubmitRevisionModal.tsx): Dialog kéo thả chọn file Word mới (`.docx`), nhập tóm tắt điểm đã sửa (`changeSummary`), ghi chú đàm phán (`negoNotes`), kiểm tra cảnh báo nếu còn điều khoản chưa phản hồi và gọi nộp lại sang `PENDING_LEGAL`.
    - [`components/ActionButtons.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/ActionButtons.tsx): Cụm nút hành động thông minh trên Meta Header kèm modal xác nhận và nhập lý do từ chối (HOL reject reason).
    - [`components/ActionButtons.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/ActionButtons.test.tsx): 3 unit tests kiểm thử render và confirmation modal (**3/3 PASS**).
    - [`index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/index.ts): Master Barrel export công khai duy nhất cho feature `review-tasks`.
  - Tích hợp vào không gian làm việc `ContractDetailView`:
    - Header Bar: Gắn `<ActionButtons />` kích hoạt trạng thái thông minh.
    - Tab 1 ("Nhiệm vụ rà soát"): Gắn `<TaskMatrix />` và hiển thị huy hiệu đếm số lượng điều khoản chưa phản hồi.
  - **Kết quả Kiểm thử & Build Giai đoạn 4.4**:
    - **Frontend Vitest**: 32 test suites, **182/182 tests PASS (100%)** (+23 unit tests mới).
    - **Backend Vitest**: 13 test suites, **99/99 tests PASS (100%)**.
    - **Toàn bộ Repo**: **281/281 tests PASS (100%)**.
    - **Build verification**: `tsc -b && vite build` PASS (0 errors, 2.73s).
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).
- [x] **Bước 4.5**: Feature `ai-assistant` (Trợ lý AI Gemini 2.5 trong Tab 2: Tóm tắt điều hành, Radar rủi ro kèm câu chữ đàm phán, Bản tóm lược quyết định trình Lãnh đạo, và bộ đệm Firestore Caching 5ms / 0-cost).
  - Tạo cấu trúc feature độc lập [`frontend/src/features/ai-assistant/`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/):
    - [`types.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/types.ts): Định nghĩa `AIAnalysisType`, `SummaryResult`, `RiskLevel`, `ContractRiskItem`, `RiskAssessmentResult`, `DecisionRecommendation`, `ConcessionItem`, `DecisionBriefResult`, `AIAnalysisDocument`, `AIAnalysisRequest`, `AIAnalysisResponse`, `AI_TABS_CONFIG`, `RISK_LEVEL_CONFIG`, `DECISION_RECOMMENDATION_CONFIG` và các Type Guards.
    - [`services/aiService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/services/aiService.ts): Tích hợp hàm `buildAnalysisDocId` sinh key xác định (`SUMMARY_v{N}`, `RISK_v{N}_{ROLE}`, `DECISION_BRIEF_v{N}`), đọc Firestore caching subcollection `/contracts/{id}/ai_analyses/{analysisId}` (5ms / 0-cost API), kích hoạt Callable Cloud Function `analyzeContractAI`, kèm bộ dữ liệu mẫu chi tiết `DEV_SAMPLE_AI_ANALYSES` cho môi trường dev offline.
    - [`services/aiService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/services/aiService.test.ts): 11 unit tests kiểm thử doc ID generator, sample fallback, Firestore caching, và Cloud Function triggers (**11/11 PASS**).
    - [`hooks/useAIEngine.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/hooks/useAIEngine.ts): Custom hook quản lý Tab phân quyền RBAC (`USER`: chỉ Tóm tắt; `LEGAL`: Tóm tắt + Rủi ro; `HOL`: Cả 3 tab), tự động tải kết quả đệm, theo dõi trạng thái `isCached` / thời gian phân tích, và kích hoạt `reanalyzeCurrentTab` gọi AI phân tích lại.
    - [`hooks/useAIEngine.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/hooks/useAIEngine.test.tsx): 7 unit tests kiểm thử RBAC tabs, caching, re-analysis forceRefresh và error handling (**7/7 PASS**).
    - [`components/AISummaryBox.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/components/AISummaryBox.tsx): Giao diện hiển thị Loại hình giao dịch, thông tin 2 bên đối tác (Bên A / Bên B), thời hạn thực hiện, nghĩa vụ tài chính, danh sách nghĩa vụ cốt lõi, điều kiện chấm dứt và điều khoản đặc biệt.
    - [`components/RiskRadar.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/components/RiskRadar.tsx): Radar đánh giá rủi ro theo vị thế doanh nghiệp (Buyer/Seller), phân loại 4 cấp độ (Critical / High / Medium / Low), giải trình vấn đề & tác động, cụm câu chữ đàm phán đề xuất (Mitigation Wording) kèm nút sao chép nhanh (Copy to Clipboard), và danh sách điều khoản có lợi.
    - [`components/DecisionBrief.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/components/DecisionBrief.tsx): Bản tóm lược quyết định dành riêng cho Trưởng phòng Pháp chế (HOL) với khuyến nghị duyệt ký (Approve / Approve with conditions / Reject), bảng đối chiếu nhượng bộ đàm phán (Ta nhượng bộ vs Đối tác nhượng bộ vs Đồng thuận), rủi ro còn tồn đọng và kết luận đề xuất.
    - [`components/AIAssistantPanel.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/components/AIAssistantPanel.tsx): Khung chứa Tab 2 tổng hợp tích hợp pill tabs, huy hiệu trạng thái cache ("Đã đệm 5ms" / "Mới phân tích"), nút "Phân tích lại", hiệu ứng Skeleton loading chuyên nghiệp khi Gemini đang xử lý, và empty state.
    - [`components/AIAssistantPanel.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/components/AIAssistantPanel.test.tsx): 4 unit tests kiểm thử hiển thị pill tabs theo vai trò RBAC, badge cache, và nút phân tích lại (**4/4 PASS**).
    - [`index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/index.ts): Master Barrel export công khai duy nhất cho feature `ai-assistant`.
  - Tích hợp vào không gian làm việc `ContractDetailView`:
    - Tab 2 ("Trợ lý AI"): Thay thế placeholder cũ bằng `<AIAssistantPanel />` truyền `contractId`, `versionNo`, `companyRole` và `userRole`.
  - **Kết quả Kiểm thử & Build Giai đoạn 4.5**:
    - **Frontend Vitest**: 35 test suites, **204/204 tests PASS (100%)** (+22 unit tests mới).
    - **Backend Vitest**: 13 test suites, **99/99 tests PASS (100%)**.
    - **Toàn bộ Repo**: **303/303 tests PASS (100%)**.
    - **Build verification**: `tsc -b && vite build` PASS (0 errors, 2.26s).
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).
- [x] **Bước 4.6**: Features `comments`, `reference-files` & `notifications` (Hợp tác đa bên, Đính kèm tài liệu & Quả chuông thông báo Topbar).
  - **Feature `comments`** ([`frontend/src/features/comments/`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/)):
    - [`types.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/types.ts): Định nghĩa `CommentType`, `CommentAuthor`, `CommentDocument`, `CreateCommentPayload`, `COMMENT_TYPE_CONFIG` và helper `resolveCommentType`.
    - [`services/commentService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/services/commentService.ts): Firestore realtime listener `subscribeToComments` (`/contracts/{id}/comments`), `addComment` lưu bình luận bất biến (Immutable), tích hợp `DEV_SAMPLE_COMMENTS` cho local dev.
    - [`services/commentService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/services/commentService.test.ts): 5 unit tests kiểm thử role mapping, realtime subscription và addComment (**5/5 PASS**).
    - [`hooks/useComments.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/hooks/useComments.ts): Custom hook quản lý realtime stream, lọc theo phiên bản, submit comment và keyboard shortcut (**4/4 tests PASS**).
    - [`components/CommentItem.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/components/CommentItem.tsx): Thẻ bình luận đơn lẻ, avatar initials, role badge, timestamp, và tag điều khoản tham chiếu `clauseRef`.
    - [`components/CommentInput.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/components/CommentInput.tsx): Ô nhập liệu thông minh hỗ trợ phím tắt `Ctrl + Enter`, gắn điều khoản tham chiếu nhanh và loading indicator.
    - [`components/CommentThread.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/components/CommentThread.tsx): Khung thảo luận tổng hợp tích hợp bộ lọc phiên bản ("Tất cả", "Bản v1"...), cuộn mượt tự động khi có tin mới, và empty state.
    - [`components/CommentThread.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/components/CommentThread.test.tsx): 2 unit tests kiểm thử render và submit comment (**2/2 PASS**).
    - [`index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/index.ts): Master Barrel export công khai duy nhất cho feature `comments`.
  - **Feature `reference-files`** ([`frontend/src/features/reference-files/`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/)):
    - [`types.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/types.ts): Định nghĩa `ReferenceFileDocument`, phân loại `getFileCategory` (PDF/Word/Excel/Image/ZIP) và formatter dung lượng `formatFileSize`.
    - [`services/refFileService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/services/refFileService.ts): Tải file lên Firebase Storage, ghi nhận metadata subcollection `/contracts/{id}/reference_files`, xóa file và tích hợp `DEV_SAMPLE_REF_FILES`.
    - [`services/refFileService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/services/refFileService.test.ts): 6 unit tests kiểm thử subscription, upload và delete file (**6/6 PASS**).
    - [`hooks/useReferenceFiles.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/hooks/useReferenceFiles.ts): Custom hook quản lý danh sách file, upload progress bar, phân quyền xóa RBAC `canDelete` (chỉ uploader hoặc HOL) (**5/5 tests PASS**).
    - [`components/UploadRefDropzone.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/components/UploadRefDropzone.tsx): Khu vực kéo thả file (Drag & Drop), giới hạn tối đa 25MB, và hiển thị thanh tiến độ tải lên.
    - [`components/RefFileRow.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/components/RefFileRow.tsx): Hàng hiển thị file: icon loại tệp, dung lượng, người tải, nút tải về và nút xóa có xác nhận.
    - [`components/RefFileList.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/components/RefFileList.tsx): Container danh sách tài liệu tham chiếu tích hợp dropzone và empty state.
    - [`components/RefFileList.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/components/RefFileList.test.tsx): 3 unit tests kiểm thử render, dropzone và nút xóa RBAC (**3/3 PASS**).
    - [`index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/index.ts): Master Barrel export công khai duy nhất cho feature `reference-files`.
  - **Feature `notifications`** ([`frontend/src/features/notifications/`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/notifications/)):
    - [`types.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/notifications/types.ts): Định nghĩa `NotificationType` (`STATUS_CHANGE`, `NEW_COMMENT`, `TASK_ASSIGNED`), `NotificationItem`, và `NOTIFICATION_TYPE_CONFIG`.
    - [`services/notificationService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/notifications/services/notificationService.ts): Firestore listener collection `/notifications/{uid}/items`, hàm `markNotificationAsRead`, `markAllNotificationsAsRead` (writeBatch), tích hợp `DEV_SAMPLE_NOTIFICATIONS`.
    - [`services/notificationService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/notifications/services/notificationService.test.ts): 6 unit tests kiểm thử subscription, mark read đơn lẻ và batch mark all (**6/6 PASS**).
    - [`hooks/useNotifications.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/notifications/hooks/useNotifications.ts): Custom hook tính toán `unreadCount`, lọc chưa đọc, và các actions đánh dấu đã đọc (**4/4 tests PASS**).
    - [`components/NotificationItemRow.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/notifications/components/NotificationItemRow.tsx): Dòng thông báo trực quan hiển thị icon phân loại, chấm xanh unread, mã hợp đồng và thời gian.
    - [`components/NotificationDropdown.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/notifications/components/NotificationDropdown.tsx): Dropdown popover xem thông báo, lọc tabs ("Tất cả", "Chưa đọc"), nút "Đọc tất cả".
    - [`components/NotificationBell.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/notifications/components/NotificationBell.tsx): Nút Quả chuông trên Topbar Header với huy hiệu đỏ đếm số lượng chưa đọc, click popover toggle, click outside to close, và click chuyển trang vào đúng hợp đồng.
    - [`components/NotificationBell.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/notifications/components/NotificationBell.test.tsx): 4 unit tests kiểm thử badge, toggle, navigation và mark all read (**4/4 PASS**).
    - [`index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/notifications/index.ts): Master Barrel export công khai duy nhất cho feature `notifications`.
  - **Tích Hợp Vào Ứng Dụng**:
    - Header Topbar ([`AppLayout.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/AppLayout.tsx)): Gắn `<NotificationBell userId={currentUser.uid} />` cạnh avatar và theme toggle.
    - Tab 3 Workspace ([`PlaceholderPages.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/PlaceholderPages.tsx)): Gắn `<CommentThread />` thời gian thực.
    - Tab 4 Workspace ([`PlaceholderPages.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/PlaceholderPages.tsx)): Gắn `<RefFileList />` kéo thả tệp đính kèm.
  - **Kết quả Kiểm thử & Build Giai đoạn 4.6 (Hoàn Thành 100% Giai Đoạn 4)**:
    - **Frontend Vitest**: 44 test suites, **243/243 tests PASS (100%)** (+39 unit tests mới).
    - **Backend Vitest**: 13 test suites, **99/99 tests PASS (100%)**.
    - **Toàn bộ Repo**: **342/342 tests PASS (100%)**.
    - **Build verification**: `tsc -b && vite build` PASS (0 errors, 2.29s).
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

---

## ⏳ GIAI ĐOẠN 5: TESTING END-TO-END & GO-LIVE (ĐANG TRIỂN KHAI)
- [x] **Bước 5.1: Cấu hình Firebase Local Emulator Suite & Kiểm thử End-to-End Vòng đời Hợp đồng 9 trạng thái**.
  - **Cấu hình Hạ tầng Local Emulators**:
    - Cập nhật [`firebase.json`](file:///Users/tindn/Documents/Code/ContractReview_firestore/firebase.json) bổ sung khối cấu hình `emulators`: Auth (port 9099), Functions (port 5001), Firestore (port 8080), Storage (port 9199), UI Console (port 4000).
    - Tạo [`backend/.env`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/.env) cho môi trường chạy cục bộ.
    - Cập nhật [`backend/scripts/seedWhitelistUsers.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/scripts/seedWhitelistUsers.ts) tự động nhận diện host Emulator, nạp 3 tài khoản Whitelist (`USER`, `LEGAL`, `HOL`), đồng bộ Auth Custom Claims và khởi tạo counter `/counters/contracts_YYMM`.
  - **Kích hoạt Kết Nối Frontend**:
    - Cập nhật [`frontend/.env`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/.env) kích hoạt `VITE_USE_EMULATORS=true` đưa toàn bộ request từ UI vào Emulator thật.
    - Nâng cấp [`authService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/auth/services/authService.ts) & [`LoginCard.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/auth/components/LoginCard.tsx) với hàm `signInWithEmail` hỗ trợ xác thực Auth Emulator thực tế, phát hành JWT token thật kèm Custom Claims.
  - **Bộ Test Tích Hợp E2E Tự Động (Automated Workflow Test Suite)**:
    - Viết mới [`backend/src/e2e/lifecycleWorkflow.e2e.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/e2e/lifecycleWorkflow.e2e.test.ts) kiểm chứng tự động toàn bộ 9 bước nghiệp vụ qua 3 vai trò:
      1. `USER` tạo hợp đồng `DRAFT` v1 (`CTR-2609-0001`).
      2. `USER` nộp thẩm định $\rightarrow$ `PENDING_LEGAL` (ghi activity log, gửi notification Legal).
      3. `LEGAL` tạo 2 task điều khoản $\rightarrow$ `LEGAL_COMMENTED` $\rightarrow$ `USER_REVISING`.
      4. `USER` phản hồi đã sửa task $\rightarrow$ nộp bản sửa đổi v2 $\rightarrow$ `PENDING_LEGAL` (tính toán `rejectCount = 1`).
      5. `LEGAL` thẩm định đạt $\rightarrow$ `LEGAL_APPROVED` $\rightarrow$ tự động chuyển `PENDING_HOL`.
      6. `HOL` xem xét phê duyệt $\rightarrow$ `HOL_APPROVED`.
      7. `USER` người phụ trách hoàn tất $\rightarrow$ `COMPLETED` (xác thực `isArchived = true`, chuỗi 8 activities audit trail liên hoàn).
      8. Kiểm tra phân quyền RBAC: Ngăn chặn triệt để hành vi can thiệp trái phép quyền duyệt giữa các vai trò.
  - **Nâng Cấp Upload Tệp Word .docx Phiên Bản Đầu Tiên (v1)**:
    - Bổ sung trường `file: File` trong `CreateContractPayload` ([`types.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/types.ts)).
    - Nâng cấp [`CreateContractModal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/CreateContractModal.tsx) với khu vực kéo thả tệp (Drag & Drop Zone), chỉ chấp nhận `.docx`, giới hạn tối đa 50MB, hiển thị file badge và nút gỡ bỏ.
    - Cập nhật [`contractService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/services/contractService.ts): Tải tệp lên Firebase Storage `contracts/${contractId}/versions/v1.docx`, ghi nhận subcollection `/versions/v1` và cập nhật con trỏ `currentVersionFile` trên hợp đồng.
    - Nâng cấp validation trong [`useCreateContract.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/hooks/useCreateContract.ts) và bổ sung unit tests.
  - **Khắc Phục 3 Lỗi Tích Hợp Trên Local Emulator (Hotfixes)**:
    - **Lỗi 1 (In-App Document Viewer Preview trống trơn)**:
      - Sửa entrypoint backend `package.json` `"main": "dist/src/index.js"` để Functions Emulator tìm và nạp đúng các hàm Cloud Functions đã build.
      - Cập nhật [`documentUrlService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/storage/documentUrlService.ts): Phát hiện biến môi trường `FIREBASE_STORAGE_EMULATOR_HOST`, tự động sinh link đọc từ Storage Emulator (`http://${emulatorHost}/v0/b/.../o/...?alt=media`) thay vì gọi V4 RSA signing vốn đòi hỏi Google Cloud Service Account Private Key.
      - Bổ sung cơ chế fallback trực tiếp `getDownloadURL(ref(storage, path))` trong [`storageService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/services/storageService.ts) phòng khi callable function không phản hồi.
      - Bổ sung UI card xử lý lỗi `NETWORK_ERROR` và lỗi tải trong [`PdfViewer.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/PdfViewer.tsx) với nút "Thử lại" và nút "Tải file Word (.docx)", triệt tiêu hoàn toàn hiện tượng màn hình trắng/trống trơn.
    - **Lỗi 2 (Lỗi Trao đổi `clauseRef: undefined`)**:
      - Sửa [`commentService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/services/commentService.ts): Kiểm tra `payload.clauseRef?.trim()`, chỉ gán `clauseRef` vào payload Firestore khi có giá trị hợp lệ, loại bỏ trường `undefined` gây lỗi Firestore SDK `Unsupported field value: undefined`.
    - **Lỗi 3 (Lỗi Quyền Đính Kèm File `storage/unauthorized`)**:
      - Sửa [`storage.rules`](file:///Users/tindn/Documents/Code/ContractReview_firestore/storage.rules): Bổ sung rule bảo vệ cho path `/contracts/{contractId}/reference_files/{fileName}` đồng bộ với `/references/{fileName}`, cho phép người dùng trong Whitelist tải file tham chiếu lên đến 20MB.
    - **Lỗi 4 (Functions Emulator Không Khởi Động & Lỗi Preflight CORS khi Nộp Thẩm Định)**:
      - **Nguyên nhân gốc rễ**: File `firebase-debug.log` ghi nhận 2 lỗi chí mạng khiến Functions Emulator crash khi load:
        1. `backend/.env` chứa key `FIREBASE_PROJECT_ID` vi phạm quy tắc của Firebase CLI: *"Key starts with a reserved prefix (X_GOOGLE_ FIREBASE_ EXT_ KIT_)"*, khiến CLI từ chối load toàn bộ file `.env`.
        2. Hàm `onVersionUploaded` (`onObjectFinalized`) trong Cloud Functions v2 thiếu tùy chọn `bucket` rõ ràng, ném lỗi `Error: Missing bucket name` lúc khởi tạo module nếu không có biến `FIREBASE_CONFIG`.
      - **Khắc phục**:
        1. Đổi `FIREBASE_PROJECT_ID` $\rightarrow$ `PROJECT_ID` trong `backend/.env`, `backend/.env.example` và `firebaseAdmin.ts`.
        2. Bổ sung `bucket: targetBucket` rõ ràng vào options của `onObjectFinalized` trong [`onVersionUploaded.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/functions/converter/onVersionUploaded.ts).
        3. Kiểm chứng: Node.js đã nạp thành công 100% 7/7 Cloud Functions (`healthCheck`, `onUserDocWrite`, `transitionContractStatus`, `getSignedDocumentUrl`, `onVersionUploaded`, `analyzeContractAI`, `sendContractEmail`).
        4. Tạo script [`generatePreviewPdf.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/scripts/generatePreviewPdf.ts) (`npm run preview:gen -- <contractId>`) hỗ trợ sinh PDF xem trước cho hợp đồng bất kỳ.
    - **Lỗi 5 (Lỗi 500 Internal Server Error khi nộp thẩm định `Cannot read properties of undefined (reading 'serverTimestamp')`)**:
      - **Nguyên nhân gốc rễ**: Khi biên dịch TypeScript theo chuẩn Node.js ESM (`target: NodeNext`), cú pháp namespace import `import * as admin from 'firebase-admin'` làm `admin.firestore` nhận giá trị `undefined` tại runtime, khiến lời gọi `admin.firestore.FieldValue.serverTimestamp()` ném lỗi `TypeError: Cannot read properties of undefined (reading 'serverTimestamp')` tại dòng 166 (trong transaction của `contractTransitionService.ts`).
      - **Khắc phục**:
        1. Thay thế namespace import bằng module import chính thức của Firebase Admin: `import { FieldValue } from 'firebase-admin/firestore';`.
        2. Cập nhật đồng bộ tại 4 services: [`contractTransitionService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/contractTransitionService.ts), [`converterWorkerService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/converter/converterWorkerService.ts), [`aiService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/aiService.ts), [`emailDispatcherService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/email/emailDispatcherService.ts).
        3. Biên dịch lại toàn bộ mã nguồn backend (`npm run build --prefix backend`).
    - **Lỗi 6 (Lỗi 403 Permission Denied. No READ permission khi Click Xem hoặc Tải File Hợp Đồng Trên Emulator)**:
      - **Nguyên nhân gốc rễ**: Khi người dùng xem file PDF qua `<iframe>` hoặc click thẻ `<a download>` để tải file `.docx`, trình duyệt gửi request HTTP GET trực tiếp tới Storage Emulator mà không kèm `Authorization` Header. Trong khi đó, `storage.rules` yêu cầu `isWhitelisted()`. Để trình duyệt tải/xem được, URL cần có download token `&token=<downloadToken>`. Hàm `signFileUrl` trong [`documentUrlService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/storage/documentUrlService.ts) ở nhánh Emulator trước đó thiếu tham số `&token=...`, khiến Storage Emulator từ chối với lỗi 403.
      - **Khắc phục**:
        1. Cập nhật [`documentUrlService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/storage/documentUrlService.ts): Thêm helper `getOrCreateEmulatorDownloadToken` tự động đọc hoặc tạo token UUID cho file trong Emulator và gắn `&token=${token}` vào `signedUrl`. Cô lập 100% logic này trong khối `if (emulatorHost)`, hoàn toàn không ảnh hưởng đến Production.
        2. Cập nhật [`converterWorkerService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/converter/converterWorkerService.ts): Gán download token vào metadata khi tạo file PDF preview.
        3. Cập nhật [`contractService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/services/contractService.ts) & [`taskService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/services/taskService.ts): Đính kèm `customMetadata.firebaseStorageDownloadTokens` khi client upload bản `.docx`.
        4. Cập nhật [`documentUrlService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/storage/documentUrlService.test.ts): Bổ sung 2 unit test cases kiểm thử logic token trên Emulator.
    - **Lỗi 7 (Chuẩn hóa Luồng Phê Duyệt 3 Bước: User -> Legal -> HOL)**:
      - **Nguyên nhân gốc rễ**: 
        1. Tại `statusConfig.ts`, trạng thái `LEGAL_APPROVED` bị gom nhầm vào nhóm thẻ `approved` ("Hoàn tất / Đã duyệt") thay vì nhóm `head` ("Trưởng ban xét duyệt").
        2. Tại `useWorkflowActions.ts`, nút bấm của Legal ở `PENDING_LEGAL` mang nhãn "Phê Duyệt Pháp Chế" và chuyển `targetStatus: 'LEGAL_APPROVED'` nhưng không có cơ chế chuyển giao lên Trưởng phòng (`PENDING_HOL`), khiến hợp đồng rơi thẳng vào nhóm "Đã duyệt" mà HOL chưa hề thẩm định.
      - **Khắc phục**:
        1. Cập nhật [`statusConfig.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/constants/statusConfig.ts): Chuyển `LEGAL_APPROVED` sang nhóm `head`. Nhóm `approved` chỉ còn `HOL_APPROVED` và `COMPLETED`. Cập nhật `PENDING_HOL` thành *"Chờ Trưởng phòng duyệt"*.
        2. Cập nhật [`statusStateMachine.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/statusStateMachine.ts): Bổ sung rule chuyển trực tiếp `PENDING_LEGAL` $\rightarrow$ `PENDING_HOL` cho `LEGAL` và `HOL` để Pháp chế thẩm định đạt có thể trình thẳng lên Trưởng phòng duyệt.
        3. Cập nhật [`useWorkflowActions.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useWorkflowActions.ts):
           - Tại `PENDING_LEGAL`: Nút YES đổi thành *"Thẩm Định Đạt — Trình Trưởng Phòng"* (`targetStatus: 'PENDING_HOL'`, icon `send`).
           - Tại `PENDING_HOL`: Nút YES là *"Phê Duyệt Chính Thức"* (`targetStatus: 'HOL_APPROVED'`, icon `check`); nút NO là *"Yêu Cầu Sửa Đổi / Làm Rõ"* (`targetStatus: 'HOL_COMMENTED'` back về User).
        4. Cập nhật [`contractService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/services/contractService.ts), [`taskService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/services/taskService.ts), [`useContractDetail.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/hooks/useContractDetail.ts), [`PlaceholderPages.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/PlaceholderPages.tsx): Hỗ trợ `getMockContract`, `updateMockContractStatus`, và hàm `refetchContract` giúp giao diện tự động cập nhật ngay lập tức cả ở chế độ Mock Dev lẫn Firebase Emulator.
    - **Lỗi 8 (Linh Hoạt Nộp Lại Khi Bị Trả Về — Tải File Mới Hoặc Giữ File Cũ Chỉ Giải Trình)**:
      - **Nguyên nhân gốc rễ**: Trước đây [`SubmitRevisionModal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/SubmitRevisionModal.tsx) bắt buộc (`required`) phải chọn file Word mới khi nộp lại (`USER_REVISING` $\rightarrow$ `PENDING_LEGAL`) và luôn ép tăng phiên bản, khiến người dùng không thể nộp lại trong các trường hợp chỉ cần giải trình hoặc giữ nguyên điều khoản theo thỏa thuận.
      - **Khắc phục**:
        1. Nâng cấp [`SubmitRevisionModal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/SubmitRevisionModal.tsx) hỗ trợ 2 chế độ (Mode Selector):
           - Chế độ 1: *"Tải bản Word sửa đổi mới"* $\rightarrow$ Upload file, tăng version `v{nextVersionNo}`.
           - Chế độ 2: *"Giữ bản hiện tại (v{currentVersionNo}) — Giải trình"* $\rightarrow$ Không cần file, giữ nguyên số version, gửi kèm nội dung giải trình.
        2. Cập nhật nhãn nút tại [`useWorkflowActions.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useWorkflowActions.ts) thành *"Nộp Lại / Bổ Sung Giải Trình"*.
        3. Viết mới bộ unit tests [`SubmitRevisionModal.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/SubmitRevisionModal.test.tsx) kiểm thử độc lập 4 test cases cho cả 2 chế độ và validation.
  - **Kết quả Kiểm thử Toàn Diện Bước 5.1**:
    - **Backend Vitest**: 14 test suites, **104/104 tests PASS (100%)**.
    - **Frontend Vitest**: 45 test suites, **249/249 tests PASS (100%)** (+4 tests mới).
    - **Toàn bộ Repo**: **353/353 tests PASS (100%)**.
    - **TypeScript Build**: `tsc` (Backend) & `tsc -b && vite build` (Frontend) đều **0 errors**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.2: Tinh gọn Kiến trúc — Bỏ hoàn toàn Quick Preview PDF & Chuyển sang Client-Side DOCX Preview (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    - Bỏ tính năng PDF preview phụ trợ để không cần duy trì Cloud Function converter (LibreOffice / puppeteer), tiết kiệm 50% dung lượng Firebase Storage (chỉ lưu duy nhất bản Word gốc) và loại bỏ hoàn toàn độ trễ chờ đợi (Zero-latency preview).
    - Người dùng xem trực tiếp văn bản Word trên trình duyệt; khi cần chỉnh sửa hoặc gắn comment chi tiết, người dùng bấm nút *"Tải file Word (.docx)"* về máy cá nhân.
  - **Backend & Cloud Functions**:
    - Xóa bỏ trigger Cloud Function `onVersionUploaded` và module `backend/src/modules/converter/`.
    - Xóa script `backend/scripts/generatePreviewPdf.ts` và lệnh npm `"preview:gen"`.
    - Nâng cấp module Trợ lý AI [`backend/src/modules/ai/aiService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/aiService.ts): Tải file DOCX từ Storage và trích xuất text thuần thông qua thư viện siêu nhẹ `mammoth`.
    - Cập nhật [`promptBuilder.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/promptBuilder.ts) & [`geminiClient.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/geminiClient.ts): Truyền trực tiếp text văn bản hợp đồng vào prompt của Gemini thay vì OCR qua PDF multimodal (tốc độ nhanh hơn gấp đôi và tiết kiệm chi phí token).
    - Cập nhật [`storageAccessManager.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/storage/storageAccessManager.ts): Loại bỏ category `'previews'`.
    - Cập nhật [`storage.rules`](file:///Users/tindn/Documents/Code/ContractReview_firestore/storage.rules): Xóa bỏ match rule `/contracts/{contractId}/previews/{fileName}`.
    - Xóa bỏ thuộc tính `previewPdfPath` khỏi interface `ContractDocument` và `VersionDocument` tại [`backend/src/types/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/types/index.ts).
  - **Frontend & Document Viewer**:
    - Cài đặt thư viện [`docx-preview`](https://github.com/VolodymyrBaydalka/docxjs) render trực tiếp file `.docx` thành giao diện trang A4 chuẩn mực.
    - Xây dựng component [`DocxViewer.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/DocxViewer.tsx): Khung đọc văn bản Word với thanh công cụ Toolbar (Zoom In/Out 75%–200%, Toàn màn hình, Chọn phiên bản, Tải file Word, Tải lại). Xóa bỏ hoàn toàn component cũ `PdfViewer.tsx`.
    - Đơn giản hóa [`DownloadButton.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/DownloadButton.tsx): Nút tải trực tiếp file Word (.docx) sạch sẽ.
    - Nâng cấp [`useDocumentViewer.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/hooks/useDocumentViewer.ts): Lấy Signed URL và tải `ArrayBuffer` đưa vào `docx-preview`; xóa bỏ trạng thái chờ `CONVERTING`.
    - Bổ sung helper `fetchDocxArrayBuffer` trong [`storageService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/services/storageService.ts).
    - Dọn sạch trường `previewPdfPath` trên toàn bộ Frontend: `shared/types/contract.ts`, `document-viewer/types.ts`, `contractService.ts`, `useContractDetail.ts`, `taskService.ts`, `PlaceholderPages.tsx`.
  - **Kết quả Kiểm thử & Build Toàn Diện**:
    - **Backend Vitest**: 12 test suites, **92/92 tests PASS (100%)**.
    - **Backend Build**: `tsc` build PASS (**0 errors**).
    - **Frontend Vitest**: 45 test suites, **250/250 tests PASS (100%)**.
    - **Frontend Build**: `tsc -b && vite build` PASS (**0 errors**).
    - **Toàn bộ Repo**: **342/342 tests PASS (100%)**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.3: Tách Biệt Nút Upload Phiên Bản Mới (Stage-based RBAC) & Tinh Gọn Luồng Nộp Lại (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    - Giải quyết vấn đề người dùng ở lần tạo đầu tiên (`DRAFT`) muốn tải lên bản Word mới mà chưa muốn nộp thẩm định.
    - Bóc tách rành mạch hai trách nhiệm: **Quản lý phiên bản tài liệu (Document Versioning)** trên Toolbar của `DocxViewer` và **Chuyển giao trạng thái (Workflow Action)** trên Topbar.
  - **Tải Lên Phiên Bản Mới (Document Viewer)**:
    - Xây dựng helper kiểm tra quyền [`versionPermissions.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/utils/versionPermissions.ts): Phân quyền theo Stage & Role (`DRAFT` & `USER_REVISING`: User owner; `PENDING_LEGAL`: Legal/HOL; `PENDING_HOL`: HOL; các stage khác: khóa).
    - Viết unit tests [`versionPermissions.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/utils/versionPermissions.test.ts) (**6/6 tests PASS**).
    - Xây dựng component [`UploadVersionModal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/UploadVersionModal.tsx): Kéo thả chọn file `.docx` ($\le 25MB$), ghi chú thay đổi tùy chọn, tự động tăng phiên bản $v_{N+1}$, lưu file vào Storage, tạo bản ghi `/versions` và giữ nguyên 100% stage của hợp đồng.
    - Viết unit tests [`UploadVersionModal.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/UploadVersionModal.test.tsx) (**4/4 tests PASS**).
    - Tích hợp nút *"Upload"* trên Toolbar của [`DocxViewer.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/DocxViewer.tsx), tự động chuyển xem sang bản mới và gọi `refetchContract()`.
    - Tinh chỉnh UI Toolbar (Phương án B): Xóa text tên tệp thừa (`"aaaaa"`), bỏ nút reload, đổi nhãn thành `"Download"` và chuyển sang bên trái cạnh Dropdown phiên bản, đổi nhãn thành `"Upload"` đặt ở cụm bên phải, giữ nguyên các icons sắc nét.
    - Kết nối đầy đủ tại [`PlaceholderPages.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/PlaceholderPages.tsx) và cập nhật barrel export [`document-viewer/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/index.ts).
  - **Tinh Gọn Tối Giản Luồng Nộp Lại (Review Tasks)**:
    - Loại bỏ hoàn toàn modal cũ `SubmitRevisionModal.tsx` và `promptRevisionModal`.
    - Tái sử dụng Modal Xác Nhận chuẩn (Confirmation Dialog) trong [`useWorkflowActions.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useWorkflowActions.ts) và [`ActionButtons.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/ActionButtons.tsx).
    - Tự động gán ghi chú mặc định: *"Bộ phận Legal vui lòng xem xét và duyệt lại hợp đồng."* khi nộp lại mà không cần trường nhập liệu cồng kềnh.
    - Hiển thị banner cảnh báo nhẹ nhàng trong modal xác nhận nếu còn điều khoản chưa phản hồi (`openTasksCount > 0`).
    - Cập nhật unit tests [`useWorkflowActions.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useWorkflowActions.test.tsx) và [`ActionButtons.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/ActionButtons.test.tsx).
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest**: 46 test suites, **257/257 tests PASS (100%)**.
    - **Backend Vitest**: 12 test suites, **92/92 tests PASS (100%)**.
    - **Toàn bộ Repo**: **349/349 tests PASS (100%)**.
    - **TypeScript Build**: `tsc` (Backend) & `tsc -b && vite build` (Frontend) đều **0 errors**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.4: Tinh Gọn 4 Điểm Nghiệp Vụ — Bỏ Nút "Bắt Đầu Sửa Đổi", 2 Nút Task Quyết Định, Reopen Task & Đóng Băng Khi Duyệt (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    - Tối ưu hóa trải nghiệm người dùng theo 4 yêu cầu nghiệp vụ thực tế:
      1. Bỏ thao tác trung gian "Bắt đầu sửa đổi", User có thể lập tức giải trình và upload file khi nhận lại case từ Legal hoặc Head.
      2. Tinh gọn thanh thao tác điều khoản task: Bỏ nút "Lưu ghi chú", gom về 2 nút hành động trực tiếp `Đã sửa (Resolved)` và `Bỏ qua (Waived)`.
      3. Cho phép Legal hoặc Head mở lại (Reopen to `OPEN`) một điều khoản đã phản hồi bằng cách bấm Sửa và Cập nhật.
      4. Đóng băng dữ liệu khi hồ sơ được phê duyệt (`HOL_APPROVED` hoặc `COMPLETED`): Khóa gửi trao đổi, khóa upload tệp đính kèm, khóa gọi phân tích AI mới (chỉ xem cache).
  - **Backend State Machine & AI Guard**:
    - Cập nhật [`statusStateMachine.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/statusStateMachine.ts): Bổ sung transition rules cho phép nộp lại trực tiếp `LEGAL_COMMENTED` $\rightarrow$ `PENDING_LEGAL` và `HOL_COMMENTED` $\rightarrow$ `PENDING_LEGAL`, tự động tăng số lần bị trả về `rejectCount`.
    - Cập nhật [`aiService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/aiService.ts) & [`analyzeContractAI.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/functions/ai/analyzeContractAI.ts): Chặn gọi Gemini API mới khi hợp đồng ở trạng thái `HOL_APPROVED` hoặc `COMPLETED` (`CONTRACT_APPROVED_AI_LOCKED`), bảo toàn kết quả cache 0-cost cho việc tra cứu.
    - Bổ sung unit tests [`statusStateMachine.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/statusStateMachine.test.ts) và [`aiService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/aiService.test.ts) (**98/98 tests PASS**).
  - **Frontend Workflow & Permissions**:
    - Cập nhật [`useWorkflowActions.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useWorkflowActions.ts): Bỏ action `START_REVISING`, hiển thị ngay nút *"Nộp Lại Thẩm Định"* trên Topbar ở cả `LEGAL_COMMENTED` và `HOL_COMMENTED`.
    - Cập nhật [`versionPermissions.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/utils/versionPermissions.ts): Mở quyền upload bản Word mới cho User owner khi nhận lại case (`LEGAL_COMMENTED`, `HOL_COMMENTED`).
    - Cập nhật unit tests [`useWorkflowActions.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useWorkflowActions.test.tsx) và [`versionPermissions.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/utils/versionPermissions.test.ts).
  - **Frontend Task List & Reopen Mechanism**:
    - Cập nhật [`useTaskList.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useTaskList.ts): Mở rộng `canRespondTasks` cho `LEGAL_COMMENTED` & `HOL_COMMENTED`; mở rộng `canManageTasks` cho Legal/Head ở `PENDING_HOL`.
    - Tinh gọn [`TaskRow.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/TaskRow.tsx): Bỏ nút "Lưu ghi chú", thiết kế 2 nút quyết định trực quan `Đã sửa (Resolved)` và `Bỏ qua (Waived)` kích hoạt lưu ghi chú và chuyển trạng thái tức thì kèm loading indicator.
    - Cập nhật [`TaskMatrix.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/TaskMatrix.tsx) & [`TaskFormModal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/TaskFormModal.tsx): Tự động mở lại task thành `OPEN` khi Legal/Head sửa và cập nhật một task đang ở trạng thái `RESOLVED` hoặc `WAIVED`, kèm chú thích thông báo minh bạch.
    - Cập nhật unit tests [`useTaskList.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useTaskList.test.tsx) và [`TaskMatrix.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/TaskMatrix.test.tsx).
  - **Đóng Băng Giao Diện Khi Hồ Sơ Được Phê Duyệt**:
    - [`CommentThread.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/components/CommentThread.tsx): Ẩn `<CommentInput />`, hiển thị thông báo đóng luồng trao đổi.
    - [`RefFileList.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/components/RefFileList.tsx): Ẩn `<UploadRefDropzone />` và ẩn nút xóa file đính kèm.
    - [`AIAssistantPanel.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/components/AIAssistantPanel.tsx): Ẩn nút "Phân tích lại" và nút "Bắt đầu phân tích AI", hiển thị huy hiệu *"Đã đóng băng (Chỉ xem)"*, giữ nguyên xem kết quả cache.
    - [`PlaceholderPages.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/PlaceholderPages.tsx): Truyền `contract.status` đồng bộ tới cả 3 components.
    - Cập nhật unit tests cho `CommentThread.test.tsx`, `RefFileList.test.tsx`, `AIAssistantPanel.test.tsx`.
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest**: 46 test suites, **264/264 tests PASS (100%)** (+7 tests mới).
    - **Backend Vitest**: 12 test suites, **98/98 tests PASS (100%)** (+6 tests mới).
    - **Toàn bộ Repo**: **362/362 tests PASS (100%)**.
    - **TypeScript Build**: `tsc` (Backend) & `tsc -b && vite build` (Frontend) đều **0 errors**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.5: Chuẩn Hóa 6 Trạng Thái Vàng (Golden 6-State Lifecycle) & Ma Trận Phân Quyền Theo Stage (Stage-based RBAC) (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    - Tinh giản quy trình hợp đồng về chuẩn 6 trạng thái vàng, loại bỏ các trạng thái trung gian dư thừa (`LEGAL_COMMENTED`, `HOL_COMMENTED`, `LEGAL_APPROVED`).
    - Khi Legal hoặc Head trả về yêu cầu sửa đổi, hồ sơ chuyển thẳng sang `USER_REVISING` để xuất hiện trực tiếp tại hàng đợi "Bản nháp & Chờ sửa" của User, giải quyết triệt để sự nhầm lẫn về tab quản lý.
    - Thực thi ma trận phân quyền nghiêm ngặt theo Stage: 4 tính năng (Thêm điều khoản, Upload bản Word, Tải tệp đính kèm, Dùng AI) chỉ được mở cho Active Role của stage hiện tại (User không bao giờ được thêm điều khoản).
    - Giữ kênh trao đổi ý kiến ("Comments") thông suốt 2 chiều giữa các bên ở các stage hoạt động, chỉ đóng băng khi Trưởng phòng đã phê duyệt (`HOL_APPROVED` / `COMPLETED`).
  - **Backend State Machine & AI Guard**:
    - Cập nhật [`statusStateMachine.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/statusStateMachine.ts): Rút gọn `TRANSITION_RULES` chỉ còn 7 chuyển đổi hợp lệ giữa 6 trạng thái chuẩn. Cập nhật `computeStatusUpdates` tăng `rejectCount` khi resubmit từ `USER_REVISING` sang `PENDING_LEGAL`.
    - Cập nhật [`contractTransitionService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/contractTransitionService.ts): Bắn thông báo trực tiếp cho User creator khi hồ sơ chuyển sang `USER_REVISING` (phân biệt nội dung từ Legal hoặc Head).
    - Cập nhật [`aiPermissionManager.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/aiPermissionManager.ts) & [`aiService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/aiService.ts): Bổ sung hàm `canTriggerAIInStage`, kiểm tra active role của stage trước khi kích hoạt phân tích AI mới, giữ nguyên khả năng xem cache kết quả.
    - Cập nhật unit tests [`statusStateMachine.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/statusStateMachine.test.ts), [`contractTransitionService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/contractTransitionService.test.ts), [`aiService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/ai/aiService.test.ts), và [`lifecycleWorkflow.e2e.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/e2e/lifecycleWorkflow.e2e.test.ts) (**97/97 tests PASS**).
  - **Frontend Dashboard Config & Workflow Actions**:
    - Cập nhật [`statusConfig.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/constants/statusConfig.ts): Cập nhật `METRIC_GROUPS` phân nhóm chuẩn: `draft: ['DRAFT', 'USER_REVISING']`, `legal: ['PENDING_LEGAL']`, `head: ['PENDING_HOL']`, `approved: ['HOL_APPROVED', 'COMPLETED']`.
    - Cập nhật [`useWorkflowActions.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useWorkflowActions.ts): Tại `PENDING_LEGAL`: "Yêu Cầu Chỉnh Sửa" $\rightarrow$ `USER_REVISING`, "Thẩm Định Đạt — Trình Trưởng Phòng" $\rightarrow$ `PENDING_HOL`. Tại `PENDING_HOL`: "Yêu Cầu Sửa Đổi / Làm Rõ" $\rightarrow$ `USER_REVISING`, "Phê Duyệt Chính Thức" $\rightarrow$ `HOL_APPROVED`.
    - Cập nhật unit tests [`statusConfig.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/constants/statusConfig.test.ts) và [`useWorkflowActions.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useWorkflowActions.test.tsx).
  - **Thực Thi Ma Trận Phân Quyền Theo Stage Trên Giao Diện**:
    - **Nhiệm vụ rà soát (`useTaskList.ts`, `TaskMatrix.tsx`)**:
      - `canManageTasks`: Khóa vĩnh viễn với `USER`; ở `PENDING_LEGAL` chỉ mở cho `LEGAL` (tắt quyền can thiệp của `HOL`); ở `PENDING_HOL` chỉ mở cho `HOL`; các stage khác khóa toàn bộ.
      - `canRespondTasks`: Chỉ mở cho User owner khi hợp đồng ở stage `USER_REVISING`.
    - **Tải tệp đính kèm (`RefFileList.tsx`, `PlaceholderPages.tsx`)**:
      - Bổ sung `canUploadRefFiles`: Chỉ mở cho Active Role của từng stage (ở `PENDING_LEGAL` chỉ mở cho `LEGAL`, tắt `HOL`); ẩn `<UploadRefDropzone />` và khóa xóa tệp với các roles khác.
    - **Upload bản Word mới (`versionPermissions.ts`)**:
      - `canUploadVersion`: Ở `PENDING_LEGAL` chỉ mở cho `LEGAL` (tắt `HOL`).
    - **Nút hành động Workflow (`useWorkflowActions.ts`)**:
      - Ở `PENDING_LEGAL` chỉ hiển thị 2 nút chuyển đổi cho `LEGAL` (tắt `HOL`, ngăn HOL tự trình duyệt cho chính mình).
    - **Kích hoạt Phân tích AI (`AIAssistantPanel.tsx`, `PlaceholderPages.tsx`)**:
      - Bổ sung `canTriggerAIAnalysis`: Chỉ mở nút "Phân tích lại" / "Bắt đầu phân tích AI" cho Active Role của stage hiện tại (ở `PENDING_LEGAL` chỉ mở cho `LEGAL`, tắt `HOL`); hiển thị badge *"Chỉ xem"* khi không thuộc phiên xử lý.
    - **Kênh Trao đổi ("Comments")**:
      - Giữ nguyên mở cho `HOL`, `LEGAL`, và `USER` trao đổi 2 chiều tự do trong suốt các stage hoạt động.
    - Cập nhật unit tests [`useTaskList.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useTaskList.test.tsx), [`RefFileList.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/components/RefFileList.test.tsx), [`AIAssistantPanel.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/components/AIAssistantPanel.test.tsx), [`versionPermissions.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/utils/versionPermissions.test.ts).
  - **Kết quả Kiểm thử & Build Toàn Diện**:
    - **Frontend Vitest**: 46 test suites, **271/271 tests PASS (100%)** (+7 tests mới).
    - **Backend Vitest**: 12 test suites, **99/99 tests PASS (100%)** (+2 tests mới).
    - **Toàn bộ Repo**: **370/370 tests PASS (100%)**.
    - **TypeScript Build**: `tsc` (Backend) & `tsc -b && vite build` (Frontend) đều **0 errors**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.6: Tinh Chỉnh 4 Điểm Nghiệp Vụ & Quy Chuẩn Đặt Tên Tệp Tin — 1 Luồng Trao Đổi, Lần Review Thứ X, Rename CTR-YYMM-xxxx_vz & Cảnh Báo Tải Bản Cũ (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    1. Gộp toàn bộ Trao đổi trực tiếp về 1 luồng duy nhất cho cả case, loại bỏ phân tab theo version, giữ tag nhỏ `vX` trên từng tin nhắn để đối chiếu lịch sử.
    2. Bỏ `(X sửa)` ở cột Phiên bản tại Bảng chính Dashboard; bổ sung Badge `Lần review thứ X` trang trọng tại Header trang chi tiết hợp đồng ($= \text{rejectCount} + 1$).
    3. Chuẩn hóa tên file khi upload lên hệ thống thành `CTR-YYMM-xxxx_vz.docx` (cả lần tạo đầu $v_1$ và các lần $v_z$ tiếp theo); khắc phục dứt điểm lỗi trình duyệt tự đặt tên `contracts_..._versions_vz.docx` bằng cơ chế tải Blob nội bộ.
    4. Khi HOL phê duyệt (`HOL_APPROVED`), phiên bản cuối cùng đổi tên thành `CTR-YYMM-xxxx_approved.docx`. Khi tải phiên bản cũ chưa duyệt, hiển thị popup cảnh báo xác nhận trước khi tải về (Phương án A).
  - **Kênh Trao đổi Trực tiếp (`features/comments`)**:
    - Cập nhật [`CommentThread.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/components/CommentThread.tsx): Bỏ thanh nút lọc phiên bản `Tất cả` / `Bản vX`, hiển thị toàn bộ tin nhắn xuyên suốt vòng đời hợp đồng.
    - Giữ nguyên tag nhỏ `v{comment.versionNo}` trên [`CommentItem.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/components/CommentItem.tsx).
    - Kiểm thử: `CommentThread.test.tsx`, `useComments.test.tsx` (**12/12 tests PASS**).
  - **Số Lần Review (`features/contracts` & App Shell)**:
    - Cập nhật [`ContractTable.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/ContractTable.tsx): Bỏ `({c.rejectCount} sửa)` ở cột Phiên bản, chỉ hiển thị nhãn `vX` tinh gọn.
    - Cập nhật [`PlaceholderPages.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/PlaceholderPages.tsx): Header trang chi tiết hiển thị Huy hiệu `Lần review thứ ${(contract.rejectCount || 0) + 1}`.
    - Cập nhật tests [`ContractTable.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/ContractTable.test.tsx).
  - **Chuẩn Hóa Đặt Tên File & Tải Blob (`contracts`, `review-tasks`, `document-viewer`)**:
    - Cập nhật [`contractService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/services/contractService.ts): Lưu `fileName = `${contractId}_v1.docx`` khi tạo hồ sơ $v_1$.
    - Cập nhật [`taskService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/services/taskService.ts): Lưu `fileName = `${contractId}_v${nextVersionNo}.docx`` khi tải lên bản mới $v_z$.
    - Cập nhật [`useDocumentViewer.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/hooks/useDocumentViewer.ts): Chuyển sang cơ chế tải Blob qua `URL.createObjectURL(blob)`, đảm bảo trình duyệt luôn tôn trọng thuộc tính download và đặt tên chính xác `CTR-YYMM-xxxx_vz.docx`.
  - **Phiên Bản Approved & Modal Cảnh Báo (`backend`, `document-viewer`)**:
    - Cập nhật [`contractTransitionService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/contractTransitionService.ts): Khi chuyển sang `HOL_APPROVED`, tự động đổi tên file phiên bản cuối thành `${contractId}_approved.docx` và gắn cờ `isApprovedVersion: true`.
    - Tạo mới [`DownloadUnapprovedWarningModal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/DownloadUnapprovedWarningModal.tsx) cảnh báo khi người dùng tải phiên bản cũ chưa duyệt của hồ sơ đã phê duyệt.
    - Cập nhật [`DocxViewer.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/DocxViewer.tsx): Tích hợp kiểm tra phiên bản chưa duyệt trước khi download, mở modal xác nhận và xử lý tải về an toàn.
    - Cập nhật [`VersionDropdown.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/VersionDropdown.tsx): Đánh dấu huy hiệu `(Đã duyệt)` cho bản được phê duyệt chính thức.
    - Thêm unit tests [`DownloadUnapprovedWarningModal.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/DownloadUnapprovedWarningModal.test.tsx), [`DocxViewer.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/DocxViewer.test.tsx), [`contractTransitionService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/contractTransitionService.test.ts).
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest**: 47 test suites, **275/275 tests PASS (100%)** (+4 tests mới).
    - **Backend Vitest**: 12 test suites, **100/100 tests PASS (100%)** (+1 test mới).
    - **Toàn bộ Repo**: **375/375 tests PASS (100%)**.
    - **TypeScript Build**: `tsc` (Backend) & `tsc -b && vite build` (Frontend) đều **0 errors**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.7: Tinh Gọn Trao Đổi (Bỏ clauseRef), Bỏ Cột Thao Tác, Xóa Hồ Sơ DRAFT/USER_REVISING (Hard Delete DB & Storage) & Cố Định Light Theme (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    1. Kênh Trao đổi trực tiếp tinh gọn: Loại bỏ hoàn toàn trường `clauseRef`, người dùng nhập trao đổi thuần túy không cần gán điều khoản.
    2. Bảng Danh sách hợp đồng Dashboard: Bỏ cột "Thao tác" với nút "Mở", người dùng click vào bất kỳ vị trí nào trên dòng hợp đồng để vào chi tiết, tối ưu hoá không gian hiển thị cho Tiêu đề và Đối tác.
    3. Xóa hồ sơ ở `DRAFT` & `USER_REVISING`: Cho phép người tạo (`USER` owner) xóa vĩnh viễn case khỏi hệ thống khi ở trạng thái Bản nháp hoặc Đang sửa đổi, kèm modal popup cảnh báo màu đỏ và cơ chế Hard Delete sạch sẽ toàn bộ Firestore document, subcollections và Firebase Storage bucket assets.
    4. Cố định Clean Enterprise Light Theme: Gỡ bỏ toggle Sun/Moon, khóa theme ở `'light'`, dọn sạch class `.dark` và biến localStorage.
  - **Kênh Trao đổi Trực tiếp (`features/comments` & `backend/types`)**:
    - [`backend/src/types/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/types/index.ts) & [`frontend/src/features/comments/types.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/types.ts): Loại bỏ triệt để trường `clauseRef?: string`.
    - [`CommentInput.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/components/CommentInput.tsx): Xóa trường nhập điều khoản và icon `Tag`, chỉ giữ lại ô textarea và nút *"Gửi ý kiến"*.
    - [`CommentItem.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/components/CommentItem.tsx): Xóa khối tag tím điều khoản.
    - [`commentService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/services/commentService.ts) & [`useComments.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/hooks/useComments.ts): Rút gọn payload ghi Firestore.
    - Cập nhật unit tests: `CommentThread.test.tsx`, `useComments.test.tsx`, `commentService.test.ts` (**12/12 tests PASS**).
  - **Bảng Danh Sách Hợp Đồng (`features/contracts`)**:
    - [`ContractTable.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/ContractTable.tsx): Xóa thẻ `<th>Thao Tác</th>` và `<td>...<button>Mở</button>...</td>`.
    - Cập nhật unit test [`ContractTable.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/ContractTable.test.tsx) (**3/3 tests PASS**).
  - **Xóa Hồ Sơ DRAFT/USER_REVISING (Backend & Frontend)**:
    - **Backend**:
      - Xây dựng module [`contractDeletionService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/contractDeletionService.ts): Kiểm tra bảo mật xác thực chính chủ (`contract.createdBy.uid === user.uid`), kiểm tra trạng thái trong `['DRAFT', 'USER_REVISING']`, xóa toàn bộ tệp tin trong Storage tại prefix `contracts/${contractId}/`, đệ quy xóa doc và các subcollections (`versions`, `tasks`, `comments`, `activities`, `ai_analyses`, `reference_files`).
      - Viết unit tests [`contractDeletionService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/contractDeletionService.test.ts) (**10/10 tests PASS**).
      - Xây dựng Callable Cloud Function [`deleteContract.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/functions/contracts/deleteContract.ts) và export tại [`backend/src/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/index.ts).
    - **Frontend**:
      - Xây dựng component [`DeleteContractConfirmModal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/DeleteContractConfirmModal.tsx) cảnh báo nguy hiểm màu đỏ kèm unit tests (**5/5 tests PASS**).
      - Cập nhật [`contractService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/services/contractService.ts): Thêm `deleteContractDoc` và `deleteMockContract` kèm unit tests (**20/20 tests PASS**).
      - Cập nhật [`ActionButtons.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/ActionButtons.tsx): Hiển thị nút *"Xóa Hồ Sơ"* màu đỏ viền khi User chính chủ mở case `DRAFT` hoặc `USER_REVISING`, kích hoạt `DeleteContractConfirmModal`, gọi xóa, hiển thị Toast thành công và điều hướng về `/dashboard`.
      - Cập nhật unit tests [`ActionButtons.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/ActionButtons.test.tsx) (**6/6 tests PASS**).
  - **Cố Định Clean Enterprise Light Theme (`shared/hooks` & App Shell)**:
    - [`AppLayout.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/AppLayout.tsx): Gỡ bỏ nút toggle Sun/Moon khỏi Header.
    - [`useTheme.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/hooks/useTheme.tsx): Khóa theme cố định `'light'`, tự động gỡ class `.dark` trên `document.documentElement` và xóa `cr_theme_mode` trong `localStorage`.
    - Cập nhật unit tests [`useTheme.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/hooks/useTheme.test.tsx) (**3/3 tests PASS**).
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Backend Vitest**: 13 test suites, **110/110 tests PASS (100%)** (+10 tests mới).
    - **Backend Build**: `tsc` build PASS (**0 errors**).
    - **Frontend Vitest**: 48 test suites, **284/284 tests PASS (100%)** (+9 tests mới).
    - **Frontend Build**: `tsc -b && vite build` PASS (**0 errors**).
    - **Toàn bộ Repo**: **394/394 tests PASS (100%)**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.8: Tinh Chỉnh UI/UX Toàn Diện — Bỏ Nav Danh Sách, Nút Home Header, Tối Giản Dashboard, Tái Cấu Trúc Head Chi Tiết, Tinh Gọn Trao Đổi & Ràng Buộc 1000 Ký Tự (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    1. Bỏ nút text "Danh sách Hợp đồng" ở tất cả các screen trên thanh navigation header của `AppLayout.tsx`.
    2. Tối giản màn hình chính Dashboard: Gỡ bỏ khối tiêu đề `<h1>` "Bảng Điều Khiển Hợp Đồng" và dòng chào hỏi; dời nút `+ Tạo Hồ Sơ Mới` xuống nằm bên phải của thanh tìm kiếm `ContractFilters`; gỡ bỏ nhãn pill `Nhóm: ...` và nhãn đếm `Đang hiển thị x/x hồ sơ`.
    3. Màn hình Chi tiết hợp đồng:
       - Gỡ bỏ dòng link text "Quay lại Bảng điều khiển" khỏi trang chi tiết; bổ sung icon Home (`Home` icon) trên Header chung nằm ngay bên trái của icon quả chuông thông báo (`NotificationBell`).
       - Tái cấu trúc khối Head chi tiết: Bỏ hiển thị mã `CTR-YYMM-XXXX` (đã có trên URL); cấu trúc thành 2 hàng tinh gọn:
         - Hàng 1: `[Tên HĐ] [Badge Trạng thái]` $\longleftrightarrow$ `[Bộ nút hành động ActionButtons]`.
         - Hàng 2: `[Đối tác] [Người tạo] [Ngày tạo]` $\longleftrightarrow$ `[Badge Lần review thứ X]`.
    4. Kênh Trao đổi trực tiếp (`features/comments`):
       - Gỡ bỏ khối header bar "Trao đổi trực tiếp (x)".
       - Mỗi dòng comment: Bỏ avatar hình tròn viết tắt và bỏ nhãn role; chỉ giữ lại `displayName` (in đậm) + tag phiên bản `vX` + ngày giờ.
       - Ràng buộc 1000 ký tự: Thêm `maxLength={1000}` trên textarea, bộ đếm `{commentText.length}/1000`, disable nút submit khi vượt quá và validate trong `useComments.ts` & `commentService.ts`.
    5. Form và Nhiệm vụ rà soát (`features/review-tasks`):
       - Thêm `maxLength={1000}` và bộ đếm `{userNotesInput.length}/1000` cho ô giải trình của người phụ trách trong `TaskRow.tsx`.
       - Thêm `maxLength={1000}` và bộ đếm ký tự cho các textarea "Vấn đề / Rủi ro phát hiện" và "Khuyến nghị sửa đổi của Pháp chế" trong `TaskFormModal.tsx`.
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Backend Vitest**: 13 test suites, **110/110 tests PASS (100%)**.
    - **Backend Build**: `tsc` build PASS (**0 errors**).
    - **Frontend Vitest**: 48 test suites, **285/285 tests PASS (100%)** (+1 test mới).
    - **Frontend Build**: `tsc -b && vite build` PASS (**0 errors**, 2.69s).
    - **Toàn bộ Repo**: **395/395 tests PASS (100%)**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.9: Tích Hợp Logo Thương Hiệu FES, Tra Cứu Spotlight Hồ Sơ Lưu Trữ Archived In-Memory 0ms, Bảng Hợp Đồng Sticky-Scroll & Khung Nhìn Workspace 6:4 Đồng Đều (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    1. Logo thương hiệu chính thức: Thay thế icon chữ CR hình khối xanh bằng logo Food Empire `Logo-fes.png` trên cả màn hình Đăng nhập (`LoginCard.tsx`) và thanh Topbar điều hướng (`AppLayout.tsx`).
    2. Tra cứu Hồ sơ Đã Lưu trữ (Archived Spotlight Search):
       - Bổ sung biểu tượng `Archive` trên Header, nằm ngay bên trái của icon `LogOut`.
       - Hộp thoại Spotlight Popup (`ArchivedSearchModal.tsx`) với ô text input tự động lấy nét (auto-focus).
       - Mô hình tối ưu hóa truy vấn Firestore: Nạp dữ liệu 1 lần duy nhất với `limit(100)` và lưu vào In-Memory TTL Cache (5 phút) trên RAM trình duyệt. Các lần mở modal tiếp theo trong vòng 5 phút tốn **0 Firestore reads**.
       - Bảo mật RBAC: `USER` chỉ nạp hợp đồng do chính mình tạo; `LEGAL`, `HOL`, `ADMIN` nạp hồ sơ hoàn tất trên toàn công ty.
       - Thuật toán `normalizeSearchText`: Khử dấu tiếng Việt chuẩn Unicode NFD (`Đ/đ` -> `D/d`), tìm kiếm tức thì `0ms` trên 4 trường đồng thời (`contractId`, `title`, `supplier`, `description`).
       - Nhấp vào hợp đồng bất kỳ chuyển hướng ngay về `/contracts/:id`.
    3. Thanh cuộn bảng hợp đồng & Bố cục Workspace 6:4 độc lập:
       - Bảng hợp đồng ngoài Main Dashboard: Khung chứa giới hạn chiều cao theo khung nhìn `max-h-[calc(100vh-270px)] overflow-y-auto`; hàng tiêu đề `<thead>` áp dụng `sticky top-0 z-10 bg-slate-50 dark:bg-slate-800` với viền ngăn cách phân tách mờ, chống trôi khi cuộn danh sách dài.
       - Chi tiết hợp đồng (Workspace 6:4): Cố định độ dài của cả 2 cột bằng nhau và bằng tối đa chiều cao khung nhìn người dùng `h-[calc(100vh-210px)] min-h-[550px]`, mỗi cột sở hữu thanh cuộn nội bộ độc lập (`overflow-auto` và `overflow-y-auto`), loại bỏ thanh cuộn thừa ngoài màn hình chính.
    4. Cập nhật tài liệu đặc tả kiến trúc: Bổ sung mục 10.3, 10.4 và 11.3 vào [new_architecture.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/new_architecture.md).
    5. Khắc phục triệt để hiện tượng giật/cuộn xuống cuối trang khi vào Chi tiết Hợp đồng:
       - Trong [`CommentThread.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/comments/components/CommentThread.tsx): Thay thế `scrollIntoView()` (gây kích hoạt cuộn toàn bộ `window` xuống chân trang) bằng việc cuộn nội bộ `messageListRef.current.scrollTop = messageListRef.current.scrollHeight`.
       - Trong [`routes.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/routes.tsx): Thêm component `ScrollToTop` tự động neo vị trí `window.scrollTo(0, 0)` khi chuyển route.
       - Trong [`PlaceholderPages.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/PlaceholderPages.tsx): Thêm `useEffect` trong `ContractDetailView` đảm bảo người dùng luôn luôn nhìn thấy Header, ActionButtons và thông tin tóm tắt ngay ở đỉnh trang khi nạp hồ sơ.
    6. Tinh chỉnh Layout Details Full Viewport Fit, Bỏ Footer, Tiêu đề text-xs & Metric Cards tiếng Anh tinh gọn:
       - Trong [`AppLayout.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/AppLayout.tsx): Xóa bỏ hoàn toàn khối footer bản quyền, giảm padding top/bottom của `<main>`.
       - Trong [`PlaceholderPages.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/PlaceholderPages.tsx): Chuyển cỡ chữ tiêu đề hợp đồng về `text-xs font-bold` (bằng size dòng người tạo), giảm padding thẻ Head xuống `p-3 px-4`, thiết lập chiều cao 2 cột Workspace chuẩn `h-[calc(100vh-165px)]` (bỏ `min-h-[550px]`), toàn bộ màn hình Details vừa khít 100% viewport không còn thanh cuộn ngoài.
       - Trong [`MetricCards.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/MetricCards.tsx): Đổi 4 tựa đề thành `Draft`, `Legal Review`, `Head Review`, `Approved`; bỏ subtitle và footer "Lọc"; giảm padding `p-3.5 sm:p-4`, thẻ card ngắn lại 50% cực kỳ thanh thoát.
       - Cập nhật unit test [`MetricCards.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/MetricCards.test.tsx) (**3/3 tests PASS**).
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Backend Vitest**: 13 test suites, **110/110 tests PASS (100%)**.
    - **Backend Build**: `tsc` build PASS (**0 errors**).
    - **Frontend Vitest**: 50 test suites, **298/298 tests PASS (100%)** (+13 tests mới: `ArchivedSearchModal.test.tsx` 3 tests, `archivedContractService.test.ts` 9 tests, `ContractTable.test.tsx` sticky test).
    - **Frontend Build**: `tsc -b && vite build` PASS (**0 errors**, 2.80s).
    - **Toàn bộ Repo**: **408/408 tests PASS (100%)**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.10: Nâng Cấp Mục Trao Đổi — Unified Chat & Activity Timeline Trái-Phải, System Notification Căn Giữa Gọn Gàng, Nhãn Phiên Bản vX & Tự Động Ghi Nhận Sự Kiện Kèm Lý Do (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    1. Trải nghiệm Chat đối thoại 2 chiều trực quan:
       - **Bên TRÁI (User)**: Ý kiến của người phụ trách/tạo hợp đồng, viền chỉ accent tím (`border-l-4 border-l-purple-500`), avatar & tên người gửi, nhãn phiên bản rút gọn `vX`, thời gian tương đối. Hỗ trợ cả tin nhắn văn bản thông thường lẫn thẻ sự kiện Tải phiên bản mới do User thực hiện.
       - **Bên PHẢI (Legal / Head of Legal)**: Ý kiến của bộ phận Pháp chế & Trưởng phòng, viền chỉ accent xanh dương (`border-r-4 border-r-blue-600`), thông tin người gửi, nhãn phiên bản rút gọn `vX`, thời gian tương đối. Hỗ trợ cả tin nhắn trao đổi lẫn thẻ sự kiện Tải phiên bản mới do Legal/Head thực hiện.
    2. Đơn giản hóa Nhãn Phiên Bản:
       - Trong tất cả các ô chat (cả trao đổi thông thường và tải phiên bản), thay thế cụm từ dài `Phiên bản v2` thành nhãn ngắn gọn, tinh tế `v2` (hoặc `v1`, `v3`...).
    3. Thẻ Tải Lên Phiên Bản (`SYSTEM_VERSION_UPLOAD`):
       - Định vị linh hoạt theo người gửi (Trái nếu là User tải lên, Phải nếu là Legal/Head tải lên).
       - Hiển thị tiêu đề **Tải lên phiên bản vX** và bullet: `• Tóm tắt thay đổi: [Nội dung tóm tắt do người dùng nhập]` (nếu có).
    4. Thẻ Đổi Trạng Thái Hệ Thống Căn Giữa Siêu Gọn (`SYSTEM_STATUS_CHANGE`):
       - Thiết kế như một System Notification nhẹ nhàng, thanh lịch căn giữa màn hình:
         - Không hiển thị tên người thực hiện và không hiển thị phiên bản.
         - Dòng 1: `Đã chuyển sang trạng thái "[Tên Trạng Thái]"` (VD: `💚 Đã chuyển sang trạng thái "Đã phê duyệt (Pháp lý)"`).
         - Dòng 2: `x phút trước` (thời gian tương đối chuẩn tiếng Việt).
         - Dòng 3 (nếu có input từ người dùng): `• Lý do: [Nội dung do Legal hoặc Head nhập]`.
    5. Hộp thoại nhập Lý do yêu cầu chỉnh sửa cho cả Chuyên viên Legal & Trưởng phòng:
       - Trong [`ActionButtons.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/ActionButtons.tsx): Bổ sung ô `textarea` nhập *"Lý do / Hướng dẫn yêu cầu chỉnh sửa"* khi Legal bấm *Yêu Cầu Chỉnh Sửa*, đồng thời chuẩn hóa việc gửi `rejectReason` và `changeSummary` cho cả Legal (`SEND_LEGAL_TASKS`) và Head (`HOL_REJECT_TO_USER`) lên tab Trao Đổi.
    6. Thứ tự hiển thị Mới nhất đến Cũ nhất (Newest-first):
       - Toàn bộ feed sắp xếp theo `createdAt desc`, mở tab là thấy ngay tức thì hoạt động/tin nhắn gần nhất mà không cần cuộn chuột dài.
       - Ô nhập trao đổi (`CommentInput`) giữ cố định ở **DƯỚI ĐÁY** (Bottom-fixed).
    7. Tiện ích Thời gian tương đối chuẩn tiếng Việt (`formatRelativeTime`):
       - Tính toán mượt mà: `vừa xong`, `x phút trước`, `x giờ trước`, `x ngày trước`, `x tháng trước`, `x năm trước`.
       - Gắn kèm thuộc tính hover `title` hiển thị chính xác ngày giờ chi tiết (`DD/MM/YYYY HH:mm`).
    8. Tích hợp Tự động Ghi nhận Sự kiện Hệ thống:
       - Trong [`UploadVersionModal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/UploadVersionModal.tsx): Tự động gọi `addSystemEventComment` khi tải lên phiên bản Word mới.
       - Trong [`useWorkflowActions.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useWorkflowActions.ts): Tự động gọi `addSystemEventComment` mang theo `rejectReason` và `changeSummary` khi chuyển đổi trạng thái duyệt hồ sơ thành công.
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest**: 50 test suites, **309/309 tests PASS (100%)**.
    - **Frontend Build**: `tsc -b && vite build` PASS (**0 errors**, 2.75s).
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.11: Chuẩn Hóa Nhãn Giai Đoạn, Chuyển Đổi Trạng Thái Thành Ô Chat 2 Chiều & Bổ Sung Input Ghi Chú Hành Động (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    1. Giữ nguyên 9 mã enum kỹ thuật trong database & Firestore Rules để đảm bảo an toàn toàn vẹn hệ thống và hiệu năng.
    2. Chuẩn hóa nhãn hiển thị người dùng (UI Labels) sang 5 giai đoạn tinh gọn:
       - `Draft` (`DRAFT`)
       - `Legal Review` (`PENDING_LEGAL` - icon `⚡`)
       - `User Revise` (gom `LEGAL_COMMENTED`, `USER_REVISING`, `HOL_COMMENTED` - icon `⚠️`)
       - `Head Review` (gom `LEGAL_APPROVED`, `PENDING_HOL` - icon `💚`)
       - `Approved` (`HOL_APPROVED` - icon `✅` Checkbox xanh lá) & `Done WeSign` (`COMPLETED` - icon `🎉`)
    3. Chuyển đổi toàn bộ sự kiện chuyển trạng thái thành **Ô Chat 2 chiều (Chat Bubble)**:
       - Không dùng System Notification căn giữa: Toàn bộ sự kiện chuyển trạng thái được tích hợp vào bong bóng chat của chính người thực hiện.
       - Người gửi là User $\rightarrow$ Ô chat bên **TRÁI** (viền tím, avatar, tên User, badge `vX`, thời gian tương đối).
       - Người gửi là Legal/Head $\rightarrow$ Ô chat bên **PHẢI** (viền xanh, avatar, tên Legal/Head, badge `vX`, thời gian tương đối).
       - **Dòng 1**: In đậm `Chuyển tới "[emoji] [Tên trạng thái]"` (VD: `Chuyển tới "⚡ Legal Review"`, `Chuyển tới "✅ Approved"`).
       - **Dòng 2**: Hiển thị nội dung ghi chú người thực hiện nhập vào lúc bấm nút (nếu có; nếu để trống hoặc duyệt không yêu cầu ghi chú thì tự động ẩn để ô chat cực kỳ tinh gọn).
    4. Bổ sung ô nhập ghi chú (Textarea) trong Modal xác nhận của Action Buttons:
       - `Submit Legal` (lần đầu): Ô textarea ghi chú gửi Pháp chế (tùy chọn).
       - `Submit Legal` (nộp lại): Ô textarea tóm tắt nội dung đã sửa đổi.
       - `Submit Head`: Ô textarea ghi chú trình Head (tùy chọn).
       - `Request Change`: Ô textarea lý do yêu cầu sửa đổi (Legal & Head).
       - `Approve`: Không có ô nhập liệu (dòng 2 trong chat bubble ẩn).
    5. Cập nhật tài liệu kiến trúc chuẩn mực: [new_architecture.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/new_architecture.md) (Mục 6.3 & 6.4).
    6. Tinh Chỉnh Câu Chữ & Nhãn Popups/Modals Theo Phản Hồi:
       - Tạo tài liệu kiểm kê 10 popup: [`popup_content_inventory.md`](file:///Users/tindn/.gemini/antigravity/brain/70b330f5-b9b1-4154-9519-83b2bf43beb0/popup_content_inventory.md).
       - Cập nhật [`CreateContractModal.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/CreateContractModal.tsx): Nút nộp `Tạo Hồ Sơ`, nhãn `File hợp đồng định dạng Word *`, ẩn `• Phiên bản v1`, rút gọn placeholder mô tả.
       - Cập nhật [`ActionButtons.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/ActionButtons.tsx): Nhãn `Ghi chú (tuỳ chọn):` cho gửi Legal & trình Head.
       - Cập nhật [`useWorkflowActions.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useWorkflowActions.ts): Rút gọn thông điệp phê duyệt chính thức WeSign.
       - Cập nhật Unit Test [`ActionButtons.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/components/ActionButtons.test.tsx).
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest**: 50 test suites, **311/311 tests PASS (100%)**.
    - **Frontend Build**: `tsc -b && vite build` PASS (**0 errors**, 3.87s).
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.12: Tinh Chỉnh Giao Diện Hộp Thoại Tra Cứu Hồ Sơ Lưu Trữ (ArchivedSearchModal) (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    1. Bỏ dòng "Tìm kiếm tức thì trong bộ nhớ RAM (0ms)" tại thanh thông tin đếm kết quả để giao diện gọn gàng, giữ lại duy nhất số lượng hồ sơ hoàn tất.
    2. Bỏ mô tả phụ "Các hợp đồng đã hoàn tất và lưu trữ trong hệ thống" bên dưới tiêu đề `Tra Cứu Hồ Sơ Lưu Trữ`.
    3. Trong mỗi thẻ hợp đồng: Bỏ badge phiên bản (`vX`), badge lần review (`Lần review thứ X`), và badge trạng thái (`Done WeSign` / `Approved`). Dọn dẹp import `Badge` và `STATUS_CONFIG`.
    4. Đưa tên hợp đồng (`contract.title`) lên cùng hàng với mã hợp đồng (`contract.contractId`) ngay trước icon mở chi tiết, tối ưu layout thẻ hợp đồng thành 2 hàng tinh gọn.
    5. Cập nhật và bổ sung Unit Test chuyên biệt trong [`ArchivedSearchModal.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/ArchivedSearchModal.test.tsx).
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest**: 50 test suites, **312/312 tests PASS (100%)**.
    - **Frontend Build**: `tsc -b && vite build` PASS (**0 errors**).
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.13: Tinh Chỉnh Giao Diện Bảng Danh Sách Main Screen & Màn Hình Chi Tiết Detail Screen (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    1. Main Screen (`ContractTable.tsx`): Bỏ cột *Phiên Bản* (`<th>Phiên Bản</th>` và `<td>v{c.currentVersion}</td>`) để bảng thoáng đãng, rộng rãi hơn cho phần Tiêu đề và Tên đối tác. Thông tin phiên bản vẫn hiển thị đầy đủ bên trong Document Viewer của màn hình chi tiết.
    2. Detail Screen (`PlaceholderPages.tsx`):
       - Bỏ chữ *"Người tạo:"*, chỉ hiển thị tên người tạo kèm icon người dùng (`UserIcon`), tận dụng tính trực quan của icon UI.
       - Đổi nhãn tab *"Nhiệm vụ rà soát"* thành *"Task list"*.
    3. Cập nhật và bổ sung Unit Tests:
       - Cập nhật [`ContractTable.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/components/ContractTable.test.tsx) xác nhận không còn render cột Phiên Bản và các badge `v1`, `v2`.
       - Cập nhật [`routes.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/routes.test.tsx) xác nhận hiển thị tab "Task list" và không còn chứa chữ "Người tạo:".
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest**: 50 test suites, **312/312 tests PASS (100%)**.
    - **Frontend Build**: `tsc -b && vite build` PASS (**0 errors**, 3.87s).
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.14: Cấu Hình Feature Flag Tắt/Bật Notifications Tiết Kiệm Chi Phí DB (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    - Tạm thời tắt tính năng In-App Notifications (Quả chuông thông báo) theo yêu cầu người dùng để tiết kiệm 100% chi phí đọc (Read) và ghi (Write) xuống Firestore với lượng người dùng giai đoạn đầu còn nhỏ.
    - Cung cấp biến cờ bật/tắt (Feature Flag) `true` / `false` trực quan trong source code để người dùng chủ động bật lại bất cứ khi nào cần mà không cần sửa logic.
  - **Phía Backend (`backend/`)**:
    - Tạo mới cấu hình [`features.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/config/features.ts) với `FEATURES.ENABLE_NOTIFICATIONS = false`.
    - Cập nhật [`contractTransitionService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/contractTransitionService.ts): Bỏ qua hoàn toàn việc truy vấn `/users` trong `resolveStaffUids()` và bỏ qua việc ghi vào subcollection `/notifications/{targetUid}/items/` trong transaction khi cờ là `false`.
    - Bổ sung unit tests kiểm thử kiểm tra không gọi `/users` và không tạo notification khi disabled trong [`contractTransitionService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/modules/contracts/contractTransitionService.test.ts) (**111/111 tests PASS**).
  - **Phía Frontend (`frontend/`)**:
    - Tạo mới cấu hình [`features.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/constants/features.ts) với `FEATURE_FLAGS.ENABLE_NOTIFICATIONS = false` và re-export tại master barrel export [`shared/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/index.ts).
    - Cập nhật [`AppLayout.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/components/AppLayout.tsx): Ẩn hoàn toàn icon Quả chuông trên Topbar Header khi cờ là `false`.
    - Cập nhật [`NotificationBell.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/notifications/components/NotificationBell.tsx): Trả về `null` phòng thủ khi cờ là `false`.
    - Cập nhật [`useNotifications.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/notifications/hooks/useNotifications.ts) và [`notificationService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/notifications/services/notificationService.ts): Bỏ qua toàn bộ `onSnapshot` listener và các hàm mark read, trả về `[]` ngay lập tức để tiết kiệm 100% lượt đọc Firestore.
    - Cập nhật unit tests cho `notificationService.test.ts`, `useNotifications.test.tsx`, `NotificationBell.test.tsx` (**315/315 tests PASS**).
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Backend Vitest**: 13 test suites, **111/111 tests PASS (100%)**.
    - **Backend Build**: `tsc` build PASS (**0 errors**).
    - **Frontend Vitest**: 50 test suites, **315/315 tests PASS (100%)**.
    - **Frontend Build**: `tsc -b && vite build` PASS (**0 errors**).
    - **Toàn bộ Repo**: **426/426 tests PASS (100%)**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.15: Cấu Hình Mặc Định Zoom 75% Cho Quick Preview & Document Viewer (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    - Thiết lập mức phóng to/thu nhỏ (Zoom Level) mặc định khi mở xem trước tài liệu văn bản Word (.docx) là `75%` (thay vì 100%) để tài liệu hiển thị vừa vặn, toàn diện nhất trong layout chia cột 6:4 của màn hình chi tiết hợp đồng.
  - **Thực hiện**:
    - Cập nhật [`useDocumentViewer.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/hooks/useDocumentViewer.ts): Khởi tạo mặc định `zoomLevel` là `75`, hỗ trợ tham số `initialZoom: ViewerZoomLevel = 75`.
    - Cập nhật [`DocxViewer.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/DocxViewer.tsx): Khai báo và nhận prop `initialZoom?: ViewerZoomLevel` (mặc định `75`), chuyển vào hook `useDocumentViewer`, hiển thị nhãn `75%`, nút Zoom Out tự động disabled ở cận dưới 75%.
    - Cập nhật Unit Tests trong [`useDocumentViewer.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/hooks/useDocumentViewer.test.tsx) và [`DocxViewer.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/components/DocxViewer.test.tsx): Kiểm tra zoom mặc định 75%, hành vi chặn cận dưới khi zoom out, chuỗi zoom in từng nấc 75% -> 100% -> 125% -> 150% -> 200%, và prop tùy biến `initialZoom`.
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest**: 50 test suites, **317/317 tests PASS (100%)**.
    - **Backend Vitest**: 13 test suites, **111/111 tests PASS (100%)**.
    - **Frontend Build**: `tsc -b && vite build` PASS (**0 errors**).
    - **Backend Build**: `tsc` build PASS (**0 errors**).
    - **Toàn bộ Repo**: **428/428 tests PASS (100%)**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.16: Tối Ưu In-App Document Viewer Sang Direct Storage getBytes(), In-Memory RAM Cache & In-Flight Request Deduplication (Hoàn thành 100% — Chờ Duyệt Manual Test)**:
  - **Mục tiêu & Động lực**:
    - Xóa bỏ hoàn toàn phụ thuộc vào Cloud Function `getSignedDocumentUrl` và nguy cơ rò rỉ token URL công khai vĩnh viễn.
    - Chuyển sang đọc trực tiếp dữ liệu nhị phân (`ArrayBuffer`) từ Firebase Storage CDN thông qua hàm `getBytes()` của Firebase Storage Client SDK.
    - Tích hợp bộ đệm RAM `documentBufferCache` để mở lại file trong 0ms khi chuyển tab, không tốn thêm bandwidth.
    - Tích hợp cơ chế **In-Flight Request Deduplication** (`inFlightRequests` Map): Gom các request tải cùng một file xảy ra đồng thời (hoặc do React StrictMode chạy 2 lần trong dev), đảm bảo **chỉ gửi đúng 1 request mạng duy nhất**.
    - Bổ sung bộ đo hiệu năng `performance.now()` in log trực quan ra Browser Console (`⚡ [DocViewer PERF]`) hiển thị mili-giây, dung lượng byte và trạng thái Cache HIT/MISS.
  - **Thực hiện**:
    - Cập nhật [`storage.rules`](file:///Users/tindn/Documents/Code/ContractReview_firestore/storage.rules): Kiểm tra quyền đọc dựa trên `metadata.createdByUid` (0-read cost) hoặc Staff role, kèm fallback an toàn qua `firestore.get()`.
    - Cập nhật [`storageService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/services/storageService.ts): Viết lại hoàn toàn với `fetchDocumentArrayBuffer()`, `documentBufferCache`, `inFlightRequests` deduplication, bộ đo hiệu năng `performance.now()`, và tương thích ngược `fetchSignedDocumentUrl()`.
    - Cập nhật [`useDocumentViewer.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/hooks/useDocumentViewer.ts): Nạp trực tiếp `docxBuffer` từ `fetchDocumentArrayBuffer`, hàm `downloadFile` tải qua Blob ảo cục bộ.
    - Cập nhật [`contractService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/contracts/services/contractService.ts) & [`taskService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/services/taskService.ts): Bỏ token public, đính kèm `createdByUid: user.uid` khi tải lên tệp tin Word mới hoặc bản sửa đổi.
    - Cập nhật Unit Tests trong [`storageService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/services/storageService.test.ts) và [`useDocumentViewer.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/document-viewer/hooks/useDocumentViewer.test.tsx).
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Document Viewer Tests**: 6 test suites, **38/38 tests PASS (100%)**.
    - **Frontend Vitest Toàn Bộ**: 50 test suites, **321/321 tests PASS (100%)**.
    - **Backend Vitest**: 13 test suites, **111/111 tests PASS (100%)**.
    - **Toàn Repo**: **432/432 tests PASS (100%)**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.17: Phase 2 — Củng Cố Security Rules Cho State Machine & Cross-User Notifications (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    - Thiết lập nền tảng bảo mật vững chắc ở cấp độ Database trước khi chuyển đổi logic chuyển trạng thái State Machine sang Client-First Direct (`writeBatch`).
    - Củng cố kiểm soát chuyển trạng thái dựa trên RBAC và bảo vệ tính bất biến của các trường định danh chủ sở hữu (`createdBy.uid`) và mã hợp đồng (`contractId`).
    - Hỗ trợ tạo thông báo quả chuông chéo (`cross-user notification`) giữa các thành viên khi có sự kiện luân chuyển hồ sơ hoặc phản hồi nhiệm vụ.
  - **Thực hiện (Ủy quyền Subagent `firestore-rules-author`)**:
    - Bổ sung helper function `isValidTransition(fromStatus, toStatus, role, isOwner)` trong [`firestore.rules`](file:///Users/tindn/Documents/Code/ContractReview_firestore/firestore.rules):
      - **USER** (`isOwner`): `DRAFT` $\rightarrow$ `PENDING_LEGAL`, `USER_REVISING` / `LEGAL_COMMENTED` / `HOL_COMMENTED` $\rightarrow$ `PENDING_LEGAL`, `HOL_APPROVED` $\rightarrow$ `COMPLETED`.
      - **LEGAL**: `PENDING_LEGAL` $\rightarrow$ `USER_REVISING` (Yêu cầu sửa), `PENDING_LEGAL` $\rightarrow$ `PENDING_HOL` (Trình phê duyệt).
      - **HOL**: `PENDING_HOL` $\rightarrow$ `USER_REVISING` (Từ chối/Yêu cầu sửa), `PENDING_HOL` $\rightarrow$ `HOL_APPROVED` (Phê duyệt).
    - Cập nhật quy tắc `allow update` tại `/contracts/{contractId}` tách biệt 2 luồng:
      - **Trường hợp A (Metadata updates thông thường)**: Giữ nguyên `status`, bảo vệ `createdBy.uid`, và cho phép chỉnh sửa metadata theo trạng thái/vai trò tương ứng.
      - **Trường hợp B (Direct State Transition)**: Khi `status` thay đổi, bắt buộc phải thỏa mãn ma trận `isValidTransition(...)` và bảo vệ tính bất biến tuyệt đối của cả `createdBy.uid` và `contractId`.
    - Cập nhật quy tắc `allow create` tại `/notifications/{userId}/items/{notifId}`:
      - Cho phép bất kỳ thành viên được whitelist (`isWhitelisted()`) tạo thông báo in-app cho người dùng khác khi có `contractId` hợp lệ.
      - Giữ nguyên bảo vệ hòm thư cá nhân: chỉ chủ sở hữu (`request.auth.uid == userId`) mới có quyền đọc, đánh dấu đã đọc (`update`), hoặc xoá thông báo của chính mình.
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest Toàn Bộ**: 50 test suites, **321/321 tests PASS (100%)**.
    - **Backend Vitest**: 13 test suites, **111/111 tests PASS (100%)**.
    - **Toàn Repo**: **432/432 tests PASS (100%)**.
    - **Type Check**: Cả Frontend và Backend `tsc` PASS (**0 errors**).
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.18: Phase 3 — Chuyển Đổi executeStatusTransition sang writeBatch & Dọn Dẹp Cloud Functions (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    - Hoàn tất giai đoạn cuối cùng trong đợt chuyển đổi kiến trúc sang **Client-First Direct** (Frontend $\leftrightarrow$ Firestore & Storage trực tiếp).
    - Loại bỏ hoàn toàn độ trễ cold-start Cloud Functions (1.5–3s $\rightarrow$ <50ms) cho các thao tác chuyển đổi trạng thái hồ sơ hàng ngày.
    - Đảm bảo tính toàn vẹn dữ liệu tuyệt đối bằng cách gom 4 thao tác ghi thành 1 giao dịch nguyên tử `writeBatch(db)`.
    - Dọn dẹp sạch sẽ các Cloud Functions đã bị thay thế để tối ưu chi phí hạ tầng và hạn ngạch tài nguyên.
  - **Thực hiện**:
    - Tái cấu trúc [`taskService.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/services/taskService.ts):
      - Triển khai `executeStatusTransition` sử dụng `writeBatch(db)` gom 4 thao tác nguyên tử:
        1. Cập nhật `contracts/{id}`: `status`, `updatedAt`, `rejectCount` (tăng khi chuyển sang `USER_REVISING`), cập nhật tên file duyệt khi chuyển sang `HOL_APPROVED`.
        2. Nếu `HOL_APPROVED`: cập nhật doc phiên bản tương ứng trong subcollection `versions/v{currentVersion}` (`isApprovedVersion: true`).
        3. Ghi audit trail bất biến vào `contracts/{id}/activities` (`action: 'STATUS_CHANGE'`, `performedBy`, `details`, `timestamp`).
        4. Ghi thẻ bong bóng chat hệ thống vào `contracts/{id}/comments` (`type: 'SYSTEM_STATUS_CHANGE'`, icon, nhãn trạng thái, lý do/ghi chú).
        5. Ghi thông báo in-app vào `notifications/{targetUid}/items` nếu bật cờ thông báo hoặc có người nhận hợp lệ.
      - Tách nhỏ các helper hàm con tuân thủ nguyên tắc SRP $\le$ 25 dòng (`buildContractUpdates`, `queueActivityAndComment`, `queueTransitionNotification`, `getStatusEventIcon`).
      - Bổ sung bộ đo hiệu năng `performance.now()` in log trực quan ra Browser Console (`⚡ [Workflow PERF] writeBatch() hoàn tất trong X ms`).
      - Duy trì 100% tương thích chế độ Mock Dev offline (`isMockDevEnvironment()`).
    - Tinh giản [`useWorkflowActions.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useWorkflowActions.ts):
      - Loại bỏ hàm gọi lẻ `addSystemEventComment(...)` riêng biệt, tránh nguy cơ dữ liệu không đồng bộ khi lỗi mạng.
      - Xóa bỏ các import thừa (`STATUS_CONFIG`, `addSystemEventComment`).
    - Dọn dẹp [`backend/src/index.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/index.ts):
      - Gỡ bỏ export 2 Cloud Functions bị thay thế: `transitionContractStatus` và `getSignedDocumentUrl`.
      - Giữ nguyên các hàm thiết yếu: `healthCheck`, `onUserDocWrite`, `deleteContract`, `analyzeContractAI`, `sendContractEmail`.
    - Cập nhật Unit Tests:
      - Cập nhật [`taskService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/services/taskService.test.ts): Bổ sung test suite kiểm thử toàn diện `writeBatch` cho cả chế độ Mock Dev và môi trường thực tế.
      - Cập nhật [`useWorkflowActions.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/review-tasks/hooks/useWorkflowActions.test.tsx): Cập nhật signature gọi hàm mới.
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest Toàn Bộ**: 50 test suites, **324/324 tests PASS (100%)**.
    - **Frontend TypeScript Build (`tsc --noEmit`)**: **0 errors**.
    - **Frontend Vite Bundle (`vite build`)**: **0 errors** (built in 3.46s).
    - **Backend Vitest Toàn Bộ**: 13 test suites, **111/111 tests PASS (100%)**.
    - **Backend TypeScript Build (`tsc`)**: **0 errors**.
    - **Tổng số tests toàn Repo**: **435/435 tests PASS (100%)**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.19: Nâng Cấp Tài Liệu Tham Chiếu Đính Kèm — Multi-Files Upload, Giới Hạn 10 Tệp/Case & Dung Lượng ≤ 5MB, Xem Trực Tiếp Trên Tab Mới (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    1. Cho phép người dùng chọn và tải lên nhiều tệp cùng lúc (Multi-file pick & drop).
    2. Ràng buộc bảo vệ dữ liệu 2 lớp (Client & Hook): Giới hạn tối đa 10 tệp tham chiếu cho mỗi hồ sơ hợp đồng CR; giới hạn dung lượng mỗi tệp không quá 5MB (`MAX_REF_FILE_SIZE_BYTES = 5MB`, `MAX_REF_FILES_PER_CONTRACT = 10`).
    3. Trải nghiệm xem trực tiếp tiện lợi (In-browser preview): Thay vì bắt buộc phải tải tệp xuống máy tính mới xem được, khi người dùng click vào dòng tệp tin / tên tệp hoặc nút hành động `ExternalLink`, trình duyệt tự động mở tệp trên tab mới (`_blank`) xem nội dung trực tiếp, đồng thời giữ nguyên nút Tải xuống và Xóa.
  - **Kiến trúc & Kỹ thuật**:
    - **Tầng Dữ liệu & Service (`features/reference-files/services/refFileService.ts`)**:
      - Bổ sung bộ đệm RAM `referenceBufferCache` (Map in-memory key `${contractId}:${storagePath}`) nạp nhị phân trực tiếp bằng `getBytes(fileRef)` qua Firebase Storage Client SDK, cam kết bảo mật 100% theo `storage.rules` và không lộ public link.
      - Xây dựng hàm `getReferenceFileViewUrl(contractId, storagePath, mimeType, fileName)`: Hỗ trợ tự động sinh blob URL chuẩn native cho PDF, ảnh và văn bản; nạp 0ms khi đọc từ RAM cache; hỗ trợ offline mock dev mode.
    - **Tầng Logic & Hook (`features/reference-files/hooks/useReferenceFiles.ts`)**:
      - Xây dựng hàm `validateFilesForUpload` độc lập tuân thủ nguyên tắc SRP $\le$ 25 dòng: Kiểm tra số lượng tệp hiện có + số tệp mới $\le 10$, kiểm tra kích thước từng tệp $\le 5$MB, thông báo lỗi tiếng Việt tường minh.
      - Bổ sung `uploadFiles(files: File[])` hỗ trợ tải tuần tự có thông báo tiến độ và `openFileInNewTab(file)` bảo vệ chống browser popup blocker.
    - **Tầng Giao diện (`features/reference-files/components/`)**:
      - [`UploadRefDropzone.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/components/UploadRefDropzone.tsx): Thêm thuộc tính `multiple` cho `<input type="file" />`, kéo thả nhiều tệp, vô hiệu hóa và cảnh báo màu hổ phách khi hồ sơ đã đạt tối đa 10 tệp, hiển thị subtitle `Tối đa 10 tệp/hồ sơ (≤ 5MB/tệp)`.
      - [`RefFileRow.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/components/RefFileRow.tsx): Thiết kế vùng tên tệp có con trỏ pointer và hiệu ứng hover link, click mở tab mới; bổ sung nút `ExternalLink` ("Mở xem trong tab mới") cạnh nút Download và Delete.
      - [`RefFileList.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/components/RefFileList.tsx): Truyền `currentFileCount={files.length}`, cập nhật thanh tiêu đề `${totalCount}/10 tệp • Tối đa 5MB/tệp`.
    - **Kiểm thử Unit Tests**:
      - Tạo mới [`UploadRefDropzone.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/components/UploadRefDropzone.test.tsx) (5 unit tests).
      - Tạo mới [`RefFileRow.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/components/RefFileRow.test.tsx) (5 unit tests).
      - Mở rộng [`useReferenceFiles.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/hooks/useReferenceFiles.test.tsx) (+4 unit tests) và [`refFileService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/reference-files/services/refFileService.test.ts) (+3 unit tests).
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest Toàn Bộ**: 52 test suites, **341/341 tests PASS (100%)** (+17 tests mới).
    - **Frontend TypeScript Build (`tsc -b`)**: **0 errors**.
    - **Frontend Vite Bundle (`vite build`)**: **0 errors** (built in 2.72s).
    - **Backend Vitest Toàn Bộ**: 13 test suites, **111/111 tests PASS (100%)**.
    - **Tổng số tests toàn Repo**: **452/452 tests PASS (100%)**.
- [x] **Bước 5.20: Cấu Hình Feature Flags Tắt/Bật Trợ Lý AI (Gemini) & Gửi Email (SMTP), Làm Mờ Nút Tab & Hướng Dẫn Bật/Tắt (FEATURE_FLAGS_GUIDE.md) (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    1. Tiết kiệm 100% chi phí Token/API của Gemini AI và loại bỏ phụ thuộc vào cấu hình Gmail SMTP App Password trong giai đoạn kiểm thử nghiệm thu các luồng nghiệp vụ cốt lõi.
    2. Cung cấp biến cờ `ENABLE_AI = false` và `ENABLE_EMAIL = false` tập trung tại 2 file cấu hình `features.ts` (Frontend & Backend).
    3. Trải nghiệm người dùng trực quan (Enterprise UI): Khi `ENABLE_AI` là `false`, nút Tab *Trợ lý AI* trên thanh điều hướng chi tiết hồ sơ bị làm mờ (`opacity-40`), có tooltip cảnh báo, nhãn đổi thành `Trợ lý AI (Tạm tắt)`, con trỏ chuột hiện biểu tượng cấm `cursor-not-allowed`, cấm hoàn toàn hành vi click đổi tab.
    4. Cơ chế phòng thủ 2 lớp (Defense-in-depth):
       - Frontend: Khóa `useAIEngine` không tự động query, hàm `triggerAIAnalysis` ném lỗi thân thiện; `AIAssistantPanel` hiển thị thẻ thông báo tính năng tạm tắt nếu được mount.
       - Backend: Cloud Functions `analyzeContractAI` và `sendContractEmail` kiểm tra cờ ở dòng đầu tiên, ném lỗi `failed-precondition` nếu bị gọi lén.
    5. Tạo tài liệu hướng dẫn nhanh: Soạn thảo [`FEATURE_FLAGS_GUIDE.md`](file:///Users/tindn/Documents/Code/ContractReview_firestore/FEATURE_FLAGS_GUIDE.md) giải thích cặn kẽ cách bật lại từng tính năng (`Notifications`, `AI`, `Email`) kèm biến môi trường cần thiết.
  - **Thực hiện**:
    - **Backend (`backend/src/config/features.ts`)**: Bổ sung `ENABLE_AI: false`, `ENABLE_EMAIL: false`.
    - **Backend Functions (`analyzeContractAI.ts` & `sendContractEmail.ts`)**: Thêm guard chặn gọi khi flag tương ứng là `false`.
    - **Frontend Config (`frontend/src/shared/constants/features.ts`)**: Bổ sung `ENABLE_AI: false`, `ENABLE_EMAIL: false`.
    - **Frontend Tab Bar (`PlaceholderPages.tsx`)**: Đọc cờ `FEATURE_FLAGS.ENABLE_AI`, gán `disabled`, styling `opacity-40 cursor-not-allowed select-none`, nhãn `Trợ lý AI (Tạm tắt)`, và chỉ mount `AIAssistantPanel` khi cờ là `true`.
    - **Frontend Panel & Service (`AIAssistantPanel.tsx`, `aiService.ts`, `useAIEngine.ts`)**: Bổ sung fallback thông báo tạm tắt và chặn hoàn toàn mọi network call phân tích.
    - **Unit Tests**:
      - Tạo mới [`backend/src/config/features.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/config/features.test.ts) (3 tests).
      - Tạo mới [`frontend/src/shared/constants/features.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/constants/features.test.ts) (3 tests).
      - Cập nhật [`AIAssistantPanel.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/components/AIAssistantPanel.test.tsx), [`useAIEngine.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/hooks/useAIEngine.test.tsx), [`aiService.test.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/features/ai-assistant/services/aiService.test.ts), và [`routes.test.tsx`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/app/routes.test.tsx).
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest Toàn Bộ**: 53 test suites, **348/348 tests PASS (100%)** (+7 tests mới).
    - **Backend Vitest Toàn Bộ**: 14 test suites, **114/114 tests PASS (100%)** (+3 tests mới).
    - **TypeScript Build**: `tsc` (Backend) & `tsc -b && vite build` (Frontend) đều **0 errors**.
    - **Tổng số tests toàn Repo**: **462/462 tests PASS (100%)**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.21: Kích Hoạt Persistent Local Cache (IndexedDB Đa Tab) Cho Firestore Client SDK — Bảo Vệ Quota Spark 50k Reads & Chống Hao Phí F5 (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    1. Chuẩn bị cho việc vận hành trên gói Spark Plan (0đ, không cần thẻ tín dụng) với hạn mức 50,000 document reads/ngày.
    2. Triệt tiêu hao phí reads khi người dùng F5 hoặc mở nhiều tab làm việc đồng thời: Firestore SDK tự động đọc dữ liệu từ IndexedDB cục bộ của máy tính cá nhân trong 0ms.
    3. Bảo đảm tính tươi mới (Freshness) của dữ liệu: Phối hợp hoàn hảo với cơ chế Realtime Listener `onSnapshot` qua luồng WebSocket ngầm; khi server có cập nhật mới, dữ liệu tự động đồng bộ xuống trong <30ms mà không bị kẹt ở bản cũ.
  - **Kiến trúc & Kỹ thuật**:
    - **Frontend Shared Service (`frontend/src/shared/services/firebaseClient.ts`)**:
      - Tích hợp `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`.
      - Xây dựng hàm `createFirestoreInstance(app)` với cơ chế fallback tự động về `getFirestore(app)` nếu instance đã khởi tạo hoặc trong môi trường không có IndexedDB (như Node/JSDOM).
    - **Kiểm thử Unit Tests (`frontend/src/shared/services/firebaseClient.test.ts`)**:
      - Bổ sung mock cho `initializeFirestore`, `persistentLocalCache`, `persistentMultipleTabManager`.
      - Viết unit tests kiểm tra khởi tạo Firestore với cấu hình multi-tab persistent cache và kiểm tra fallback an toàn (+2 tests mới).
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest Toàn Bộ**: 53 test suites, **350/350 tests PASS (100%)** (+2 tests mới).
    - **Frontend TypeScript Build (`tsc -b`)**: **0 errors**.
    - **Frontend Vite Bundle (`vite build`)**: **0 errors** (built in 2.84s).
    - **Backend Vitest Toàn Bộ**: 14 test suites, **114/114 tests PASS (100%)**.
    - **Tổng số tests toàn Repo**: **464/464 tests PASS (100%)**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.22: Triển Khai Cơ Chế Phân Quyền Lai (Hybrid RBAC) — Hỗ Trợ 100% Spark Plan (0đ) & Tự Động Tương Thích Blaze Sau Này (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    1. Cho phép hệ thống phân quyền (USER, LEGAL, HOL) và kiểm soát truy cập (Whitelist) vận hành độc lập, trơn tru trên gói Spark Plan (0đ, không cần Cloud Functions).
    2. Đảm bảo tính tương thích xuôi (Forward-Compatible): Tự động ưu tiên Custom Claims (0-read) nếu có sau này trên Blaze Plan; tự động fallback đọc trực tiếp doc `/users/{uid}` nếu chưa có Claims.
    3. Bảo vệ an toàn dữ liệu: Tuyệt đối cấm client ghi đè doc `/users/{uid}` trên Security Rules (`allow write: if false;`), ngăn chặn 100% nguy cơ leo thang đặc quyền (Privilege Escalation).
  - **Kiến trúc & Kỹ thuật**:
    - **Firestore Security Rules (`firestore.rules`)**:
      - Ủy quyền cho specialist subagent `firestore-rules-author` cập nhật hàm `isWhitelisted()` và `getRole()`.
      - Ưu tiên 1: Đọc Custom Claims trong JWT (`'role' in request.auth.token` và `token.isActive == true`) tốn 0 document reads.
      - Fallback 2: Đọc trực tiếp từ doc `/users/{uid}` (`hasUserDoc()` và `getUserDoc().isActive == true`).
    - **Storage Security Rules (`storage.rules`)**:
      - Cập nhật hàm `isWhitelisted()` và `isStaff()` sử dụng cross-service `firestore.exists()` và `firestore.get()` hỗ trợ đọc file Word `.docx` và file tham chiếu trên Spark Plan.
    - **Frontend Auth Service (`features/auth/services/authService.ts`)**:
      - Xây dựng hàm `fetchUserDocClaims(uid, dbInstance)` đọc doc `/users/{uid}` khi token chưa có Custom Claims.
      - Nâng cấp `fetchClaimsWithRetry` tích hợp tự động cơ chế Fallback Spark Plan.
      - Xuất `fetchUserDocClaims` tại barrel export `features/auth/index.ts`.
    - **Kiểm thử Unit Tests (`features/auth/services/authService.test.ts`)**:
      - Thêm 5 unit tests mới: kiểm tra fallback đọc Firestore doc khi token không có claims, doc tồn tại và active, doc không tồn tại (not whitelisted), doc bị khóa (isActive: false), và xử lý lỗi mạng an toàn.
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest Toàn Bộ**: 53 test suites, **355/355 tests PASS (100%)** (+5 tests mới).
    - **Backend Vitest Toàn Bộ**: 14 test suites, **114/114 tests PASS (100%)**.
    - **TypeScript Build**: `tsc` (Backend) & `tsc -b && vite build` (Frontend) đều **0 errors**.
    - **Tổng số tests toàn Repo**: **469/469 tests PASS (100%)**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.23: Chuyển Đổi Sang Inline Task List Form (Khung Vàng Nhập Liệu Trực Tiếp), Nút Icon Tinh Gọn, Thu Gọn Tất Cả & Batch Save Toàn Diện Cho Cả Legal/HOL và User Revising (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    1. **Loại bỏ hoàn toàn Popup Modal che khuất**: Thay vì mở dialog modal chắn giữa màn hình làm mờ tài liệu, chuyển đổi form tạo mới/chỉnh sửa điều khoản thành **khung vàng trực tiếp (Inline Task Card)** ngay trong tab Task List.
    2. **Đảm bảo thao tác song song (Split-Pane Multitasking)**: Chuyên viên Pháp chế và Trưởng phòng có thể tự do cuộn chuột, zoom và đọc từng câu chữ hợp đồng ở khung `DocxViewer` bên trái, đồng thời điền trực tiếp nội dung điều khoản, rủi ro và khuyến nghị vào khung vàng bên phải.
    3. **Thiết kế nút icon tinh gọn (Icon-Only UI)**:
       - Thay thế nút chữ cũ bằng **Icon `➕`** nhỏ gọn, hiện đại ở góc trên bên phải (dành cho Legal & HOL).
       - Bổ sung **Icon `💾` (Lưu)** ngay bên trái nút `➕`: hiển thị cho cả Legal/HOL và User Revising; hiển thị trạng thái mờ (disabled) khi không có thay đổi; tự động sáng lên nổi bật kèm hiệu ứng khi có thay đổi chưa lưu.
    4. **Nút Thu gọn / Mở rộng tất cả (Collapse / Expand All)**:
       - Bổ sung nút `[↕ Thu gọn / Mở rộng]` ở bên phải của tab "Đã phản hồi", áp dụng cho **tất cả các vai trò (`USER`, `LEGAL`, `HOL`) và mọi giai đoạn**.
       - Thu gọn tất cả thẻ điều khoản thành thanh tiêu đề gọn gàng để xem nhanh toàn bộ danh mục điều khoản mà không cần cuộn trang.
    5. **Cơ chế Batch Save và Màu Tone Hồng Đỏ Cho User Revising**:
       - Ở giai đoạn `USER_REVISING`, người dùng gõ giải trình hoặc chọn *"Đã sửa"* / *"Bỏ qua"* chỉ lưu trên local state.
       - Nút **"Bỏ qua (Waived)"** chuyển sang **tone hồng đỏ** (`rose-600` khi chọn, pastel `rose-50/text-rose-700` khi chưa chọn), tạo độ tương phản cực kỳ rõ nét với nút **"Đã sửa (Resolved)"** màu xanh ngọc (`emerald-600`).
       - Bấm **`💾`** sẽ gom lưu toàn bộ giải trình của User về Firestore trong **1 request `writeBatch` duy nhất** (tiết kiệm quota, không ghi rời rạc từng task).
       - Nếu User quên bấm Lưu mà bấm *"Submit Legal"*, hệ thống tự động gom lưu an toàn trước khi nộp lại cho Pháp chế. Khi không có thay đổi mới, tuyệt đối không gửi task cũ nào (0-write thừa).
  - **Kiến trúc & Triển khai**:
    - **Component `TaskDraftCard.tsx` (`features/review-tasks/components/TaskDraftCard.tsx`)**: Render thẻ viền vàng nhập liệu trực tiếp, hỗ trợ dropdown category, input clauses, textarea rủi ro, textarea khuyến nghị, trash icon hủy nháp.
    - **Nâng cấp `TaskRow.tsx` (`features/review-tasks/components/TaskRow.tsx`)**: Hỗ trợ controlled expansion `isControlledExpanded`, nút Bỏ qua tone hồng đỏ, nút Đã sửa tone xanh ngọc, và `onUpdatePendingResponse` cho User Revising.
    - **Nâng cấp `useTaskList.ts` (`features/review-tasks/hooks/useTaskList.ts`)**: Quản lý `draftTasks`, `editingTasks`, `pendingResponses`, `unsavedCount`, `hasUnsavedChanges`, và `saveAllChanges` batch commit.
    - **Cập nhật `TaskMatrix.tsx` (`features/review-tasks/components/TaskMatrix.tsx`)**: Tích hợp nút Thu gọn tất cả, nút `💾` Save cho cả Legal/HOL và User Revising, icon `➕` cho Legal/HOL, và render `TaskDraftCard` inline.
    - **Kiểm thử Unit Tests**: Tạo mới `TaskRow.test.tsx` (5 tests), `TaskDraftCard.test.tsx` (4 tests), mở rộng `TaskMatrix.test.tsx` (9 tests), mở rộng `useTaskList.test.tsx` (9 tests), mở rộng `taskService.test.ts` (11 tests).
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest Toàn Bộ**: 55 test suites, **375/375 tests PASS (100%)** (+20 tests mới).
    - **Backend Vitest Toàn Bộ**: 14 test suites, **114/114 tests PASS (100%)**.
    - **TypeScript & Vite Build**: `tsc -b && vite build` **0 errors** (built in 3.64s).
    - **Tổng số tests toàn Repo**: **489/489 tests PASS (100%)**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.25: Khắc Phục Lỗi Quyền Hạn Khi Head of Legal Phê Duyệt (`HOL_APPROVED`) & Gia Cố `firestore.rules` (Hoàn thành 100%)**:
  - **Mục tiêu & Vấn đề xử lý**:
    1. Khi Head of Legal (HOL) bấm *"Approve"* hồ sơ ở trạng thái `PENDING_HOL`, hệ thống ném ngoại lệ `FirebaseError: PERMISSION_DENIED: evaluation error at L204:24 for 'update' @ L204, false for 'update' @ L259...`.
    2. Nguyên nhân 1: `firestore.rules` cấm triệt để `allow update: if false;` trên subcollection `/contracts/{contractId}/versions/{versionId}`, trong khi `taskService.ts` cần ghi đè `batch.set(versionRef, { fileName: '..._approved.docx', isApprovedVersion: true }, { merge: true })` lên phiên bản văn bản hiện có.
    3. Nguyên nhân 2: Hàm `getRole()` và `isWhitelisted()` trong `firestore.rules` bị lỗi runtime CEL evaluation error khi token JWT của tài khoản test chưa có Custom Claim và phải fallback sang đọc `/users/{uid}`.
    4. Nguyên nhân 3: Subcollection `/comments/{commentId}` thiếu kiểm tra cấu trúc `'author' in request.resource.data && ('uid' in request.resource.data.author)` trước khi đối chiếu UID.
  - **Kỹ thuật & Cải tiến đã thực hiện**:
    - **Ủy quyền cho specialist subagent `firestore-rules-author`**:
      - Gia cố `getRole()` kiểm tra an toàn `hasUserDoc() && ('role' in getUserDoc()) ? getUserDoc().role : 'USER'` khi fallback, loại bỏ 100% rủi ro evaluation error.
      - Mở quyền `update` trên `/versions/{versionId}` cho `isStaff()` nhưng khóa chặt bằng `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['fileName', 'isApprovedVersion'])`, duy trì tính bất biến của mọi trường dữ liệu khác.
      - Gia cố kiểm tra an toàn cấu trúc `author.uid` trên `comments` subcollection.
    - **Đồng bộ hóa Emulators Seed**:
      - Chạy lại seed script `npm run seed --prefix backend`, đảm bảo tài khoản `head.legal@foodempire.vn` có đầy đủ Custom Claims `role: 'HOL'`, `isActive: true` trong Firebase Auth Emulator và document tương ứng tại Firestore `/users/head_of_legal_01`.
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest Toàn Bộ**: 55 test suites, **375/375 tests PASS (100%)**.
    - **Backend Vitest Toàn Bộ**: 14 test suites, **114/114 tests PASS (100%)**.
    - **TypeScript & Vite Build**: `tsc` cả backend và frontend **0 errors**, Vite build **0 warnings** (built in 2.65s).
    - **Tổng số tests toàn Repo**: **489/489 tests PASS (100%)**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [x] **Bước 5.26: Tích Hợp Hệ Thống Automated Testing Cho Firestore Security Rules (`@firebase/rules-unit-testing`) — Tự Động Hóa 100% Phát Hiện Lỗi Phân Quyền (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    1. **Triệt tiêu khoảng trống kiểm thử (Testing Blind Spot)**: Trước đây, Frontend Vitest mock Firestore SDK (`vi.mock('firebase/firestore')`) và Backend Vitest chỉ test TypeScript logic thuần túy hoặc chạy qua Firebase Admin SDK (bỏ qua Security Rules). Do đó các lỗi cú pháp CEL, vi phạm phân quyền RBAC và batch update chỉ lộ diện khi manual test trên trình duyệt.
    2. **Tự động hóa 100% việc bắt lỗi quyền hạn**: Sử dụng bộ thư viện chính thức `@firebase/rules-unit-testing` từ Google Firebase team để nạp trực tiếp file `firestore.rules` thật vào Firestore Emulator và kiểm thử mọi ma trận quyền (USER, LEGAL, HOL, unauthenticated).
    3. **Tách biệt hiệu năng kiểm thử**: Bộ `npm test` giữ nguyên tốc độ siêu tốc (<1.5s) cho 489 tests Frontend & Backend mock; bổ sung script `npm run test:rules` riêng cho các kịch bản kiểm thử phân quyền sâu kết nối trực tiếp Emulator.
  - **Kiến trúc & Triển khai**:
    - **Cài đặt thư viện**: Bổ sung `@firebase/rules-unit-testing` vào `backend/package.json` và cấu hình script `test:rules` ở cả root và backend.
    - **Cấu hình Vitest Resolver (`backend/vitest.config.ts`)**: Thêm alias CJS giải quyết lỗi import ESM nội bộ của `@firebase/rules-unit-testing`.
    - **Test Helper (`backend/src/rules/rulesTestHelper.ts`)**:
      - Khởi tạo `initializeTestEnvironment` nạp trực tiếp file `firestore.rules` của repository vào Firestore Emulator (`127.0.0.1:8080`).
      - Cung cấp các helpers giả lập ngữ cảnh xác thực với custom claims (`USER`, `LEGAL`, `HOL`, unauthenticated) và sanitize type-safe token options.
      - Hỗ trợ `setAdminDoc` qua `withSecurityRulesDisabled` để setup dữ liệu mẫu an toàn.
    - **Test Suite (`backend/src/rules/firestore.rules.test.ts`)**:
      - **Suite 1: Whitelist & Authentication Checks** (3 tests): Chặn khách vãng lai chưa đăng nhập, chặn tài khoản bị khóa `isActive: false`, cho phép tài khoản whitelist active đọc doc `/users`.
      - **Suite 2: State Machine 9-Status Transitions & RBAC Matrix** (9 tests): Chỉ USER tạo hồ sơ `DRAFT`, cấm tạo status khác; chỉ chủ hồ sơ mới được nộp `PENDING_LEGAL`; Legal duyệt `PENDING_HOL`, cấm Legal duyệt thẳng `HOL_APPROVED`; Head of Legal phê duyệt `HOL_APPROVED` và trả về `USER_REVISING`; chỉ chủ hồ sơ hoàn tất `COMPLETED`.
      - **Suite 3: Subcollection `/versions` Permissions & Immutability** (3 tests): Cho phép Staff update `isApprovedVersion` và `fileName` khi HOL phê duyệt; cấm thay đổi các trường bất biến (`storagePath`, `versionNo`); cấm mọi user xóa version doc.
      - **Suite 4: Subcollection `/comments` Authenticity & Immutability** (3 tests): Cho phép tạo comment khi `author.uid` khớp `auth.uid`; cấm mạo danh tạo comment; cấm update và delete comment.
      - **Suite 5: HOL Approve writeBatch Real World Simulation** (1 test): Tái hiện 100% logic `writeBatch` nguyên tử 4-trong-1 của `taskService.ts` (cập nhật hợp đồng, đánh dấu version approved, ghi audit log, ghi comment hệ thống) chạy mượt mà không gặp lỗi `PERMISSION_DENIED`.
    - **Đảm bảo tính Hermetic cho Frontend (`frontend/src/test/setup.ts`)**:
      - Cấu hình `(import.meta.env as Record<string, string>).VITE_USE_EMULATORS = 'false'` trong test setup, đảm bảo toàn bộ 55 suites frontend chạy hoàn toàn độc lập, cách ly tuyệt đối với trạng thái dữ liệu của Emulator cục bộ.
  - **Kết quả Kiểm thử Toàn Diện**:
    - **Frontend Vitest Toàn Bộ**: 55 test suites, **375/375 tests PASS (100%)**.
    - **Backend Unit Tests Toàn Bộ**: 14 test suites, **114/114 tests PASS (100%)**.
    - **Security Rules Integration Tests (`test:rules`)**: 1 test suite (5 sub-suites), **19/19 tests PASS (100%)**.
    - **Tổng số tests toàn Repo**: **508/508 tests PASS (100%)**.
    - **TypeScript Typecheck & Build**: `tsc` (Backend) & `tsc -b && vite build` (Frontend) đều **0 errors** (Bundle hoàn thành trong 2.84s).
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

---

## 🎯 TỔNG KẾT GIAI ĐOẠN REFACTOR CLIENT-FIRST DIRECT (PHASE 1 - 2 - 3)

| Tiêu Chí | Kiến Trúc Cũ (Cloud Functions) | Kiến Trúc Mới (Client-First Direct) | Cải Thiện |
|---|---|---|---|
| **Xem file Word (.docx)** | Signed URL qua Cloud Function (1.5 - 3.0s) | `getBytes()` trực tiếp + RAM Cache (0.0 - 35ms) | **Nhanh gấp 50 - 100 lần**, 0đ Firestore |
| **Chuyển trạng thái State Machine** | Callable Cloud Function (1.2 - 2.5s) | Direct Firestore `writeBatch` (20 - 50ms) | **Nhanh gấp 30 - 50 lần**, nguyên tử 4-in-1 |
| **Bảo vệ toàn vẹn dữ liệu** | Phụ thuộc code server Cloud Functions | Củng cố chặt chẽ ở cấp độ `firestore.rules` | Bảo mật tuyệt đối, RBAC JWT Claims 0-read |
| **Thông báo & Thảo luận** | Gửi lẻ từng request riêng, dễ lỗi mạng | Gom trọn vẹn trong 1 batch commit | 100% nguyên tử, không rớt dữ liệu |
| **Số lượng Cloud Functions hoạt động** | 7 functions (nặng, tốn chi phí quota) | 5 functions (chỉ giữ lại AI, Email, Auth sync, Cascade delete) | Tinh gọn, tối ưu chi phí vận hành |

---

## 🚀 TRẠNG THÁI HIỆN TẠI & HƯỚNG DẪN BÀN GIAO (HANDOVER NOTES)

- **Hệ thống Security Rules Testing**: Đã tích hợp hoàn chỉnh `@firebase/rules-unit-testing`.
- **Lệnh chạy kiểm thử cho Agent / Developer**:
  - `npm test`: Chạy 501 tests unit tốc độ cao (<2s, không cần emulator; 384 Frontend + 117 Backend).
  - `npm run test:rules`: Chạy 19 test cases bảo mật & phân quyền thực thi trực tiếp trên Firestore Emulator.
  - `npm run build`: Kiểm tra compile TypeScript strict mode & bundle Vite production (0 error).
- **Tổng số tests toàn hệ thống**: **520 / 520 tests PASS (100%)**.

---

## 🌐 GIAI ĐOẠN 5: TRIỂN KHAI PRODUCTION (DEPLOYMENT PROGRESS)
- [x] **Bước 5.1: Cấu hình biến môi trường Production (`frontend/.env.production`)** kết nối project thật `contractreview-v2`.
- [x] **Bước 5.2: Triển khai Firestore Rules & Composite Indexes**: `firebase deploy --only firestore:rules,firestore:indexes` thành công 100%.
- [x] **Bước 5.3: Triển khai Storage Rules**: `firebase deploy --only storage` thành công 100%.
- [x] **Bước 5.4: Triển khai Frontend lên Firebase Hosting**: Đã phát hành bản build production lên `https://contractreview-v2.web.app`.
- [x] **Bước 5.5: Whitelist theo email**: Doc `/users/{email viết thường}` (fields `email`, `role`, `isActive`, `displayName`). `firestore.rules` tra bằng `request.auth.token.email.lower()` (delegate `firestore-rules-author`); frontend `fetchUserDocClaims(email)`. Ownership hợp đồng vẫn theo UID. Tests: frontend 376/376, rules 22/22. Đã deploy rules + hosting.
- [x] **Bước 5.6: Đồng bộ Region Cloud Functions & Cấu hình Deployment**:
  - Đã thêm `setGlobalOptions({ region: 'asia-southeast1' })` tại `backend/src/index.ts`.
  - Đồng bộ `region: 'asia-southeast1'` trong `deleteContract.ts`, `analyzeContractAI.ts`, `sendContractEmail.ts`, `healthCheck.ts`.
  - Thêm hook `predeploy: ["npm --prefix \"$RESOURCE_DIR\" run build"]` vào `firebase.json`.
  - Bổ sung composite index `status + updatedAt` và `createdBy.uid + status + updatedAt` vào `firestore.indexes.json`.
  - Tạo cấu hình `cors.json` cho Firebase Cloud Storage direct uploads.
  - Bổ sung `resolveUserAuthContext` tại `claimsManager.ts` với Firestore doc fallback `/users/{email}` và tích hợp vào `deleteContract.ts` giải quyết triệt để lỗi 403 whitelist token.
  - Cập nhật trigger `onUserDocWrite.ts` hỗ trợ tra cứu UID từ doc key email `/users/{email}`.
  - Tạm ẩn functions AI & Email tại `backend/src/index.ts` theo yêu cầu, chỉ export 3 functions: `healthCheck`, `deleteContract`, `onUserDocWrite`.
  - Chuẩn hóa `getFirebaseAdmin()` trong `firebaseAdmin.ts` và `index.ts` với cơ chế eager initialization & try-catch `admin.app()`, triệt tiêu hoàn toàn lỗi `The default Firebase app does not exist` trong Cloud Functions v2.
  - Kiểm thử: 117/117 Backend unit tests PASS, 376/376 Frontend tests PASS (100%).
- [x] **Bước 5.7: UAT trên https://contractreview-v2.web.app** với 3 tài khoản đã tạo trong `/users`:
  - `dkhoa8@gmail.com` (USER), `khoavudl@gmail.com` (LEGAL), `fesv_app@fes.foodempire.vn` (HOL).
  - Manual testing đạt 100%: Tương tác dữ liệu, các nghiệp vụ chuyển trạng thái 6 giai đoạn, tạo, xoá, upload Word .docx & ref files, chat 2 chiều, inline task list và batch save đều mượt mà.
- [x] **Bước 5.8: Tích Hợp Xác Thực Microsoft 365 (Entra ID / Azure AD) & Cập Nhật Production (Hoàn thành 100%)**:
  - Củng cố `createAuthProvider('microsoft')`: Bổ sung 4 OAuth scopes chuẩn (`email`, `profile`, `openid`, `User.Read`).
  - Xây dựng helpers `extractUserEmail` và `extractUserDisplayName`: Tự động dự phòng đọc email từ `user.providerData[0].email` và chuẩn hóa lowercase, khắc phục triệt để đặc thù một số tenant Azure AD không trả trực tiếp về root `user.email`.
  - Cập nhật `fetchClaimsWithRetry`, `buildAuthUser` và `handleInvalidClaims` trong `AuthContext.tsx`.
  - Viết 8 unit tests mới trong `authService.test.ts` (**384/384 Frontend Vitest tests PASS 100%**).
  - Biên soạn tài liệu quản trị viên [MICROSOFT_AUTH_GUIDE.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/MICROSOFT_AUTH_GUIDE.md) hướng dẫn chi tiết từng bước tạo App Registration trên Azure Portal và kích hoạt Provider trên Firebase Console.
  - Triển khai bản build mới nhất lên Firebase Hosting (`https://contractreview-v2.web.app`) thành công.
  - Tổng số tests toàn repo: 384 (Frontend) + 117 (Backend) + 19 (Rules) = **520 / 520 tests PASS 100%**.
- [x] **Bước 5.27: Tích Hợp Thông Báo Email Tự Động Khi Chuyển Trạng Thái Hợp Đồng (Firestore Trigger onContractStatusChanged) (Hoàn thành 100%)**:
  - **Mục tiêu & Động lực**:
    1. Tự động hóa gửi email thông báo qua Gmail SMTP (Nodemailer) khi hồ sơ hợp đồng chuyển trạng thái, hoàn toàn không làm chậm trải nghiệm người dùng trên web.
    2. Kiến trúc hướng sự kiện (Event-Driven Firestore Trigger): Sử dụng Cloud Function v2 `onContractStatusChanged` (`onDocumentUpdated('contracts/{contractId}')`, region `asia-southeast1`) tự động bắt sự kiện thay đổi trạng thái trong background; client chuyển trạng thái bằng `writeBatch` trong 30ms, server tự động gửi mail ngầm.
    3. Ma trận phân phối người nhận (Recipient Matrix):
       - User nộp lần đầu (`DRAFT` $\rightarrow$ `PENDING_LEGAL`): TO Legal team, CC User creator.
       - Legal yêu cầu chỉnh sửa (`PENDING_LEGAL` $\rightarrow$ `USER_REVISING`): TO User creator, CC Legal team.
       - User nộp lại bản sửa đổi (`USER_REVISING` $\rightarrow$ `PENDING_LEGAL`): TO Legal team, CC User creator.
       - Legal trình Trưởng phòng duyệt (`PENDING_LEGAL` $\rightarrow$ `PENDING_HOL`): TO Trưởng phòng HOL, CC Legal team + User creator (theo yêu cầu người dùng).
       - Trưởng phòng yêu cầu sửa đổi (`PENDING_HOL` $\rightarrow$ `USER_REVISING`): TO User creator, CC Legal team + HOL.
       - Trưởng phòng Phê duyệt chính thức (`PENDING_HOL` $\rightarrow$ `HOL_APPROVED`): TO User creator, CC Legal team + HOL.
    4. Trích xuất tự động thông tin & lý do: Tự động tra cứu `SYSTEM_STATUS_CHANGE` comment để lấy tên người thao tác (`actorName`) và ghi chú/lý do (`rejectReason` / `changeSummary`), hiển thị nổi bật trong bảng chi tiết email.
    5. Cập nhật liên kết: `APP_BASE_URL` mặc định trỏ về production domain `https://contractreview-v2.web.app/contracts/{contractId}`.
    6. Kích hoạt Feature Flag: Đặt `ENABLE_EMAIL: true` trong `backend/src/config/features.ts`.
    7. Export trigger tại `backend/src/index.ts`: Sẵn sàng deploy cùng cụm Cloud Functions.
    8. Tinh chỉnh nội dung email: Loại bỏ hoàn toàn dòng "Thực hiện bởi" khỏi bảng thông tin chi tiết hợp đồng trong tất cả các mẫu email theo phản hồi người dùng, giúp giao diện thư gửi tinh gọn, tập trung vào mã hợp đồng, tiêu đề, đối tác và ghi chú hành động.
  - **Kiểm thử Toàn Diện**:
    - Backend Vitest: Viết mới 11 unit tests trong `onContractStatusChanged.test.ts`, cập nhật `emailDispatcherService.test.ts`, `features.test.ts` và `emailTemplates.test.ts` (**128/128 tests PASS 100%**).
    - Frontend Vitest: **385/385 tests PASS 100%**.
    - Build Verification: `tsc` (Backend) & `tsc -b && vite build` (Frontend) đều **0 errors**.
    - Tổng số tests toàn repo: 385 (Frontend) + 128 (Backend) + 19 (Rules) = **532 / 532 tests PASS 100%**.
    - Mã nguồn cũ `OLD_Ver/`: Bất khả xâm phạm (0 file bị chạm).

- **Ghi chú bàn giao & Cấu hình Gửi Email**:
  - Đã cấp quyền Service Account cho Cloud Build (`250479197372-compute@developer.gserviceaccount.com`).
  - Runtime Service Account Cloud Functions v2: Cần vai trò `Firebase Authentication Admin` (`roles/firebaseauth.admin`) cho `250479197372-compute@developer.gserviceaccount.com` để `onUserDocWrite` đồng bộ Custom Claims vào Firebase Auth.
  - Cấu hình Gmail SMTP credentials cho Cloud Functions:
    - Cách 1: Thiết lập biến môi trường trong file `.env` của backend:
      ```bash
      SMTP_USER=admin_email@gmail.com
      SMTP_PASS=xxxx xxxx xxxx xxxx
      APP_BASE_URL=https://contractreview-v2.web.app
      ```
    - Cách 2: Sử dụng Google Cloud Secret Manager / Firebase Functions Secrets:
      ```bash
      firebase functions:secrets:set SMTP_USER
      firebase functions:secrets:set SMTP_PASS
      ```
  - Lệnh deploy 4 functions chính: `firebase deploy --only functions` (gồm: `healthCheck`, `deleteContract`, `onUserDocWrite`, `onContractStatusChanged`).
  - Storage CORS: Chạy `gcloud storage buckets update gs://contractreview-v2.firebasestorage.app --cors-file=cors.json` để hoàn tất cấu hình Upload.



