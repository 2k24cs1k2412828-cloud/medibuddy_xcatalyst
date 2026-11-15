import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmailViaResend } from '@/lib/email/resend.service';
import { scheduleDueReminders } from '@/lib/email/notification-scheduler';
import {
  renderUpcomingDoseTemplate,
  renderMissedDoseTemplate,
  renderAppointmentReminderTemplate,
  renderUrgentSosTemplate,
  renderGeneralAssistanceTemplate,
  EmailContent,
} from '@/lib/email/templates';

/**
 * Validates the Authorization: Bearer <CRON_SECRET> header using timing-safe comparison.
 * Fails closed immediately if CRON_SECRET is unconfigured in production.
 */
function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    return false;
  }
  const expectedSecret = (secret || 'medicare-default-cron-secret-token-2026').trim();

  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return false;
  }

  const providedToken = authHeader.slice(7).trim();
  const providedBuf = Buffer.from(providedToken, 'utf-8');
  const expectedBuf = Buffer.from(expectedSecret, 'utf-8');

  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * Maps a database notification record to its formatted email template.
 */
function buildEmailContent(notification: any): EmailContent {
  const type = notification.notification_type;
  const subject = notification.subject || 'MediCare Connect Health Notification';
  const snippet = notification.message_snippet || '';

  switch (type) {
    case 'UPCOMING_DOSE':
      return renderUpcomingDoseTemplate({
        patientName: 'Robert Chen',
        medicationName: snippet.split(' ')[0] || 'Scheduled Prescription',
        dosage: 'As prescribed',
        scheduledTime: 'Due on schedule',
        instructions: snippet,
      });

    case 'MISSED_DOSE':
      return renderMissedDoseTemplate({
        patientName: 'Robert Chen',
        medicationName: snippet.split(' ')[0] || 'Prescribed medication',
        scheduledTime: 'Earlier today',
        gracePeriodMinutes: 30,
      });

    case 'APPOINTMENT_REMINDER':
      return renderAppointmentReminderTemplate({
        patientName: 'Robert Chen',
        doctorName: 'Dr. Arthur Vance, MD',
        specialty: 'Cardiology',
        clinicHospital: 'St. Jude Medical Centre',
        appointmentDateTime: 'Thursday at 10:30 AM',
        instructions: snippet || 'Fast 8 hours prior to visit.',
      });

    case 'ASSISTANCE_ALERT':
      if (notification.max_attempts >= 5 || subject.includes('URGENT')) {
        return renderUrgentSosTemplate({
          patientName: 'Robert Chen',
          category: 'Emergency / SOS',
          message: snippet || 'Patient requested immediate assistance via tablet kiosk.',
          emergencyContactName: 'David Chen (Son)',
          emergencyContactPhone: '+1 (555) 234-5678',
        });
      }
      return renderGeneralAssistanceTemplate({
        patientName: 'Robert Chen',
        category: 'Care Inquiry',
        message: snippet || 'Patient submitted a question regarding medications.',
      });

    default:
      return {
        subject,
        html: `<p>${snippet || subject}</p>`,
        text: snippet || subject,
      };
  }
}

async function handleWorkerExecution(request: NextRequest) {
  // 1. Enforce strict timing-safe authorization
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing CRON_SECRET authorization bearer token.' },
      { status: 401 }
    );
  }

  const workerId = crypto.randomUUID();
  const admin = createAdminClient();

  // 2. Schedule any newly due medication or clinic reminders
  const scheduleStats = await scheduleDueReminders();

  let claimedCount = 0;
  let sentCount = 0;
  let failedCount = 0;

  try {
    // 3. Atomically claim due notifications using the database RPC (with stale sweep and FOR UPDATE SKIP LOCKED)
    const { data: claimedBatch, error: claimError } = await admin.rpc(
      'claim_notifications_batch',
      {
        p_worker_id: workerId,
        p_limit: 25,
      }
    );

    if (claimError) {
      return NextResponse.json(
        {
          success: false,
          error: `Claim RPC failed: ${claimError.message}`,
          worker_id: workerId,
        },
        { status: 500 }
      );
    }

    const notifications = claimedBatch || [];
    claimedCount = notifications.length;

    // 4. Process claimed notifications with bounded concurrency (5 parallel dispatches)
    // Minimizes worker execution latency while preventing network socket exhaustion
    const CONCURRENCY_LIMIT = 5;
    for (let i = 0; i < notifications.length; i += CONCURRENCY_LIMIT) {
      const chunk = notifications.slice(i, i + CONCURRENCY_LIMIT);
      await Promise.allSettled(
        chunk.map(async (notification: any) => {
          const emailContent = buildEmailContent(notification);

          // Dispatch external HTTP request to Resend
          const sendResult = await sendEmailViaResend(
            notification.recipient_email,
            emailContent,
            notification.event_identifier
          );

          if (sendResult.success && sendResult.messageId) {
            // Complete delivery atomically only if worker still owns the claim
            await admin.rpc('complete_notification_delivery', {
              p_notification_id: notification.id,
              p_worker_id: workerId,
              p_external_id: sendResult.messageId,
            });
            sentCount++;
          } else {
            // Record failure and apply bounded exponential backoff
            await admin.rpc('fail_notification_delivery', {
              p_notification_id: notification.id,
              p_worker_id: workerId,
              p_error_log: sendResult.error || 'Failed to dispatch via Resend provider',
            });
            failedCount++;
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      worker_id: workerId,
      scheduled_scan: scheduleStats,
      claimed: claimedCount,
      sent: sentCount,
      failed: failedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: String(err),
        worker_id: workerId,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleWorkerExecution(request);
}

export async function POST(request: NextRequest) {
  return handleWorkerExecution(request);
}
