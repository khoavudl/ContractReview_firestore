import * as admin from 'firebase-admin';
import type { ContractDocument, UserDocument } from '../../types/index.js';
import type {
  EmailDispatcher,
  EmailDispatcherResult,
  EmailRecipients,
  EmailTemplateType,
} from './emailTypes.js';
import { buildContractEmail } from './emailTemplates.js';

/**
 * Queries active staff emails by role from Firestore /users collection.
 */
async function fetchStaffEmailsByRole(
  db: FirebaseFirestore.Firestore,
  role: 'LEGAL' | 'HOL'
): Promise<string[]> {
  const snap = await db
    .collection('users')
    .where('role', '==', role)
    .where('isActive', '==', true)
    .get();

  return snap.docs
    .map((d) => (d.data() as UserDocument).email)
    .filter((e) => Boolean(e && e.includes('@')));
}

/**
 * Resolves To and CC recipient lists based on the workflow template type.
 * Follows SRP with <= 25 lines of logic.
 */
export async function resolveRecipients(
  db: FirebaseFirestore.Firestore,
  templateType: EmailTemplateType,
  creatorEmail: string
): Promise<EmailRecipients> {
  const legalEmails = await fetchStaffEmailsByRole(db, 'LEGAL');
  const holEmails = await fetchStaffEmailsByRole(db, 'HOL');

  if (templateType === 'NEW_SUBMISSION' || templateType === 'RESUBMISSION') {
    return { to: legalEmails, cc: creatorEmail ? [creatorEmail] : undefined };
  }

  if (templateType === 'TASK_LIST_ASSIGNED') {
    return { to: creatorEmail ? [creatorEmail] : legalEmails, cc: legalEmails };
  }

  if (templateType === 'LEGAL_APPROVED') {
    return { to: holEmails.length > 0 ? holEmails : legalEmails, cc: legalEmails };
  }

  // HOL_COMMENTED and HOL_APPROVED notify both User and all staff
  return {
    to: creatorEmail ? [creatorEmail] : legalEmails,
    cc: Array.from(new Set([...legalEmails, ...holEmails])),
  };
}

/**
 * Records an immutable audit log when an email notification is successfully sent.
 */
async function recordEmailActivity(
  contractRef: FirebaseFirestore.DocumentReference,
  templateType: string,
  recipientSummary: string
): Promise<void> {
  const actRef = contractRef.collection('activities').doc();
  await actRef.set({
    activityId: actRef.id,
    action: 'EMAIL_SENT',
    performedBy: { uid: 'SYSTEM', displayName: 'Email Dispatcher', role: 'SYSTEM' },
    details: `Đã gửi email [${templateType}] tới: ${recipientSummary}`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Dispatches an automated workflow email with HTML Table layout and logs activity.
 * Follows SRP with <= 25 lines of logic.
 */
export async function dispatchContractEmail(
  db: FirebaseFirestore.Firestore,
  dispatcher: EmailDispatcher,
  contract: Pick<ContractDocument, 'contractId' | 'title' | 'supplier' | 'createdBy'>,
  templateType: EmailTemplateType,
  actorName: string,
  extraNote?: string,
  appBaseUrl?: string
): Promise<EmailDispatcherResult> {
  const recipients = await resolveRecipients(db, templateType, contract.createdBy?.email);
  if (!recipients.to || recipients.to.length === 0) {
    return { success: false, error: 'NO_VALID_RECIPIENTS: Không tìm thấy email người nhận phù hợp.' };
  }

  const { subject, html } = buildContractEmail(
    templateType,
    { contractId: contract.contractId, title: contract.title, supplier: contract.supplier },
    actorName,
    extraNote,
    appBaseUrl
  );

  const result = await dispatcher.send({
    to: recipients.to,
    cc: recipients.cc,
    subject,
    html,
  });

  if (result.success) {
    const contractRef = db.collection('contracts').doc(contract.contractId);
    await recordEmailActivity(contractRef, templateType, recipients.to.join(', ')).catch(() => {});
  }

  return result;
}
