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
}

export const FEATURE_FLAGS: FrontendFeatureFlags = {
  ENABLE_NOTIFICATIONS: false,
};
