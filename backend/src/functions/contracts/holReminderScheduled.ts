import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getDb } from '../../config/firebaseAdmin.js';
import { FEATURES } from '../../config/features.js';
import { createEmailDispatcher } from '../../modules/email/index.js';
import { scanAndSendHolReminders } from '../../modules/contracts/index.js';

/**
 * Scheduled Cloud Function running every working day (Mon - Fri) at 10:00 AM (Asia/Ho_Chi_Minh / GMT+7).
 * Scans contracts in PENDING_HOL and dispatches reminder email to Head (CC User)
 * if overdue by >= 2 business days.
 */
export const holReminderScheduled = onSchedule(
  {
    schedule: '0 10 * * 1-5',
    timeZone: 'Asia/Ho_Chi_Minh',
    memory: '512MiB',
  },
  async (_event) => {
    if (!FEATURES.ENABLE_EMAIL) {
      console.log('[holReminderScheduled] Email feature is disabled. Skipping reminder scan.');
      return;
    }

    const db = getDb();
    const dispatcher = createEmailDispatcher();
    const result = await scanAndSendHolReminders(db, dispatcher);

    console.log(
      `[holReminderScheduled] Quét nhắc duyệt hoàn tất: ${result.remindedCount}/${result.scannedCount} hợp đồng đã được gửi email nhắc Head.`
    );
  }
);
