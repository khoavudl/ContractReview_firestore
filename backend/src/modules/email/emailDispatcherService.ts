import { FieldValue } from 'firebase-admin/firestore';
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
 * Resolves To and CC recipient lists based on the workflow template type:
 * - User submit to Legal (NEW_SUBMISSION, RESUBMISSION): Legal only (no CC).
 * - Legal returns to User (TASK_LIST_ASSIGNED): User as TO, Viewers as CC.
 * - Legal submit to Head (LEGAL_APPROVED): Head as TO, User & Viewers as CC.
 * - Head approve or reject (HOL_APPROVED, HOL_COMMENTED): User as TO, Legal & Viewers as CC.
 * Any email sent to or CC'ing creatorEmail also CCs viewerEmails.
 * Follows SRP with <= 25 lines of logic.
 */
export async function resolveRecipients(
  db: FirebaseFirestore.Firestore,
  templateType: EmailTemplateType,
  creatorEmail: string,
  viewerEmails?: readonly string[]
): Promise<EmailRecipients> {
  const legalEmails = await fetchStaffEmailsByRole(db, 'LEGAL');
  const holEmails = await fetchStaffEmailsByRole(db, 'HOL');

  if (templateType === 'NEW_SUBMISSION' || templateType === 'RESUBMISSION') {
    return { to: legalEmails };
  }

  const cleanViewers = (viewerEmails || [])
    .map((e) => e.trim().toLowerCase())
    .filter((e) => Boolean(e && e.includes('@')));

  if (templateType === 'TASK_LIST_ASSIGNED') {
    const to = creatorEmail ? [creatorEmail] : legalEmails;
    const cc = cleanViewers.filter((e) => !to.includes(e));
    return { to, cc: cc.length > 0 ? cc : undefined };
  }

  if (templateType === 'LEGAL_APPROVED' || templateType === 'HOL_REMINDER') {
    const to = holEmails.length > 0 ? holEmails : legalEmails;
    const rawCc = creatorEmail ? [creatorEmail, ...cleanViewers] : cleanViewers;
    const cc = Array.from(new Set(rawCc)).filter((e) => !to.includes(e));
    return { to, cc: cc.length > 0 ? cc : undefined };
  }

  // HOL_COMMENTED (Head reject) and HOL_APPROVED (Head approve): TO User, CC Legal & Viewers
  const to = creatorEmail ? [creatorEmail] : (holEmails.length > 0 ? holEmails : legalEmails);
  const rawCc = [...legalEmails, ...cleanViewers];
  const cc = Array.from(new Set(rawCc)).filter((email) => !to.includes(email));

  return {
    to,
    cc: cc.length > 0 ? cc : undefined,
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
    timestamp: FieldValue.serverTimestamp(),
  });
}

/**
 * Dispatches an automated workflow email with HTML Table layout and logs activity.
 * Follows SRP with <= 25 lines of logic.
 */
export async function dispatchContractEmail(
  db: FirebaseFirestore.Firestore,
  dispatcher: EmailDispatcher,
  contract: Pick<ContractDocument, 'contractId' | 'title' | 'supplier' | 'createdBy'> & {
    viewerEmails?: readonly string[];
  },
  templateType: EmailTemplateType,
  actorName: string,
  extraNote?: string,
  appBaseUrl?: string
): Promise<EmailDispatcherResult> {
  const recipients = await resolveRecipients(
    db,
    templateType,
    contract.createdBy?.email,
    contract.viewerEmails
  );
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
