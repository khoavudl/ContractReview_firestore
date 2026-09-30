/**
 * Script: generatePreviewPdf.ts
 * Generates a preview PDF for an uploaded contract Word (.docx) document
 * Usage: npx tsx scripts/generatePreviewPdf.ts [contractId] [versionId]
 */

import { getFirebaseAdmin, getDb, getStorageBucket } from '../src/config/firebaseAdmin.js';
import { processVersionUpload, DefaultDocxToPdfConverter } from '../src/modules/converter/index.js';

async function main(): Promise<void> {
  const contractId = process.argv[2] || 'CTR-2609-0002';
  const versionId = process.argv[3] || 'v1';

  console.log(`[generatePreviewPdf] Processing contract ${contractId} (version: ${versionId})...`);

  // Initialize admin SDK
  getFirebaseAdmin();
  const db = getDb();
  const bucket = getStorageBucket();
  const converter = new DefaultDocxToPdfConverter();

  const filePath = `contracts/${contractId}/versions/${versionId}.docx`;
  const result = await processVersionUpload(bucket, db, filePath, converter);

  if (result?.success) {
    console.log(`[generatePreviewPdf] SUCCESS! Generated preview PDF: ${result.previewPdfPath}`);
  } else {
    console.error(`[generatePreviewPdf] FAILED: ${result?.error || 'Unknown error'}`);
  }
}

main().catch((err) => {
  console.error('[generatePreviewPdf] Fatal error:', err);
  process.exit(1);
});
