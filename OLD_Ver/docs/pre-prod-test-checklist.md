# 📋 BẢNG CHECKLIST KIỂM THỬ TOÀN DIỆN TRƯỚC KHI GO-LIVE (PRE-PROD FULL TEST CHECKLIST)

> **Tài liệu kiểm thử End-to-End hệ thống Contract Review**  
> **Phiên bản:** v1.0 • **Ngày lập:** 2026-08-25  
> **Mục đích:** Hướng dẫn kiểm thử từng tính năng trên giao diện WebApp và đối soát dữ liệu trên Google Sheets (Database) & Google Drive (Storage) trước khi bàn giao đưa vào vận hành chính thức.

---

## 📌 PHẦN 1: CHUẨN BỊ MÔI TRƯỜNG & TÀI KHOẢN TEST

### 1.1. Đường dẫn hệ thống
- [ ] **WebApp URL (Vercel)**: `https://contract-review-weld.vercel.app`
- [ ] **Google Sheets Active DB**: Kiểm tra ID trong `SPREADSHEET_ID` (Gồm 8 sheets: `users`, `contracts`, `versions`, `comments`, `activity_log`, `ai_analyses`, `task_list`, `reference_files`)
- [ ] **Google Sheets Archive DB**: `Contract_Archive_DB` (Tự động tạo/liên kết khi có hợp đồng hoàn tất)
- [ ] **Google Drive Root Folder**: Thư mục gốc lưu trữ hồ sơ hợp đồng

### 1.2. Chuẩn bị 03 Tài khoản Kiểm thử (Tương ứng 3 Vai trò)
| Vai trò | Email / Tài khoản test | Chức năng chính | Ghi chú |
| :--- | :--- | :--- | :--- |
| **`USER`** | `dangkhoa.vu@foodempire.vn` | Tạo HĐ, nạp tài liệu tham chiếu, upload phiên bản mới theo phản hồi | Chỉ có quyền tạo HĐ |
| **`LEGAL`** | `vy.tran@foodempire.vn` | Thẩm định, chạy Gemini AI, điền Task List, duyệt chuyển HOL / trả về | Không tạo HĐ mới |
| **`HOL`** | `fesv_app@fes.foodempire.vn` | Xem xét cấp Trưởng phòng, xem Decision Brief AI, Phê duyệt cuối / Hoàn tất | Quyền phê duyệt cao nhất |

---

## 🔐 PHẦN 2: XÁC THỰC & PHÂN QUYỀN (AUTHENTICATION & RBAC)

### 2.1. Đăng nhập & Đăng xuất
- [ ] **Đăng nhập Google OAuth**:
  - Thao tác: Nhấp **"Đăng nhập bằng Google"**.
  - Kết quả mong đợi: Đăng nhập thành công, chuyển hướng vào Dashboard, hiển thị Tên người dùng và Role Badge chính xác (`USER`, `LEGAL`, `HOL`).
- [ ] **Đăng nhập Microsoft OAuth** *(nếu có)*:
  - Thao tác: Nhấp **"Đăng nhập bằng Microsoft"** (Azure AD).
  - Kết quả mong đợi: Popup xác thực Microsoft hoạt động mượt mà, định danh đúng email nội bộ.
- [ ] **Đăng xuất**:
  - Thao tác: Nhấp nút **"Đăng xuất"** trên Topbar.
  - Kết quả mong đợi: Xóa sạch session trong `localStorage`, quay lại màn hình Login, không thể nhấn nút Back của trình duyệt để vào lại dữ liệu cũ.

### 2.2. Kiểm tra Phân quyền Giao diện (Role-based UI)
- [ ] **Với tài khoản `USER`**:
  - [ ] Nút **"➕ Tạo hợp đồng mới"** HIỂN THỊ rõ ràng trên thanh công cụ Dashboard.
  - [ ] Trong chi tiết hợp đồng: KHÔNG hiển thị các nút thẩm định/duyệt của Legal hoặc HOL.
- [ ] **Với tài khoản `LEGAL`**:
  - [ ] Nút **"➕ Tạo hợp đồng mới"** HOÀN TOÀN ẨN trên Dashboard.
  - [ ] Trong chi tiết hợp đồng: Hiển thị bộ công cụ thẩm định pháp lý (Nút AI, Bảng Task List, Nút Gửi cho User / Duyệt chuyển HOL).
- [ ] **Với tài khoản `HOL`**:
  - [ ] Nút **"➕ Tạo hợp đồng mới"** HOÀN TOÀN ẨN trên Dashboard.
  - [ ] Trong chi tiết hợp đồng: Hiển thị nút **"Phê duyệt (HOL Approve)"**, **"Yêu cầu chỉnh sửa"**.

---

## 🖥️ PHẦN 3: KIỂM THỬ TRANG TỔNG QUAN (DASHBOARD) & TRANG ĐÃ DUYỆT (ARCHIVED)

### 3.1. Trang Tổng quan (Dashboard)
- [ ] **3 Thẻ Thống Kê (Stat Cards)**:
  - [ ] Thẻ **⏳ Cần xử lý**, **⚖️ Legal Review**, **🔍 Head Review** hiển thị số lượng chính xác tương ứng với số hợp đồng đang active.
  - [ ] Nhấp vào từng thẻ: Danh sách bên dưới lọc tức thì theo trạng thái tương ứng, card được chọn có viền sáng (active). Nhấp lại để bỏ lọc (về ALL).
- [ ] **Thanh Tìm kiếm Dashboard (Debounce 800ms & Giữ nguyên Focus)**:
  - [ ] **Kiểm tra độ trễ Debounce 800ms**: Gõ từ từ 1-2 ký tự (ví dụ: `HĐ`), hệ thống KHÔNG vội vàng giật/lọc ngay; dừng tay 800ms thì danh sách mới cập nhật.
  - [ ] **Kiểm tra Gõ Tiếng Việt có dấu**: Gõ chuỗi có dấu dài (ví dụ: *"Hợp đồng mua sắm thiết bị văn phòng"*) ➡️ Không bị mất dấu.
  - [ ] **Kiểm tra Focus & Con trỏ chuột**: Trong quá trình debounce và danh sách bên dưới cập nhật, ô tìm kiếm KHÔNG bị re-render đè lên, con trỏ chuột giữ nguyên vị trí, không bị mất focus.
  - [ ] **Tìm kiếm đa trường**: Thử tìm theo **Mã HĐ** (ví dụ: `CTR-2608`), **Tên HĐ**, **Nhà cung cấp**, **Người tạo** ➡️ Đều lọc ra kết quả chính xác.
- [ ] **Phân trang (Pagination)**:
  - [ ] Hiển thị 20 hợp đồng mỗi trang. Chuyển trang 1 ➡️ 2 ➡️ 3, ô tìm kiếm và trạng thái lọc giữ nguyên.
- [ ] **Nút 🔄 Làm mới (Force Refresh)**:
  - [ ] Nhấp nút "Làm mới": Gọi request tươi về server để đồng bộ dữ liệu mới nhất từ Google Sheets mà không cần reload trang web.

### 3.2. Trang Hợp đồng Đã duyệt (Archived Contracts)
- [ ] **Danh sách mặc định**:
  - [ ] Hiển thị danh sách các hợp đồng có trạng thái `HOL_APPROVED`.
  - [ ] Nhãn đếm hiển thị: *"Hiển thị X / Y hợp đồng gần nhất"*.
- [ ] **Tìm kiếm nhanh trên RAM (Local Search)**:
  - [ ] Nhập từ khóa: Lọc tức thì trong danh sách RAM với debounce 800ms, không lag, ô input giữ focus 100%.
- [ ] **Tính năng Tìm kiếm Sâu trên Máy chủ (Deep Search)**:
  - [ ] Nhập từ khóa của một hợp đồng cũ đã lưu trữ từ lâu trong lịch sử.
  - [ ] Nhấn phím **`Enter`** hoặc nhấp nút **"🔍 Tìm kiếm sâu trên toàn bộ máy chủ"**.
  - [ ] Banner Deep Search màu xanh xuất hiện: *"🔎 Kết quả tìm kiếm toàn bộ kho lưu trữ cho: [từ khóa] (Tìm thấy N hợp đồng)"*.
  - [ ] Nhấp nút **"✕ Quay lại danh sách gần đây"**: Giao diện khôi phục về danh sách 200 hợp đồng gần nhất nguyên vẹn.

---

## 🔄 PHẦN 4: KIỂM THỬ TOÀN DIỆN VÒNG ĐỜI HỢP ĐỒNG (END-TO-END WORKFLOW)

### 4.1. Giai đoạn 1: `USER` Khởi tạo Hợp đồng Mới
- [ ] **Mở Modal Tạo Hợp Đồng**:
  - Thao tác: Đăng nhập với role `USER`, nhấn nút **"➕ Tạo hợp đồng mới"**.
- [ ] **Kiểm tra Validation Form Bắt buộc**:
  - [ ] Để trống Tiêu đề, NCC, hoặc Mô tả rồi nhấn Tạo ➡️ Không cho tạo. 
  - [ ] **Kiểm tra Ràng buộc File Hợp đồng Chính**:
    - [ ] Thử chọn file PDF, Excel, PNG... ➡️ Không cho tạo. 
    - [ ] Thử chọn file Word dung lượng > 10MB ➡️ Hệ thống báo lỗi vượt quá giới hạn 10MB.
    - [ ] Chọn file `.docx` hợp lệ (≤ 10MB) ➡️ Hiển thị tên file, dung lượng và icon Word xanh dương đẹp mắt.
- [ ] **Kiểm tra Tải lên Tài liệu Tham chiếu (Reference Files) ngay lúc tạo**:
  - [ ] Chọn đính kèm 2-3 file tham chiếu (file PDF báo giá, file Excel bảng tính...).
  - [ ] Thử chọn > 5 file lúc tạo ➡️ Báo cảnh báo giới hạn tối đa 5 file lúc khởi tạo.
- [ ] **Thực hiện Tạo Hợp Đồng**:
  - [ ] Nhấn nút **"Tạo hợp đồng"**.
  - [ ] Loading Overlay toàn màn hình hiển thị spinner và thông báo: *"Đang tải lên và xử lý..."*.
  - [ ] Tạo thành công: Hiển thị Toast thông báo màu xanh, Modal đóng, hợp đồng mới xuất hiện trên đầu Dashboard với trạng thái **`PENDING_LEGAL`**.

---

### 4.2. Giai đoạn 2: `LEGAL` Tiếp nhận & Thẩm định Hợp đồng
- [ ] **Tiếp nhận & Mở Chi tiết Hợp đồng**:
  - [ ] Đăng nhập role `LEGAL`, thấy hợp đồng mới trong cột **"Cần xử lý"** / **"Legal Review"**.
  - [ ] Nhấp vào thẻ hợp đồng để vào trang Chi tiết.
- [ ] **Kiểm tra Tab "Phiên bản" (Versions)**:
  - [ ] Hiển thị phiên bản `v1` (file gốc) với tên người tải lên, ngày giờ.
  - [ ] Nhấp nút **"Mở tài liệu"** / **"Xem file"** ➡️ Mở link Google Docs trong tab mới với quyền **COMMENT** (nhận xét).
- [ ] **Kiểm tra Tính năng AI Trợ lý Pháp lý (Google Gemini)**:
  - [ ] Nhấp nút **"🤖 AI Tóm tắt hợp đồng"**:
    - [ ] Hiển thị loading phân tích.
    - [ ] Trả về tóm tắt cấu trúc: Các bên tham gia, Giá trị/Hình thức thanh toán, Thời hạn, Điều khoản phạt...
  - [ ] Nhấp nút **"⚖️ AI Phân tích rủi ro"**:
    - [ ] Trả về danh sách rủi ro (Rủi ro thanh toán, Rủi ro pháp lý, Bất khả kháng...).
    - [ ] **Tự động điền dữ liệu vào Bảng Task List**: Các rủi ro AI phát hiện được tự động fill vào bảng Task List thẩm định.
  - [ ] **Kiểm tra AI Cache**: Tải lại trang hoặc chuyển tab rồi bấm lại AI ➡️ Hiển thị kết quả tức thì (0s) từ cache, không tốn thêm lượt gọi API.
- [ ] **Chỉnh sửa & Gửi Bảng Task List (Bảng Phân tích Thẩm định)**:
  - [ ] Điền thêm đề xuất xử lý của Legal, chọn Category, sửa Status.
  - [ ] Nhấp **"Lưu nháp Task List"** ➡️ Lưu thành công.
  - [ ] Nhấp **"📤 Gửi Task List cho User"**:
    - [ ] Dialog xác nhận hiển thị.
    - [ ] Trạng thái hợp đồng chuyển thành **`LEGAL_COMMENTED`**.

---

### 4.3. Giai đoạn 3: `USER` Nhận phản hồi & Upload Phiên bản Mới (v2)
- [ ] **Xem phản hồi của Legal**:
  - [ ] Đăng nhập role `USER`, thấy hợp đồng chuyển sang trạng thái **`LEGAL_COMMENTED`**.
  - [ ] Mở chi tiết hợp đồng: Đọc được các hạng mục Task List mà Legal yêu cầu chỉnh sửa.
  - [ ] Nhập phản hồi/giải trình của User vào cột *"Ý kiến của bạn"*.
- [ ] **Upload Phiên bản đã sửa (Version 2)**:
  - [ ] Nhấp nút **"📤 Tải lên phiên bản mới"** (hoặc chuyển sang tab Phiên bản).
  - [ ] Chọn file Word `.docx` đã sửa (validate chặt chẽ chỉ nhận `.doc`/`.docx` ≤ 10MB).
  - [ ] Nhập mô tả thay đổi (Change summary) và ghi chú đàm phán (Nego notes).
  - [ ] Nhấn **"Tải lên"** ➡️ Loading hiển thị, nạp thành công phiên bản `v2`.
- [ ] **Gửi lại cho Legal**:
  - [ ] Nhấn nút **"Gửi lại cho Pháp chế"** ➡️ Trạng thái quay về **`PENDING_LEGAL`**.

---

### 4.4. Giai đoạn 4: `LEGAL` Duyệt & Chuyển lên Trưởng phòng (`HOL`)
- [ ] **Kiểm tra Version 2**:
  - [ ] Đăng nhập role `LEGAL`, mở tab **"Phiên bản"**: Thấy danh sách có cả `v1` và `v2`.
  - [ ] Mở xem tài liệu `v2` trên Google Docs.
  - [ ] Kiểm tra tab **"Trao đổi" (Comments)**: Gửi 1 tin nhắn trao đổi nội bộ ➡️ Tin nhắn hiển thị ngay trong danh sách lịch sử.
- [ ] **Phê duyệt Legal**:
  - [ ] Cập nhật trạng thái Task List thành đã giải quyết (Resolved).
  - [ ] Nhấp nút **"✅ Duyệt & Chuyển Trưởng phòng (HOL)"**.
  - [ ] Trạng thái hợp đồng chuyển thành **`PENDING_HOL`** (hoặc `LEGAL_APPROVED`).

---

### 4.5. Giai đoạn 5: `HOL` Phê duyệt & Đánh dấu Hoàn tất
- [ ] **Xem xét cấp Trưởng phòng**:
  - [ ] Đăng nhập role `HOL`, thấy hợp đồng nằm trong nhóm **"Head Review"**.
  - [ ] Mở chi tiết hợp đồng.
  - [ ] Nhấp nút **"📊 AI Báo cáo đề xuất (Decision Brief)"**: AI tổng hợp toàn bộ lịch sử chỉnh sửa từ v1 đến v2, các điểm rủi ro đã xử lý để HOL nắm nhanh trong 30 giây.
- [ ] **Trường hợp HOL Yêu cầu chỉnh sửa** *(nếu test luồng trả về)*:
  - [ ] Nhấp **"Yêu cầu chỉnh sửa"** ➡️ Trạng thái đổi thành **`HOL_COMMENTED`** và trả về cho Legal/User.
- [ ] **Trường hợp HOL Phê duyệt (Approve)**:
  - [ ] Nhấp nút **"👑 Phê duyệt (HOL Approve)"**.
  - [ ] Trạng thái đổi thành **`HOL_APPROVED`**.
  - [ ] Backend tự động tạo bản copy tài liệu phê duyệt `{contractId}_approved` trong Drive với quyền **VIEW**.
- [ ] **Đánh dấu Hoàn tất (Complete)**:
  - [ ] Nhấp nút **"🎉 Đánh dấu Hoàn tất (Đã ký kết)"**.
  - [ ] Trạng thái đổi thành **`COMPLETED`**.
  - [ ] Hợp đồng tự động được lưu trữ/chuyển vào **Archive DB** và xuất hiện trong trang **Hợp đồng đã duyệt**.

---

## 📂 PHẦN 5: KIỂM THỬ TAB "TÀI LIỆU THAM CHIẾU" (REFERENCE FILES)

- [ ] **Kiểm tra Danh sách File**:
  - [ ] Mở tab **"Tài liệu"** trong chi tiết hợp đồng: Hiển thị các file đã đính kèm lúc tạo HĐ với icon định dạng tương ứng (PDF, Excel, Word, Ảnh, Zip...), dung lượng file (KB/MB), người tải lên, ngày giờ.
  - [ ] Nhấp vào file: Mở xem file gốc trực tiếp trên Google Drive tab mới.
- [ ] **Kiểm tra Tải lên Nhiều File (Multi-file Upload)**:
  - [ ] Nhấp nút **"➕ Thêm tài liệu tham khảo"** ➡️ Modal mở ra.
  - [ ] Modal hiển thị rõ số slot còn lại: *"Hồ sơ hiện có X/10 tài liệu. Bạn có thể tải thêm tối đa Y tài liệu."*
  - [ ] **Kéo thả nhiều file** cùng lúc vào vùng drop-zone hoặc chọn nhiều file từ file dialog.
  - [ ] Danh sách file chuẩn bị tải hiển thị rõ ràng từng file kèm dung lượng và nút **✕** để xóa bớt file nếu chọn nhầm.
  - [ ] Thử chọn vượt quá số slot còn lại (ví dụ còn 2 slot mà chọn 4 file) ➡️ Hệ thống cảnh báo và chỉ nhận đúng số file tối đa còn lại.
  - [ ] Nhấn **"Bắt đầu tải lên"**:
    - [ ] Loading Overlay hiển thị tiến trình tuần tự: *"Đang tải lên tài liệu 1/3..."* ➡️ *"Đang tải lên tài liệu 2/3..."* ➡️ *"Đang tải lên tài liệu 3/3..."*.
    - [ ] Tải xong: Modal đóng, tab Tài liệu cập nhật ngay lập tức các file mới mà không cần F5.
- [ ] **Kiểm tra Quyền Xóa File (Delete Permission)**:
  - [ ] Với file do chính mình tải lên: Có nút thùng rác 🗑️ màu đỏ. Nhấp vào ➡️ Hiện Confirm Dialog ➡️ Xác nhận ➡️ File bị xóa khỏi hệ thống.
  - [ ] Với file do người khác tải lên: KHÔNG có nút xóa (hoặc bị ẩn).
  - [ ] Khi hợp đồng ở trạng thái `HOL_APPROVED` hoặc `COMPLETED`: Nút Thêm file và Xóa file bị vô hiệu hóa hoàn toàn để bảo vệ tính pháp lý của hồ sơ đã duyệt.

---

## 🗄️ PHẦN 6: ĐỐI SOÁT CƠ SỞ DỮ LIỆU (GOOGLE SHEETS VERIFICATION)

Mở file **Google Sheets Active DB** và kiểm tra từng sheet sau khi thực hiện các bước trên:

- [ ] **Sheet `contracts`**:
  - [ ] Dòng hợp đồng mới tạo có đầy đủ: `contract_id` (dạng `CTR-YYMM-XXXX`), `title`, `supplier`, `description`, `status`, `current_version`, `folder_id`, `created_by`, `created_at`, `updated_at`.
- [ ] **Sheet `versions`**:
  - [ ] Có ít nhất 2 dòng (`version_no = 1` và `version_no = 2`).
  - [ ] `file_id`, `file_name`, `file_url` trỏ đúng vào file Google Docs trong Drive.
  - [ ] `change_summary`, `nego_notes` lưu đầy đủ văn bản giải trình.
- [ ] **Sheet `reference_files`**:
  - [ ] Mỗi file tham chiếu tải lên có 1 dòng ghi nhận: `contract_id`, `file_id`, `file_name`, `file_url`, `file_size`, `mime_type`, `uploaded_by`, `uploaded_at`.
  - [ ] Các file đã bị xóa không còn tồn tại trên sheet (hoặc được dọn dẹp sạch).
- [ ] **Sheet `task_list`**:
  - [ ] Lưu đầy đủ các task thẩm định pháp lý: `clauses`, `issue_summary`, `category`, `legal_recommendation`, `status`, `user_notes`.
- [ ] **Sheet `comments`**:
  - [ ] Lưu đầy đủ các trao đổi: `contract_id`, `version_no`, `comment_by`, `comment_at`, `comment_text`.
- [ ] **Sheet `ai_analyses`**:
  - [ ] Lưu kết quả JSON phân tích của Gemini: `analysis_type` (`SUMMARY`, `RISK`, `DECISION_BRIEF`), `result_json`.
- [ ] **Sheet `activity_log`**:
  - [ ] Ghi lại đầy đủ dòng thời gian (Audit Trail): Ai đã tạo hợp đồng, ai upload version mới, ai chuyển trạng thái, ai xóa file... vào thời gian nào.
- [ ] **Sheet `Contract_Archive_DB` (Archive DB)**:
  - [ ] Khi hợp đồng đạt `COMPLETED`, kiểm tra dữ liệu hợp đồng và các sheet liên quan được đồng bộ sang file Archive Spreadsheet.

---

## ☁️ PHẦN 7: ĐỐI SOÁT LƯU TRỮ GOOGLE DRIVE (STORAGE & PERMISSIONS)

Mở **Google Drive** (Thư mục gốc của ứng dụng) và kiểm tra:

- [ ] **Cấu trúc Thư mục**:
  - [ ] Có thư mục con đặt tên theo quy tắc: `{contractId}_{supplier}` (ví dụ: `CTR-2608-0001_CongTyFPT`).
- [ ] **Kiểm tra File Hợp đồng Chính**:
  - [ ] File version 1: `{contractId}_origin` (Định dạng Google Docs).
  - [ ] File version 2: `{contractId}_v2` (Định dạng Google Docs).
  - [ ] Phân quyền chia sẻ file Google Docs: Có quyền **COMMENT** cho người dùng có link.
- [ ] **Kiểm tra File Tài liệu Tham chiếu**:
  - [ ] File nằm trong cùng thư mục hợp đồng.
  - [ ] Định dạng file giữ nguyên gốc (PDF là `.pdf`, Excel là `.xlsx`, Ảnh là `.png`...).
  - [ ] Phân quyền chia sẻ: Quyền **VIEW** cho người dùng có link.
- [ ] **Kiểm tra Bản Phê Duyệt Cuối**:
  - [ ] Khi HOL phê duyệt, xuất hiện file `{contractId}_approved` với quyền **VIEW**.

---

## 📊 PHẦN 8: BẢNG TỔNG KẾT NGHIỆM THU (ACCEPTANCE & SIGN-OFF)

| STT | Hạng mục kiểm thử | Trạng thái (PASS / FAIL) | Người kiểm thử | Ghi chú / Lỗi tồn đọng |
| :---: | :--- | :---: | :---: | :--- |
| 1 | Xác thực Google & Phân quyền 3 Roles | [ ] | | |
| 2 | Dashboard (Debounce 800ms, DOM focus, Stats) | [ ] | | |
| 3 | Trang Đã duyệt (RAM Filter & Deep Search) | [ ] | | |
| 4 | Tạo HĐ (Validate Word .docx ≤10MB, Multi-ref) | [ ] | | |
| 5 | Luồng Legal Thẩm định & Gemini AI Assistant | [ ] | | |
| 6 | Luồng User phản hồi & Upload Version 2 | [ ] | | |
| 7 | Luồng HOL Duyệt & Hoàn tất Hợp đồng | [ ] | | |
| 8 | Quản lý Tài liệu Tham chiếu (Max 10, Xóa file) | [ ] | | |
| 9 | Đối soát 8 Sheets Database trên Google Sheets | [ ] | | |
| 10 | Đối soát Google Drive Folder & Phân quyền File | [ ] | | |

---

### ✍️ ĐÁNH GIÁ KẾT LUẬN:
- [ ] **ĐẠT TIÊU CHUẨN GO-LIVE**: Hệ thống hoạt động ổn định, dữ liệu đồng bộ chính xác, không còn lỗi chặn.
- [ ] **CẦN ĐIỀU CHỈNH THÊM**: (Ghi rõ chi tiết nếu có).
