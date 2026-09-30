# GEMINI.md — Gemini & Antigravity Coding Assistant Directives

> **Dự án:** Contract Review System v2.0 (Firestore & Clean Modular Architecture)  
> **Áp dụng cho:** Google Gemini, Antigravity AI Assistant & Subagents.  
> **Ngày ban hành:** 2026-09-28 | **Trạng thái:** Active Instructions (Bắt buộc tuân thủ)

---

## 1. TUÂN THỦ AGENTS.MD 100% (FULL COMPLIANCE)

Gemini / Antigravity **PHẢI tuân thủ tuyệt đối 100%** mọi quy tắc được quy định trong:

* 📕 [**AGENTS.md**](file:///Users/tindn/Documents/Code/ContractReview_firestore/AGENTS.md) — Quy tắc phát triển chung (No unapproved code, Atomic tasks, Mandatory tests, Feature-folder, Barrel exports, No `any`, OLD_Ver/ read-only).

Không cần lặp lại nội dung AGENTS.md ở đây. Nếu có mâu thuẫn, **AGENTS.md được ưu tiên**.

---

## 2. DIRECTIVES ĐẶC THÙ CHO GEMINI / ANTIGRAVITY

### 2.1. Source of Truth & Progress Tracking
* 📘 [**`new_architecture.md`**](file:///Users/tindn/Documents/Code/ContractReview_firestore/new_architecture.md) là tài liệu đặc tả kiến trúc **duy nhất** của dự án.
* 📋 [**`PROGRESS.md`**](file:///Users/tindn/Documents/Code/ContractReview_firestore/PROGRESS.md) là tài liệu theo dõi tiến độ **duy nhất** của dự án.
  * **BẮT BUỘC ĐỌC ĐẦU TIÊN**: Mọi Agent khi bắt đầu làm việc PHẢI đọc `PROGRESS.md` trước để nắm đúng context và task kế tiếp.
  * **BẮT BUỘC CẬP NHẬT SAU CÙNG**: Sau khi xong việc, PHẢI cập nhật lại `PROGRESS.md`.
* Mọi câu trả lời, đề xuất và hành vi viết code PHẢI lấy hai file này làm chuẩn.
* Tuyệt đối không tự ý áp dụng công nghệ, thư viện hoặc pattern nào ngoài phạm vi đã thống nhất.

### 2.2. Sử dụng Subagents Chuyên biệt
* **Firestore Security Rules**: Khi cần tạo hoặc sửa `firestore.rules`, **BẮT BUỘC** delegate cho subagent `firestore-rules-author` thay vì tự viết trực tiếp.
* **Research tasks**: Dùng subagent `research` cho các tác vụ tra cứu codebase/documentation phức tạp, nhiều bước đọc file.

### 2.3. Kích hoạt Skills Khi Cần
Các skills sau **tự động kích hoạt** (đọc `SKILL.md` trước khi dùng):
* `modular-code-architect` — Khi khởi tạo project, thiết kế cấu trúc, refactor, hoặc thêm feature mới.
* `firebase-firestore` — Khi làm việc với Firestore SDK, data modeling, indexes.
* `firestore-rules-creation` — Khi tạo/sửa Firestore Security Rules.
* `firebase-auth-basics` — Khi thiết lập Firebase Authentication.
* `firebase-hosting-basics` — Khi deploy frontend lên Firebase Hosting.
* `modern-web-guidance` — Khi viết HTML/CSS/client-side JS (bắt buộc chạy ĐẦU TIÊN).

### 2.4. Quy tắc Thư mục `OLD_Ver/`
* Thư mục `OLD_Ver/` chứa codebase cũ đã archived.
* **CHỈ ĐỌC (READ-ONLY)**: Chỉ truy cập khi cần tham chiếu logic nghiệp vụ cũ, prompt AI, hoặc mẫu email Outlook.
* **KHÔNG TÁI SỬ DỤNG TRỰC TIẾP**: 100% Fresh Codebase, không kế thừa nợ kỹ thuật.

---

## 3. CHECKLIST NHANH TRƯỚC VÀ SAU MỖI HÀNH ĐỘNG
 
- [ ] Đã đọc `PROGRESS.md` trước khi bắt đầu?
- [ ] Đã có Plan được User phê duyệt?
- [ ] Task có đang quá lớn? (> 3–4 files → chia nhỏ)
- [ ] Cần delegate cho subagent chuyên biệt không?
- [ ] `OLD_Ver/` giữ nguyên vẹn?
- [ ] Đã cập nhật `PROGRESS.md` sau khi hoàn thành task/phase?

---

## 4. THAM CHIẾU

* 📋 [PROGRESS.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/PROGRESS.md) — Theo dõi tiến độ & Bàn giao nhiệm vụ.
* 📘 [new_architecture.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/new_architecture.md) — Thiết kế hệ thống chi tiết.
* 📕 [AGENTS.md](file:///Users/tindn/Documents/Code/ContractReview_firestore/AGENTS.md) — Quy tắc phát triển chung (nguồn chính).
* 📁 [OLD_Ver/](file:///Users/tindn/Documents/Code/ContractReview_firestore/OLD_Ver) — Mã nguồn cũ (Chỉ đọc).
