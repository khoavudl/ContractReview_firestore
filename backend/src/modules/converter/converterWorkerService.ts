import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { DocxToPdfConverter, ConversionResult } from './converterTypes.js';
import { parseVersionUploadPath, buildPreviewPdfPath } from './pathParser.js';

/**
 * Downloads the source .docx file buffer from Google Cloud Storage.
 */
async function downloadFileBuffer(
  bucket: ReturnType<admin.storage.Storage['bucket']>,
  filePath: string
): Promise<Buffer> {
  const [buffer] = await bucket.file(filePath).download();
  return buffer;
}

/**
 * Uploads converted PDF buffer to GCS previews directory.
 */
async function uploadPreviewPdf(
  bucket: ReturnType<admin.storage.Storage['bucket']>,
  previewPath: string,
  pdfBuffer: Buffer
): Promise<void> {
  const file = bucket.file(previewPath);
  await file.save(pdfBuffer, {
    contentType: 'application/pdf',
    resumable: false,
  });
}

/**
 * Logs preview generation or failure to contract audit activities.
 */
async function recordPreviewActivity(
  contractRef: FirebaseFirestore.DocumentReference,
  action: 'PREVIEW_GENERATED' | 'PREVIEW_FAILED',
  details: string
): Promise<void> {
  const actRef = contractRef.collection('activities').doc();
  await actRef.set({
    activityId: actRef.id,
    action,
    performedBy: {
      uid: 'SYSTEM',
      displayName: 'Docx Converter Worker',
      role: 'SYSTEM',
    },
    details,
    timestamp: FieldValue.serverTimestamp(),
  });
}

/**
 * Updates Firestore contract and version documents with previewPdfPath.
 */
async function updateFirestorePreview(
  db: FirebaseFirestore.Firestore,
  contractId: string,
  versionId: string,
  previewPdfPath: string
): Promise<void> {
  const contractRef = db.collection('contracts').doc(contractId);
  await contractRef.update({
    'currentVersionFile.previewPdfPath': previewPdfPath,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const versionRef = contractRef.collection('versions').doc(versionId);
  const verSnap = await versionRef.get();
  if (verSnap.exists) {
    await versionRef.update({ previewPdfPath });
  }
}

/**
 * Orchestrates downloading docx, converting to pdf, uploading to previews,
 * and updating Firestore. Returns null if file is not an uploaded version docx.
 * Follows SRP with <= 25 lines of logic.
 */
export async function processVersionUpload(
  bucket: ReturnType<admin.storage.Storage['bucket']>,
  db: FirebaseFirestore.Firestore,
  filePath: string,
  converter: DocxToPdfConverter
): Promise<ConversionResult | null> {
  const parsed = parseVersionUploadPath(filePath);
  if (!parsed) {
    return null;
  }

  const contractRef = db.collection('contracts').doc(parsed.contractId);
  const previewPdfPath = buildPreviewPdfPath(parsed.contractId, parsed.versionFileName);

  try {
    const docxBuffer = await downloadFileBuffer(bucket, filePath);
    const pdfBuffer = await converter.convert(docxBuffer);
    await uploadPreviewPdf(bucket, previewPdfPath, pdfBuffer);
    await updateFirestorePreview(db, parsed.contractId, parsed.versionId, previewPdfPath);
    await recordPreviewActivity(contractRef, 'PREVIEW_GENERATED', `Đã tạo bản PDF xem trước ${previewPdfPath}`);

    return {
      success: true,
      contractId: parsed.contractId,
      versionFileName: parsed.versionFileName,
      previewPdfPath,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[processVersionUpload] Failed to convert ${filePath}: ${msg}`);
    await recordPreviewActivity(contractRef, 'PREVIEW_FAILED', `Lỗi tạo PDF xem trước: ${msg}`).catch(() => {});

    return {
      success: false,
      contractId: parsed.contractId,
      versionFileName: parsed.versionFileName,
      error: msg,
    };
  }
}
