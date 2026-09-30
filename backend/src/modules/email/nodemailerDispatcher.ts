import nodemailer from 'nodemailer';
import type {
  EmailDispatcher,
  EmailPayload,
  EmailDispatcherResult,
} from './emailTypes.js';

/**
 * Production Gmail SMTP dispatcher using Nodemailer.
 */
export class NodemailerDispatcher implements EmailDispatcher {
  private transporter: nodemailer.Transporter;

  constructor() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  async send(payload: EmailPayload): Promise<EmailDispatcherResult> {
    try {
      const info = await this.transporter.sendMail({
        from: `"Contract Review System" <${process.env.SMTP_USER || 'no-reply@foodempire.vn'}>`,
        to: payload.to.join(', '),
        cc: payload.cc && payload.cc.length > 0 ? payload.cc.join(', ') : undefined,
        subject: payload.subject,
        html: payload.html,
      });

      return { success: true, messageId: info.messageId };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[NodemailerDispatcher] Failed to send email: ${msg}`);
      return { success: false, error: msg };
    }
  }
}

/**
 * Local development / fallback dispatcher that logs emails to console.
 */
export class ConsoleEmailDispatcher implements EmailDispatcher {
  async send(payload: EmailPayload): Promise<EmailDispatcherResult> {
    console.log(
      `[ConsoleEmailDispatcher] TO: [${payload.to.join(', ')}] | CC: [${payload.cc?.join(', ') || 'none'}] | SUBJECT: ${payload.subject}`
    );
    return { success: true, messageId: `console-${Date.now()}` };
  }
}

/**
 * Factory helper: Returns Nodemailer dispatcher if credentials are set,
 * otherwise falls back to ConsoleEmailDispatcher for safe local development.
 */
export function createEmailDispatcher(): EmailDispatcher {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return new NodemailerDispatcher();
  }
  return new ConsoleEmailDispatcher();
}
