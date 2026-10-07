/**
 * Global Feature Flags Configuration for Frontend Client
 * Toggle features on/off to control UI elements, background polling, and Firestore reads.
 */

export interface FrontendFeatureFlags {
  /**
   * Bật/Tắt hiển thị và đồng bộ quả chuông thông báo (In-App Notifications).
   * - false: Ẩn icon chuông trên Topbar, không mở onSnapshot listener xuống Firestore (Tiết kiệm 100% read DB).
   * - true: Hiển thị chuông và lắng nghe thông báo thời gian thực.
   */
  ENABLE_NOTIFICATIONS: boolean;

  /**
   * Bật/Tắt tính năng Trợ lý AI (Gemini AI Assistant).
   * - false: Làm mờ nút Tab Trợ lý AI (opacity-40, cursor-not-allowed), cấm click, chặn mọi hàm gọi AI (Tiết kiệm 100% Token/API).
   * - true: Bật đầy đủ giao diện Trợ lý AI và phân tích Gemini.
   */
  ENABLE_AI: boolean;

  /**
   * Bật/Tắt tính năng Gửi Email thông báo (Email Dispatcher).
   * - false: Chặn mọi tác vụ gửi email từ client (Không tốn quota SMTP).
   * - true: Cho phép gửi email thông báo khi chuyển trạng thái.
   */
  ENABLE_EMAIL: boolean;
}

export const FEATURE_FLAGS: FrontendFeatureFlags = {
  ENABLE_NOTIFICATIONS: false,
  ENABLE_AI: true,
  ENABLE_EMAIL: false,
};
