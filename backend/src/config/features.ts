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
}

export const FEATURES: BackendFeatureFlags = {
  ENABLE_NOTIFICATIONS: false,
};
