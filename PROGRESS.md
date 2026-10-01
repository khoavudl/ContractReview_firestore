# PROGRESS.md — Project Status & Handover Tracker

> **Dự án:** Contract Review System v2.0 (Firestore & Clean Modular Architecture)  
> **Source of Truth (Kiến trúc):** [new_architecture.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/new_architecture.md)  
> **Quy tắc phát triển:** [AGENTS.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/AGENTS.md), [GEMINI.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/GEMINI.md)  
> **Cập nhật lần cuối:** 2026-10-01 | **Trạng thái tổng thể:** Đang thực hiện Giai đoạn 5 (Bước 5.1 Hoàn Thành 100% — Kết Nối Emulators & Chuẩn Hóa Luồng Phê Duyệt 3 Bước)

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
  - **Kết quả Kiểm thử Toàn Diện Bước 5.1**:
    - **Backend Vitest**: 14 test suites, **104/104 tests PASS (100%)** (+1 test State Machine mới).
    - **Frontend Vitest**: 44 test suites, **245/245 tests PASS (100%)**.
    - **Toàn bộ Repo**: **349/349 tests PASS (100%)**.
    - **TypeScript Build**: `tsc` (Backend) & `tsc -b && vite build` (Frontend) đều **0 errors**.
    - **Mã nguồn cũ `OLD_Ver/`**: Bất khả xâm phạm (0 file bị chạm).

- [ ] **Bước 5.2: Tối ưu Production Bundle & Triển khai Go-Live (Tiếp theo)**:
  - Tối ưu hóa Manual Chunks splitting trong `frontend/vite.config.ts`.
  - Kiểm tra bảo mật môi trường Production (`.env.production`).
  - Hướng dẫn triển khai Firebase Hosting & Cloud Functions v2.

