export type EmailTemplateType =
  | 'NEW_SUBMISSION'
  | 'TASK_LIST_ASSIGNED'
  | 'RESUBMISSION'
  | 'LEGAL_APPROVED'
  | 'HOL_COMMENTED'
  | 'HOL_APPROVED';

export interface EmailPayload {
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
}

export interface EmailDispatcherResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Strategy pattern interface for sending emails.
 */
export interface EmailDispatcher {
  send(payload: EmailPayload): Promise<EmailDispatcherResult>;
}

export interface EmailRecipients {
  to: string[];
  cc?: string[];
}
