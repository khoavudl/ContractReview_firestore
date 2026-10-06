import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getDb } from '../../config/firebaseAdmin.js';
import { autoArchiveExpiredContracts } from '../../modules/contracts/index.js';

/**
 * Scheduled Cloud Function running once a month at 00:00 on day 1 (Asia/Ho_Chi_Minh).
 * Auto-archives HOL_APPROVED contracts older than 45 days.
 */
export const autoArchiveScheduled = onSchedule(
  {
    schedule: '0 0 1 * *',
    timeZone: 'Asia/Ho_Chi_Minh',
    memory: '512MiB',
  },
  async (_event) => {
    const db = getDb();
    const result = await autoArchiveExpiredContracts(db);
    console.log(
      `[AutoArchive] Quét lưu trữ hoàn tất: ${result.archivedCount}/${result.scannedCount} hợp đồng đã được lưu trữ tự động.`
    );
  }
);
