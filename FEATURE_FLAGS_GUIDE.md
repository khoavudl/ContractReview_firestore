# 📖 HƯỚNG DẪN BẬT / TẮT FEATURE FLAGS (FEATURE_FLAGS_GUIDE.md)

> **Dự án:** Contract Review System v2.0  
> **Mục đích:** Hướng dẫn quản trị viên dễ dàng bật/tắt 3 tính năng nâng cao (**AI Gemini**, **Gửi Email SMTP**, và **Quả chuông Thông báo**) chỉ bằng các biến cờ `true` / `false`.

---

## 📍 1. VỊ TRÍ 2 FILE CẤU HÌNH TRUNG TÂM

Mọi tính năng được điều khiển tập trung tại đúng 2 file mã nguồn:

| Thành phần | Đường dẫn file cấu hình |
|---|---|
| **Frontend** (Giao diện người dùng) | [`frontend/src/shared/constants/features.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/constants/features.ts) |
| **Backend** (Cloud Functions & Server) | [`backend/src/config/features.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/config/features.ts) |

---

## 🎛️ 2. BẢNG TRA CỨU 3 TÍNH NĂNG

```typescript
// Trạng thái mặc định hiện tại (Tất cả đều tạm tắt để tối ưu chi phí & test nghiệp vụ cốt lõi)
export const FEATURE_FLAGS = {
  ENABLE_NOTIFICATIONS: false, // 1. Quả chuông thông báo (In-App Bell)
  ENABLE_AI: false,            // 2. Trợ lý AI (Gemini Assistant)
  ENABLE_EMAIL: false,         // 3. Gửi Email tự động (Gmail SMTP)
};
```

---

## 🚀 3. HƯỚNG DẪN CHI TIẾT BẬT TỪNG TÍNH NĂNG

### 🔹 Tính năng 1: Trợ lý AI (Gemini AI Assistant)
* **Khi `false` (Hiện tại)**:
  * Nút Tab **Trợ lý AI** trên trang chi tiết hợp đồng bị làm mờ (`opacity-40`), có chữ *(Tạm tắt)*, con trỏ chuột hiện biểu tượng cấm 🚫 và không click được.
  * Mọi hàm gọi phân tích Gemini ở cả Frontend và Backend đều bị chặn, tiết kiệm 100% token và chi phí API.
* **Cách bật lại (`true`)**:
  1. Mở file [`frontend/src/shared/constants/features.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/constants/features.ts), đổi:
     ```typescript
     ENABLE_AI: true,
     ```
  2. Mở file [`backend/src/config/features.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/config/features.ts), đổi:
     ```typescript
     ENABLE_AI: true,
     ```
  3. **Yêu cầu biến môi trường**: Đảm bảo file `backend/.env` đã có API Key của Google Gemini:
     ```env
     GEMINI_API_KEY="AIzaSy..."
     ```
  4. Nút tab Trợ lý AI sẽ sáng rõ trở lại, hiển thị 3 tab con: *Tóm tắt*, *Radar rủi ro*, và *Decision Brief*.

---

### 🔹 Tính năng 2: Gửi Email Thông Báo (Email Dispatcher)
* **Khi `false` (Hiện tại)**:
  * Bỏ qua hoàn toàn việc gửi email qua mạng khi chuyển trạng thái duyệt hồ sơ.
  * Không tốn quota SMTP Gmail, không lo báo lỗi khi chưa cài App Password.
* **Cách bật lại (`true`)**:
  1. Mở file [`frontend/src/shared/constants/features.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/constants/features.ts), đổi:
     ```typescript
     ENABLE_EMAIL: true,
     ```
  2. Mở file [`backend/src/config/features.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/config/features.ts), đổi:
     ```typescript
     ENABLE_EMAIL: true,
     ```
  3. **Yêu cầu biến môi trường**: Đảm bảo file `backend/.env` (hoặc Firebase Secret Manager) đã có thông tin tài khoản Gmail gửi thư:
     ```env
     SMTP_USER="your-email@gmail.com"
     SMTP_PASS="xxxx xxxx xxxx xxxx" # Mật khẩu ứng dụng Google App Password 16 ký tự
     ```

---

### 🔹 Tính năng 3: Quả Chuông Thông Báo (In-App Notification Bell)
* **Khi `false` (Hiện tại)**:
  * Ẩn icon Quả chuông trên Topbar Header.
  * Tắt toàn bộ Firestore `onSnapshot` realtime listener xuống subcollection `/notifications`, tiết kiệm 100% chi phí đọc (Read) và ghi (Write) database.
* **Cách bật lại (`true`)**:
  1. Mở file [`frontend/src/shared/constants/features.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/frontend/src/shared/constants/features.ts), đổi:
     ```typescript
     ENABLE_NOTIFICATIONS: true,
     ```
  2. Mở file [`backend/src/config/features.ts`](file:///Users/tindn/Documents/Code/ContractReview_firestore/backend/src/config/features.ts), đổi:
     ```typescript
     ENABLE_NOTIFICATIONS: true,
     ```
  3. Quả chuông sẽ lập tức hiển thị trên thanh điều hướng, tự động đếm số thông báo chưa đọc và hiển thị dropdown danh sách hoạt động mới theo thời gian thực.

---

## ⚡ 4. LỆNH BUILD LẠI SAU KHI THAY ĐỔI CỜ

Sau khi đổi bất kỳ biến cờ nào sang `true`, bạn chỉ cần chạy lệnh build lại:

```bash
# Build Frontend
npm run build --prefix frontend

# Build Backend
npm run build --prefix backend
```

Nếu đang chạy ở môi trường phát triển cục bộ (`npm run dev`), Vite sẽ tự động hot-reload giao diện tức thì mà không cần khởi động lại server.
