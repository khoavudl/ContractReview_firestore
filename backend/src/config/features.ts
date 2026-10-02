/**
 * Global Feature Flags Configuration for Backend Services
 * Toggle features on/off to control database usage, external API calls, and service costs.
 */

export interface BackendFeatureFlags {
  /**
   * Bật/Tắt tính năng thông báo trong ứng dụng (In-App Notifications).
   * - false: Tắt hoàn toàn, không query /users, không ghi vào subcollection /notifications (Tiết kiệm 100% read/write DB).
   * - true: Bật đầy đủ cơ chế đẩy thông báo.
   */
  ENABLE_NOTIFICATIONS: boolean;

  /**
   * Bật/Tắt tính năng Trợ lý AI (Gemini AI Assistant).
   * - false: Tắt hoàn toàn, Cloud Function analyzeContractAI chặn gọi API (Tiết kiệm 100% chi phí Token/API).
   * - true: Bật đầy đủ khả năng phân tích Summary, Risk Radar, Decision Brief.
   */
  ENABLE_AI: boolean;

  /**
   * Bật/Tắt tính năng Gửi Email thông báo (Nodemailer Gmail SMTP).
   * - false: Tắt hoàn toàn, Cloud Function sendContractEmail và service dispatch bỏ qua gửi email (Không tốn quota SMTP).
   * - true: Bật đầy đủ khả năng gửi email qua Gmail SMTP.
   */
  ENABLE_EMAIL: boolean;
}

export const FEATURES: BackendFeatureFlags = {
  ENABLE_NOTIFICATIONS: false,
  ENABLE_AI: false,
  ENABLE_EMAIL: false,
};
