import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { getDb, getStorageBucket } from '../../config/firebaseAdmin.js';
import {
  processVersionUpload,
  DefaultDocxToPdfConverter,
} from '../../modules/converter/index.js';

const converter = new DefaultDocxToPdfConverter();

/**
 * Cloud Function v2 Storage Trigger: onVersionUploaded
 * Automatically converts uploaded version .docx to .pdf previews.
 */
export const onVersionUploaded = onObjectFinalized(
  { cpu: 1, memory: '1GiB' },
  async (event) => {
    const filePath = event.data.name;
    if (!filePath) {
      return;
    }

    await processVersionUpload(
      getStorageBucket(),
      getDb(),
      filePath,
      converter
    );
  }
);
