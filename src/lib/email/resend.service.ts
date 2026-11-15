import { Resend } from 'resend';
import crypto from 'crypto';

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'MediCare Connect <onboarding@resend.dev>';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Server-only Resend Email Service.
 * Protects RESEND_API_KEY from exposure, supports idempotency headers,
 * provides plain-text alternatives, and handles simulated test execution safely.
 */
export async function sendEmailViaResend(
  to: string,
  content: EmailContent,
  eventIdentifier?: string
): Promise<SendEmailResult> {
  if (!to || !to.includes('@')) {
    return { success: false, error: `Invalid recipient email address: "${to}"` };
  }

  // Check if a real Resend API key is configured
  const isRealKey = RESEND_API_KEY && RESEND_API_KEY.startsWith('re_') && !RESEND_API_KEY.includes('placeholder');

  if (!isRealKey) {
    // Graceful simulated delivery mode for testing and sandbox environments
    const simulatedMessageId = `resend_sim_${crypto.randomUUID()}`;
    return {
      success: true,
      messageId: simulatedMessageId,
      simulated: true,
    };
  }

  try {
    const resend = new Resend(RESEND_API_KEY);

    const headers: Record<string, string> = {};
    if (eventIdentifier) {
      headers['X-Entity-Ref-ID'] = eventIdentifier;
    }

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: [to.trim()],
      subject: content.subject,
      html: content.html,
      text: content.text,
      headers,
    });

    if (error || !data) {
      return {
        success: false,
        error: error?.message || 'Resend provider returned empty response.',
      };
    }

    return {
      success: true,
      messageId: data.id,
      simulated: false,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
