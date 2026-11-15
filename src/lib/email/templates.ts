/**
 * MediCare Connect - Accessible, Privacy-Conscious Email Templates
 * Compliant with healthcare privacy: excludes unnecessary clinical diagnosis codes.
 */

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const EMAIL_BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #1e293b;
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 16px;
  background-color: #f8fafc;
`;

const HEADER_HTML = `
  <div style="background-color: #0f766e; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
      MediCare Connect
    </h1>
    <p style="color: #ccfbf1; margin: 4px 0 0 0; font-size: 13px; font-weight: 600;">
      Elderly Care & Medication Safety Ecosystem
    </p>
  </div>
`;

const FOOTER_HTML = `
  <div style="padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; margin-top: 24px;">
    <p style="margin: 0 0 6px 0;">This is an automated healthcare dispatch from MediCare Connect.</p>
    <p style="margin: 0;">For urgent medical emergencies, immediately contact local emergency services (911) or your primary clinical team.</p>
  </div>
`;

/**
 * 1. Upcoming Medication Reminder
 */
export function renderUpcomingDoseTemplate(data: {
  patientName: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  instructions?: string;
}): EmailContent {
  const subject = `Medication Reminder: ${data.patientName}'s scheduled dose at ${data.scheduledTime}`;

  const html = `
    <div style="${EMAIL_BASE_STYLES}">
      ${HEADER_HTML}
      <div style="background-color: #ffffff; padding: 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <span style="background-color: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
          Upcoming Medication Dose
        </span>
        <h2 style="color: #0f172a; margin: 16px 0 8px 0; font-size: 20px; font-weight: 800;">
          Dose Due for ${data.patientName}
        </h2>
        <p style="font-size: 15px; color: #334155; margin: 0 0 20px 0;">
          A scheduled prescription is ready to be taken:
        </p>
        <div style="background-color: #f1f5f9; border-left: 4px solid #0f766e; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
          <p style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: #0f172a;">${data.medicationName} (${data.dosage})</p>
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #475569;"><strong>Scheduled Time:</strong> ${data.scheduledTime}</p>
          ${data.instructions ? `<p style="margin: 0; font-size: 14px; color: #475569;"><strong>Instructions:</strong> ${data.instructions}</p>` : ''}
        </div>
        <p style="font-size: 14px; color: #64748b; margin: 0;">
          Please confirm adherence through the MediCare Connect patient tablet kiosk or caretaker portal.
        </p>
      </div>
      ${FOOTER_HTML}
    </div>
  `;

  const text = `
MediCare Connect - Upcoming Medication Reminder
Patient: ${data.patientName}
Medication: ${data.medicationName} (${data.dosage})
Scheduled Time: ${data.scheduledTime}
Instructions: ${data.instructions || 'Take as prescribed'}

Please confirm adherence through the MediCare Connect patient kiosk.
  `.trim();

  return { subject, html, text };
}

/**
 * 2. Missed Medication Alert
 */
export function renderMissedDoseTemplate(data: {
  patientName: string;
  medicationName: string;
  scheduledTime: string;
  gracePeriodMinutes: number;
}): EmailContent {
  const subject = `⚠️ Alert: ${data.patientName} has an overdue medication dose`;

  const html = `
    <div style="${EMAIL_BASE_STYLES}">
      ${HEADER_HTML}
      <div style="background-color: #ffffff; padding: 28px; border: 1px solid #fed7aa; border-top: none; border-radius: 0 0 12px 12px;">
        <span style="background-color: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
          Overdue Dose Notice
        </span>
        <h2 style="color: #9a3412; margin: 16px 0 8px 0; font-size: 20px; font-weight: 800;">
          Medication Overdue for ${data.patientName}
        </h2>
        <p style="font-size: 15px; color: #334155; margin: 0 0 20px 0;">
          A scheduled dose was not confirmed within the ${data.gracePeriodMinutes}-minute clinical grace window:
        </p>
        <div style="background-color: #fffaf5; border-left: 4px solid #ea580c; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
          <p style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: #9a3412;">${data.medicationName}</p>
          <p style="margin: 0; font-size: 14px; color: #7c2d12;"><strong>Original Scheduled Time:</strong> ${data.scheduledTime}</p>
        </div>
        <p style="font-size: 14px; color: #475569; margin: 0 0 12px 0;">
          Please check in with the patient or confirm whether the dose was taken outside the platform.
        </p>
      </div>
      ${FOOTER_HTML}
    </div>
  `;

  const text = `
MediCare Connect - Overdue Medication Notice
Patient: ${data.patientName}
Medication: ${data.medicationName}
Scheduled Time: ${data.scheduledTime}
Grace Window: ${data.gracePeriodMinutes} minutes exceeded without confirmation.

Please check in with the patient or caretaker portal.
  `.trim();

  return { subject, html, text };
}

/**
 * 3. Doctor Appointment Reminder
 */
export function renderAppointmentReminderTemplate(data: {
  patientName: string;
  doctorName: string;
  specialty?: string;
  clinicHospital: string;
  appointmentDateTime: string;
  instructions?: string;
}): EmailContent {
  const subject = `Upcoming Clinical Visit: ${data.patientName} with ${data.doctorName}`;

  const html = `
    <div style="${EMAIL_BASE_STYLES}">
      ${HEADER_HTML}
      <div style="background-color: #ffffff; padding: 28px; border: 1px solid #bfdbfe; border-top: none; border-radius: 0 0 12px 12px;">
        <span style="background-color: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
          Upcoming Appointment
        </span>
        <h2 style="color: #1e3a8a; margin: 16px 0 8px 0; font-size: 20px; font-weight: 800;">
          Clinical Visit Scheduled
        </h2>
        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin: 16px 0 24px 0;">
          <p style="margin: 0 0 6px 0; font-size: 17px; font-weight: 700; color: #0f172a;">${data.doctorName} ${data.specialty ? `(${data.specialty})` : ''}</p>
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #334155;"><strong>Date & Time:</strong> ${data.appointmentDateTime}</p>
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #334155;"><strong>Location:</strong> ${data.clinicHospital}</p>
          ${data.instructions ? `<p style="margin: 0; font-size: 13px; color: #64748b;"><strong>Preparation Note:</strong> ${data.instructions}</p>` : ''}
        </div>
      </div>
      ${FOOTER_HTML}
    </div>
  `;

  const text = `
MediCare Connect - Appointment Reminder
Patient: ${data.patientName}
Provider: ${data.doctorName} (${data.specialty || 'General'})
Date/Time: ${data.appointmentDateTime}
Location: ${data.clinicHospital}
Instructions: ${data.instructions || 'Bring health record'}
  `.trim();

  return { subject, html, text };
}

/**
 * 4. Emergency SOS & Urgent Assistance Alert (High Priority)
 */
export function renderUrgentSosTemplate(data: {
  patientName: string;
  category: string;
  message: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}): EmailContent {
  const subject = `🚨 URGENT HEALTHCARE ALERT: ${data.patientName} requested immediate assistance`;

  const html = `
    <div style="${EMAIL_BASE_STYLES}">
      <div style="background-color: #b91c1c; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
          🚨 URGENT ASSISTANCE DISPATCH
        </h1>
        <p style="color: #fecaca; margin: 4px 0 0 0; font-size: 13px; font-weight: 700;">
          Priority Alert &bull; Immediate Action Required
        </p>
      </div>
      <div style="background-color: #ffffff; padding: 28px; border: 2px solid #ef4444; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #991b1b; margin: 0 0 12px 0; font-size: 20px; font-weight: 800;">
          ${data.patientName} Triggered an Emergency Help Alert
        </h2>
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
          <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #7f1d1d;"><strong>Category:</strong> ${data.category}</p>
          <p style="margin: 0; font-size: 15px; color: #991b1b;"><strong>Message:</strong> &ldquo;${data.message}&rdquo;</p>
        </div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #334155;">Primary Emergency Contact:</p>
          <p style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">${data.emergencyContactName} &bull; ${data.emergencyContactPhone}</p>
        </div>
        <p style="font-size: 14px; color: #b91c1c; font-weight: 700; margin: 0;">
          Please immediately verify the patient's status by phone or in person.
        </p>
      </div>
      ${FOOTER_HTML}
    </div>
  `;

  const text = `
🚨 EMERGENCY ASSISTANCE DISPATCH - MediCare Connect
Patient: ${data.patientName}
Category: ${data.category}
Message: ${data.message}
Emergency Contact: ${data.emergencyContactName} (${data.emergencyContactPhone})

IMMEDIATE ACTION: Please contact the patient or dispatch assistance immediately.
  `.trim();

  return { subject, html, text };
}

/**
 * 5. General Assistance Request (Refill / Schedule Question)
 */
export function renderGeneralAssistanceTemplate(data: {
  patientName: string;
  category: string;
  message: string;
}): EmailContent {
  const subject = `Patient Request: ${data.patientName} submitted a ${data.category.toLowerCase().replace('_', ' ')} inquiry`;

  const html = `
    <div style="${EMAIL_BASE_STYLES}">
      ${HEADER_HTML}
      <div style="background-color: #ffffff; padding: 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <span style="background-color: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
          Care Circle Inquiry
        </span>
        <h2 style="color: #0f172a; margin: 16px 0 8px 0; font-size: 20px; font-weight: 800;">
          Assistance Request from ${data.patientName}
        </h2>
        <div style="background-color: #f8fafc; border-left: 4px solid #64748b; padding: 16px; border-radius: 4px; margin: 16px 0 20px 0;">
          <p style="margin: 0; font-size: 15px; color: #1e293b;">&ldquo;${data.message}&rdquo;</p>
        </div>
        <p style="font-size: 14px; color: #64748b; margin: 0;">
          You can review and resolve this request in the Caretaker Dashboard.
        </p>
      </div>
      ${FOOTER_HTML}
    </div>
  `;

  const text = `
MediCare Connect - Assistance Request
Patient: ${data.patientName}
Category: ${data.category}
Message: ${data.message}

Please review in your MediCare Connect dashboard.
  `.trim();

  return { subject, html, text };
}
